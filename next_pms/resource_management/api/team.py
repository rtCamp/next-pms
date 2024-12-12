import frappe
from frappe.utils import DATE_FORMAT, date_diff, getdate

from next_pms.resource_management.api.utils.helpers import (
    filter_employee_list,
    find_worked_hours,
    get_allocation_objects,
    get_dates_date,
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


@frappe.whitelist()
def get_resource_management_team_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    business_unit=None,
    designation=None,
    is_billable=-1,
    page_length=10,
    start=0,
):
    permissions = resource_api_permissions_check()

    data = []
    customer = {}
    dates = get_dates_date(max_week, date)
    res = {"dates": dates}

    employees, total_count = filter_employee_list(
        employee_name,
        business_unit=business_unit,
        designation=designation,
        page_length=page_length,
        start=start,
        status=["Active"],
        ignore_permissions=True,
    )

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

        all_dates_data, all_week_data, all_leave_data = [], [], {}
        max_allocation_count_for_single_date = 0
        week_index = 0

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
                        "week_index": week_index,
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
            week_index += 1

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
    res["permissions"] = permissions

    return res


@frappe.whitelist()
def get_leave_information(employee: str, start_date: str, end_date: str):
    """
    Get the leave information for given employee for given time range.
    """

    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    if not employee or not start_date or not end_date:
        return None

    start_date = getdate(start_date)
    end_date = getdate(end_date)

    leave_applications = get_employee_leaves(employee, start_date, end_date)

    total_leave_hours = 0

    holidays = get_holidays(employee, start_date, end_date)

    for leave in leave_applications:
        current_start_date = max(start_date, leave.from_date)
        currnet_end_date = min(end_date, leave.to_date)

        total_leave_hours += date_diff(currnet_end_date, current_start_date) + 1

        if leave.get("half_day"):
            if leave.get("half_day_date") >= current_start_date and leave.get("half_day_date") <= currnet_end_date:
                total_leave_hours -= 0.5

        for holiday in holidays:
            if holiday.holiday_date >= current_start_date and holiday.holiday_date <= currnet_end_date:
                total_leave_hours -= 1

    return {
        "total_days": date_diff(end_date, start_date) + 1,
        "total_working_days": date_diff(end_date, start_date) + 1 - total_leave_hours - len(holidays),
        "leave_days": total_leave_hours + len(holidays),
    }
