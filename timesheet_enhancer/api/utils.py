import frappe
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week, nowdate

now = nowdate()


@frappe.whitelist()
def get_employee_from_user(user: str = None):
    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})

    if not employee:
        frappe.throw(frappe._("Employee not found"))
    return employee


@frappe.whitelist()
def get_current_user_roles(user: str = None):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles


def get_leaves_for_employee(from_date: str, to_date: str, employee: str):
    leave_application = frappe.qb.DocType("Leave Application")
    filtered_data = (
        frappe.qb.from_(leave_application)
        .select("*")
        .where(leave_application.employee == employee)
        .where(
            (leave_application.from_date >= from_date)
            & (leave_application.to_date <= to_date)
        )
        .where(leave_application.status.isin(["Open", "Approved"]))
    ).run(as_dict=True)

    return filtered_data


def weekly_working_hours_for_employee(employee: str, start_date: str, end_date: str):
    from hrms.hr.utils import get_holiday_dates_for_employee

    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
        },
        fields=["total_hours", "start_date", "end_date", "status", "name"],
    )
    leaves = get_leaves_for_employee(start_date, end_date, employee)
    holidays = get_holiday_dates_for_employee(employee, start_date, end_date)
    return {"timesheets": timesheets, "leaves": leaves, "holidays": holidays}


def get_week_dates(date, current_week: bool = False):
    """Returns the dates map with dates and other details.
    example:
        {
            "start_date": "2021-08-01",
            "end_date": "2021-08-07",
            "key": "Aug 01 - Aug 07",
            "dates": [
                "2021-08-01",
                "2021-08-02",
                ...
            ]
        }
    """

    dates = []
    data = {}

    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)

    key = (
        f'{start_date.strftime("%b %d")} - {end_date.strftime("%b %d")}'
        if not current_week
        else "This Week"
    )

    data = {"start_date": start_date, "end_date": end_date, "key": key}

    while start_date <= end_date:
        dates.append(start_date)
        start_date = add_days(start_date, 1)
    data["dates"] = dates
    return data


@frappe.whitelist()
def get_task_for_employee(employee: str = None):
    if not employee:
        employee = get_employee_from_user()
    project_team = frappe.qb.DocType("Project Team")
    projects = (
        frappe.qb.from_(project_team)
        .select("parent")
        .where(project_team.employee == employee)
        .run(as_dict=True)
    )
    project_list = [project["parent"] for project in projects]
    project_task = frappe.get_list(
        "Task",
        filters={"project": ["in", project_list]},
        fields=["name", "subject", "status", "project.project_name"],
    )
    names = [task["name"] for task in project_task]
    tasks = frappe.get_list(
        "Task",
        filters={"name": ["NOT IN", names]},
        fields=["name", "subject", "status", "project.project_name"],
    )

    return project_task + tasks
