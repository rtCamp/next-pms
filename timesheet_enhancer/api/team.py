import json

import frappe
from frappe.utils.data import add_days, nowdate

from .timesheet import get_timesheet_data
from .utils import get_week_dates, weekly_working_hours_for_employee

now = nowdate()


@frappe.whitelist()
def get_weekly_compact_view_data(
    date: str, max_week: int = 2, employee_name=None, department=None, project=None
):
    """Fetch the weekly data for employee based on reports to.
    example:
        {
        "start_date": "2024-05-20",
        "end_date": "2024-05-26",

        "dates": [
            {
                "key": "May 20 - May 26",
                "dates":["2024-05-20",..]
            }
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
    dates = []
    data = []

    for i in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week)
        if i == 0:
            end_date = week["end_date"]
        start_date = week["start_date"]
        date = add_days(start_date, -1)
        dates.append({"key": week["key"], "dates": week["dates"]})
    dates.reverse()
    res = {"start_date": start_date, "end_date": end_date, "dates": dates}

    employees = filter_employees(employee_name, department, project)

    for employee in employees:
        empData = {"timesheet": [], "leaves": [], "holidays": []}
        for i in dates:
            start_date = i["dates"][0]
            end_date = i["dates"][-1]
            weekly_data = weekly_working_hours_for_employee(
                employee.name, start_date, end_date
            )
            empData["timesheet"].extend(weekly_data["timesheets"])
            empData["leaves"].extend(weekly_data["leaves"])
            empData["holidays"].extend(weekly_data["holidays"])
        data.append({**employee, **empData})
    res["data"] = data

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


def filter_employees(employee_name=None, department=None, project=None):
    from frappe.query_builder import DocType

    fields = ["name", "image", "employee_name", "department"]
    employee_ids = None
    filters = {}
    if isinstance(department, str):
        department = json.loads(department)

    if isinstance(project, str):
        project = json.loads(project)

    if employee_name:
        filters["employee_name"] = ["like", f"%{employee_name}%"]

    if len(department) > 0:
        filters["department"] = ["in", department]

    if len(project) > 0:
        project_teams = DocType("Project Team")
        employee_ids = (
            frappe.qb.from_(project_teams)
            .select(project_teams.employee)
            .distinct()
            .where(project_teams.parent.isin(project))
            .where(project_teams.parenttype == "Project")
        ).run(as_dict=True)
        employee_ids = [emp.get("employee") for emp in employee_ids]
        filters["name"] = ["in", employee_ids]

    return frappe.get_list("Employee", fields=fields, filters=filters)
