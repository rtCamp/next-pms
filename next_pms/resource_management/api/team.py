import json

import frappe
from frappe.core.doctype.recorder.recorder import redis_cache
from frappe.utils import DATE_FORMAT

from next_pms.resource_management.api.utils.helpers import (
    find_worked_hours,
    get_allocation_objects,
    get_dates_date,
    get_employees_by_skills,
    handle_customer,
    is_on_leave,
    resource_api_permissions_check,
)
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.timesheet.api.employee import get_employee_working_hours
from next_pms.timesheet.api.team import get_holidays
from next_pms.timesheet.api.utils import filter_employees


@frappe.whitelist()
@redis_cache()
def get_resource_management_team_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    business_unit=None,
    designation=None,
    reports_to=None,
    is_billable=-1,
    page_length=10,
    start=0,
    skills=None,
    employee_id=None,
):
    permissions = resource_api_permissions_check()

    if not permissions["write"]:
        is_billable = -1
        business_unit = None
        designation = None
        reports_to = None
        customer = None
        employee_id = None

    data = []
    customer = {}
    dates = get_dates_date(max_week, date)
    res = {"dates": dates}

    ids = None

    if not skills:
        skills = []
    if isinstance(skills, str):
        skills = json.loads(skills)
    if skills:
        ids = get_employees_by_skills(skills)
        if len(ids) == 0:
            res["data"] = data
            res["customer"] = customer
            res["total_count"] = 0
            res["has_more"] = False
            res["permissions"] = permissions
            return res

    if employee_id:
        if isinstance(employee_id, str):
            employee_id = json.loads(employee_id)
        ids = employee_id

    employees, total_count = filter_employees(
        employee_name,
        business_unit=business_unit,
        designation=designation,
        page_length=page_length,
        reports_to=reports_to,
        start=start,
        status=["Active"],
        ignore_default_filters=True if len(skills) > 0 else False,
        ids=ids,
        ignore_permissions=True,
    )

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "employee_name",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
            "note",
        ],
        "employee",
        [employee.name for employee in employees],
        dates[0].get("start_date"),
        dates[-1].get("end_date"),
        is_billable,
    )

    # Make the map of resource allocation data for given employee
    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)

        # convert working hours in date format to hours per day
        daily_working_hours = (
            working_hours.get("working_hour")
            if working_hours.get("working_frequency") == "Per Day"
            else working_hours.get("working_hour") / 5
        )

        employee_resource_allocation = resource_allocation_map.get(employee.name, [])

        timesheet_data = frappe.get_all(
            "Timesheet",
            filters={
                "employee": ["=", employee.name],
                "start_date": [">=", dates[0].get("start_date")],
                "end_date": ["<=", dates[-1].get("end_date")],
            },
            fields=["employee", "start_date", "end_date", "total_hours", "parent_project", "customer"],
        )

        leaves = get_employee_leaves(
            employee=employee.name,
            start_date=dates[0].get("start_date"),
            end_date=dates[-1].get("end_date"),
        )

        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        all_dates_data, all_week_data, all_leave_data = {}, [], {}
        max_allocation_count_for_single_date = 0

        # For given employee loop through all the dates and calculate the total allocated hours, total working hours and total worked hours
        for date_info in dates:
            (
                total_working_hours_for_given_week,
                total_allocated_hours_for_given_week,
                total_worked_hours_for_given_week,
            ) = (0, 0, 0)

            for date in date_info.get("dates"):
                (
                    total_worked_hours_for_given_date,
                    total_working_hours_for_given_date,
                    total_allocated_hours_for_given_date,
                    total_allocation_count,
                ) = (0, daily_working_hours, 0, 0)

                employee_resource_allocation_for_given_date = []

                leave_object = is_on_leave(date, daily_working_hours, leaves, holidays)

                if leave_object.get("on_leave") and not leave_object.get("leave_work_hours"):
                    # If employee is on leave and not working on that day then total working hours will be 0
                    total_working_hours_for_given_date = 0
                else:
                    if leave_object.get("leave_work_hours"):
                        # Handle the half day leave hear
                        total_working_hours_for_given_date = leave_object.get("leave_work_hours")

                    # If employee is not on leave then calculate the total working hours for that day
                    for resource_allocation in employee_resource_allocation:
                        if (
                            resource_allocation.allocation_start_date <= date
                            and resource_allocation.allocation_end_date >= date
                        ):
                            customer = handle_customer(customer, resource_allocation.customer)

                            total_allocated_hours_for_given_date += resource_allocation.get("hours_allocated_per_day")
                            total_worked_hours_resource_allocation = find_worked_hours(
                                timesheet_data=timesheet_data, date=date, project=resource_allocation.project
                            )
                            total_worked_hours_for_given_date += total_worked_hours_resource_allocation
                            total_allocation_count += 1

                            employee_resource_allocation_for_given_date.append(
                                {
                                    "name": resource_allocation.name,
                                    "date": date,
                                    "total_worked_hours_resource_allocation": total_worked_hours_resource_allocation,
                                }
                            )

                if leave_object.get("on_leave"):
                    # If employee is on leave then leave hours calculation will come from subtracting total working hours from leave hours (total_working_hours_for_given_date)
                    all_leave_data[date.strftime(DATE_FORMAT)] = (
                        daily_working_hours - total_working_hours_for_given_date
                    )

                date_data = None

                if permissions["write"]:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "total_working_hours": total_working_hours_for_given_date,
                        "total_worked_hours": total_worked_hours_for_given_date,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                        "is_on_leave": leave_object.get("on_leave"),
                        "total_leave_hours": daily_working_hours - total_working_hours_for_given_date,
                        "total_allocation_count": total_allocation_count,
                    }

                else:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "total_working_hours": total_working_hours_for_given_date,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                        "is_on_leave": leave_object.get("on_leave"),
                        "total_leave_hours": daily_working_hours - total_working_hours_for_given_date,
                        "total_allocation_count": total_allocation_count,
                    }

                if date_data["total_allocation_count"] > 0 or date_data["is_on_leave"]:
                    all_dates_data[date_data["date"]] = date_data

                total_allocated_hours_for_given_week += total_allocated_hours_for_given_date
                total_working_hours_for_given_week += total_working_hours_for_given_date
                total_worked_hours_for_given_week += total_worked_hours_for_given_date
                max_allocation_count_for_single_date = max(max_allocation_count_for_single_date, total_allocation_count)

            if permissions["write"]:
                all_week_data.append(
                    {
                        "total_allocated_hours": total_allocated_hours_for_given_week,
                        "total_working_hours": total_working_hours_for_given_week,
                        "total_worked_hours": total_worked_hours_for_given_week,
                    }
                )
            else:
                all_week_data.append(
                    {
                        "total_allocated_hours": total_allocated_hours_for_given_week,
                        "total_working_hours": total_working_hours_for_given_week,
                    }
                )

        data.append(
            {
                **employee,
                **working_hours,
                "all_dates_data": all_dates_data,
                "all_week_data": all_week_data,
                "all_leave_data": all_leave_data,
                "employee_allocations": get_allocation_objects(employee_resource_allocation),
                "max_allocation_count_for_single_date": max_allocation_count_for_single_date,
                "employee_daily_working_hours": daily_working_hours,
            }
        )

    res["data"] = data
    res["customer"] = customer
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count
    res["permissions"] = permissions

    return res


@frappe.whitelist()
def get_leave_information(employee: str, start_date: str, end_date: str):
    """
    Get the leave information for given employee for given time range.
    """
    from next_pms.timesheet.api.employee import get_workable_days_for_employee

    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    return get_workable_days_for_employee(employee, start_date, end_date)
