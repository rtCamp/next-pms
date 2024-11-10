import frappe
from frappe.utils import nowdate
from frappe.utils.data import add_days, getdate

from frappe_pms.timesheet.api.employee import get_employee_working_hours
from frappe_pms.timesheet.api.team import get_week_dates

now = nowdate()


@frappe.whitelist()
def get_compact_view_data(
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

    for i in range(max_week):
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
    resource_allocation_data = frappe.get_all(
        "Resource Allocation",
        filters={
            "employee": ["in", employee_names],
            "allocation_start_date": [">=", dates[0].get("start_date")],
            "allocation_end_date": ["<=", dates[-1].get("end_date")],
        },
        fields="*",
    )

    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)

    data = []

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        daily_working_hours = (
            working_hours.get("working_hour")
            if working_hours.get("working_frequency") == "Per Day"
            else working_hours.get("working_hour") / 5
        )

        employee_resource_allocation = resource_allocation_map.get(employee.name, [])

        all_dates_data = []
        all_week_data = []

        for date_info in dates:
            total_working_hours = 0
            total_allocated_hours = 0

            for date in date_info.get("dates"):
                hour = 0
                total_hours = 0
                employee_resource_allocation_for_given_date = []

                for resource_allocation in employee_resource_allocation:
                    if (
                        resource_allocation.allocation_start_date <= date
                        and resource_allocation.allocation_end_date >= date
                    ):
                        total_hours += resource_allocation.get("hours_allocated_per_day")
                        employee_resource_allocation_for_given_date.append(resource_allocation)
                hour += total_hours

                all_dates_data.append(
                    {
                        "date": date,
                        "total_allocated_hours": hour,
                        "total_working_hours": daily_working_hours,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                    }
                )
                total_allocated_hours += hour
                total_working_hours += daily_working_hours

            all_week_data.append(
                {
                    "total_allocated_hours": total_allocated_hours,
                    "total_working_hours": total_working_hours,
                }
            )

        data.append(
            {
                **employee,
                **working_hours,
                "all_dates_data": all_dates_data,
                "all_week_data": all_week_data,
            }
        )

    res["data"] = data
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count

    return res


def filter_employee_list(
    employee_name=None,
    business_unit=None,
    page_length=10,
    start=0,
):
    from frappe_pms.timesheet.api.utils import filter_employees

    start = int(start)
    page_length = int(page_length)

    employees, count = filter_employees(
        employee_name,
        page_length=page_length,
        start=start,
    )

    return employees, count
