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


def get_user_from_employee(employee: str):
    return frappe.get_value("Employee", employee, "user_id")


@frappe.whitelist()
def get_employee_working_hours(employee: str = None):
    if not employee:
        employee = get_employee_from_user()
    working_hour, working_frequency = frappe.get_value(
        "Employee",
        employee,
        ["custom_working_hours", "custom_work_schedule"],
    )
    if not working_hour:
        working_hour = frappe.db.get_single_value(
            "HR Settings", "standard_working_hours"
        )
    if not working_frequency:
        working_frequency = "Per Day"
    return {"working_hour": working_hour or 8, "working_frequency": working_frequency}


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
def app_logo():
    from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

    return get_app_logo()


@frappe.whitelist()
def get_task_for_employee(search: str = None, page_length: int = 20, start: int = 0):

    projects = frappe.get_list("Project", pluck="name")
    search_filter = {"project": ["in", projects]}

    if search:
        search_filter.update(
            {
                "name": ["like", f"%{search}%"],
                "subject": ["like", f"%{search}%"],
            }
        )

    project_task = frappe.get_all(
        "Task",
        or_filters=search_filter,
        fields=["name", "subject", "status", "project.project_name"],
        page_length=page_length,
        start=start,
        order_by="name desc",
    )

    return project_task


def filter_employees(
    employee_name=None,
    department=None,
    project=None,
    page_length=10,
    start=0,
    user_group=None,
):
    import json

    fields = ["name", "image", "employee_name", "department", "designation"]
    employee_ids = []
    filters = {"status": "Active"}

    if isinstance(department, str):
        department = json.loads(department)

    if isinstance(project, str):
        project = json.loads(project)

    if isinstance(user_group, str):
        user_group = json.loads(user_group)

    if employee_name:
        filters["employee_name"] = ["like", f"%{employee_name}%"]

    if department and len(department) > 0:
        filters["department"] = ["in", department]

    if project and len(project) > 0:
        shared_projects = frappe.get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["IN", project]},
            fields=["user"],
        )
        ids = [
            frappe.get_value("Employee", {"user_id": shared_project.get("user")})
            for shared_project in shared_projects
        ]
        employee_ids.extend(ids)

    if user_group and len(user_group) > 0:
        users = frappe.get_all(
            "User Group Member", fields=["user"], filters={"parent": ["in", user_group]}
        )
        ids = [
            frappe.get_value("Employee", {"user_id": user.get("user")})
            for user in users
        ]
        employee_ids.extend(ids)

    if len(employee_ids) > 0:
        filters["name"] = ["in", employee_ids]

    employees = frappe.get_list(
        "Employee", fields=fields, filters=filters, page_length=page_length, start=start
    )
    total_count = len(frappe.get_list("Employee", filters=filters))
    return employees, total_count
