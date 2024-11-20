import frappe
from frappe.utils import DATE_FORMAT, nowdate
from frappe.utils.data import add_days, getdate

from next_pms.resource_management.api.team.helpers import (
    filter_employee_list,
    find_worked_hours,
    get_allocation_objects,
    handle_customer,
    is_on_leave,
)
from next_pms.resource_management.api.team.query import get_allocation_list_for_employee_for_given_range
from next_pms.timesheet.api.employee import get_employee_working_hours
from next_pms.timesheet.api.team import get_holidays, get_week_dates
from next_pms.timesheet.api.timesheet import get_leaves_for_employee

now = nowdate()


@frappe.whitelist()
def get_resource_management_team_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    business_unit=None,
    page_length=10,
    start=0,
):
    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates = []
    data = {}

    # fetch the currant and next week dates object
    for _ in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week, ignore_weekend=True)
        dates.append(week)
        date = add_days(getdate(week["end_date"]), 1)

    res = {"dates": dates}

    employees, total_count = filter_employee_list(
        employee_name,
        business_unit=business_unit,
        page_length=page_length,
        start=start,
    )

    employee_names = [employee.name for employee in employees]

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
        ],
        "employee",
        employee_names,
        dates[0].get("start_date"),
        dates[-1].get("end_date"),
    )

    # Make the map of resource allocation data for given employee
    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)

    data = []

    customer = {}

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
                "employee": ["in", employee_names],
                "start_date": [">=", dates[0].get("start_date")],
                "end_date": ["<=", dates[-1].get("end_date")],
            },
            fields=["employee", "start_date", "end_date", "total_hours", "parent_project", "customer"],
        )

        leaves = get_leaves_for_employee(
            from_date=add_days(dates[0].get("start_date"), -max_week * 7),
            to_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )

        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        all_dates_data = []
        all_week_data = []
        all_leave_data = {}
        max_allocation_count_for_single_date = 0

        # For given employee loop through all the dates and calculate the total allocated hours, total working hours and total worked hours
        for date_info in dates:
            total_working_hours_for_given_week = 0
            total_allocated_hours_for_given_week = 0
            total_worked_hours_for_given_week = 0

            for date in date_info.get("dates"):
                total_worked_hours_for_given_date = 0
                total_working_hours_for_given_date = daily_working_hours
                total_allocated_hours_for_given_date = 0
                total_allocation_count = 0

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

                all_dates_data.append(
                    {
                        "date": date,
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "total_working_hours": total_working_hours_for_given_date,
                        "total_worked_hours": total_worked_hours_for_given_date,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                        "is_on_leave": leave_object.get("on_leave"),
                        "total_leave_hours": daily_working_hours - total_working_hours_for_given_date,
                        "total_allocation_count": total_allocation_count,
                    }
                )

                total_allocated_hours_for_given_week += total_allocated_hours_for_given_date
                total_working_hours_for_given_week += total_working_hours_for_given_date
                total_worked_hours_for_given_week += total_worked_hours_for_given_date
                max_allocation_count_for_single_date = max(max_allocation_count_for_single_date, total_allocation_count)

            all_week_data.append(
                {
                    "total_allocated_hours": total_allocated_hours_for_given_week,
                    "total_working_hours": total_working_hours_for_given_week,
                    "total_worked_hours": total_worked_hours_for_given_week,
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
            }
        )

    res["data"] = data
    res["customer"] = customer
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count

    return res
