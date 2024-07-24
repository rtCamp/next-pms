import frappe
from frappe.utils import nowdate
from frappe.utils.data import add_days, getdate

from .timesheet import get_timesheet_data
from .utils import get_week_dates, weekly_working_hours_for_employee

now = nowdate()


@frappe.whitelist()
def get_compact_view_data(
    date: str, max_week: int = 2, employee_name=None, department=None, project=None
):
    from .utils import filter_employees, get_leaves_for_employee

    employees = filter_employees(employee_name, department, project)
    dates = []
    data = {}

    for i in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)
    dates.reverse()
    data = {}
    res = {"dates": dates}

    for employee in employees:
        local_data = {**employee}

        local_data["data"] = []

        for date_info in dates:
            leaves = get_leaves_for_employee(
                from_date=date_info.get("start_date"),
                to_date=date_info.get("end_date"),
                employee=employee.name,
            )

            for date in date_info.get("dates"):
                hour = 0
                leave = list(
                    filter(
                        lambda data: data["from_date"] <= date <= data["to_date"],
                        leaves,
                    )
                )

                total_hours = frappe.get_value(
                    "Timesheet",
                    {
                        "employee": employee.name,
                        "start_date": date,
                        "end_date": date,
                    },
                    "total_hours",
                )
                if leave:
                    leave = leave[0]
                    if leave.get("half_day") and leave.get("half_day_date") == date:
                        hour += 4
                    else:
                        hour += 8

                if total_hours:
                    hour += total_hours

                local_data["data"].append(
                    {
                        "date": date,
                        "hour": hour,
                    }
                )
        data[employee.name] = local_data

    res["data"] = data
    return res


@frappe.whitelist()
def get_weekly_compact_view_data(date: str):
    """Fetch the weekly data for employee based on reports to.
    example:
        {
        "start_date": "2024-05-20",
        "end_date": "2024-05-26",
        "key": "May 20 - May 26",
        "dates": [
            "2024-05-20",
            ...
        ],
        "data": [
            {
                "name": "00385",
                "image": "image.png",
                "employee_name": "emp",
                "timesheets": [
                {
                    "total_hours": 0,
                    "start_date": "2024-05-23",
                    "end_date": "2024-05-23",
                    "status": "Draft",
                    "name": "TS-2024-00008"
                }
                ],
                "leaves": [],
                "holidays": [
                    "2024-05-25",
                    "2024-05-26"
                ]
            }
        ]
        }
    """
    employees = frappe.get_list("Employee", fields=["name", "image", "employee_name"])
    week = get_week_dates(date=date, current_week=True)

    res = {**week}
    data = []
    for employee in employees:
        weekly_data = weekly_working_hours_for_employee(
            employee.name, week["start_date"], week["end_date"]
        )
        data.append({**employee, **weekly_data})
    res["data"] = data
    res["key"] = (
        f'{week["start_date"].strftime("%b %d")} - {week["end_date"].strftime("%b %d")}'
    )
    res["employees"] = employees
    return res


@frappe.whitelist()
def get_weekly_team_view_data(date: str):
    data = {}

    data["summary"] = get_weekly_compact_view_data(date)
    data["data"] = {}
    for employee in data["summary"]["employees"]:
        data["data"][employee.name] = next(
            iter(get_timesheet_data(employee.name, date, 1).values())
        )

    return data
