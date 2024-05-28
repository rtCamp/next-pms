import frappe

from .utils import get_week_dates, weekly_working_hours_for_employee


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
    return res
