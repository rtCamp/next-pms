import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week, nowdate
from frappe.utils.data import getdate

now = nowdate()


def get_leaves_for_employee(from_date: str, to_date: str, employee: str):

    from_date = getdate(from_date)
    to_date = getdate(to_date)
    return frappe.get_list(
        "Leave Application",
        filters={
            "employee": employee,
            "creation": ["between", [from_date, to_date]],
            "status": ["in", ["Open", "Approved"]],
        },
        fields=["*", "leave_type.include_holiday"],
    )


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


def filter_employees(
    employee_name=None,
    department=None,
    project=None,
    page_length=10,
    start=0,
    user_group=None,
    ignore_permissions=False,
    status=None,
    reports_to: None | str = None,
):
    import json

    roles = frappe.get_roles()
    fields = ["name", "image", "employee_name", "department", "designation"]
    employee_ids = []

    filters = {}

    if reports_to:
        filters["reports_to"] = reports_to

    if isinstance(department, str):
        department = json.loads(department)

    if isinstance(status, str):
        status = json.loads(status)
        if len(status) > 0:
            filters["status"] = ["in", status]
        else:
            filters["status"] = ["in", ["Active"]]

    if isinstance(project, str):
        project = json.loads(project)

    if isinstance(user_group, str):
        user_group = json.loads(user_group)

    if employee_name:
        filters["employee_name"] = ["like", f"%{employee_name}%"]

    if department and len(department) > 0:
        filters["department"] = ["in", department]

    if project and len(project) > 0:
        project_employee = frappe.get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["IN", project]},
            pluck="user",
        )
        ids = [
            frappe.get_value("Employee", {"user_id": employee})
            for employee in project_employee
        ]
        employee_ids.extend(ids)

    if user_group and len(user_group) > 0:
        users = frappe.get_all(
            "User Group Member", pluck="user", filters={"parent": ["in", user_group]}
        )
        ids = [frappe.get_value("Employee", {"user_id": user}) for user in users]
        employee_ids.extend(ids)

    if len(employee_ids) > 0:
        filters["name"] = ["in", employee_ids]

    if "Timesheet Manager" in roles or ignore_permissions:
        employees = frappe.get_all(
            "Employee",
            fields=fields,
            filters=filters,
            page_length=page_length,
            start=start,
        )
        total_count = get_count("Employee", filters=filters, ignore_permissions=True)
    else:
        employees = frappe.get_list(
            "Employee",
            fields=fields,
            filters=filters,
            page_length=page_length,
            start=start,
        )
        total_count = get_count("Employee", filters=filters)

    return employees, total_count


def get_count(
    doctype: str,
    limit: int | None = None,
    distinct: bool = False,
    filters=None,
    or_filters=None,
    ignore_permissions=False,
) -> int:
    from frappe.desk.reportview import execute

    distinct = "distinct " if distinct else ""
    fieldname = f"{distinct}`tab{doctype}`.name"
    if limit:
        fieldname = [fieldname]
        partial_query = execute(
            doctype,
            distinct=distinct,
            limit=limit,
            fields=fieldname,
            filters=filters,
            or_filters=or_filters,
            ignore_permissions=ignore_permissions,
            run=0,
        )
        count = frappe.db.sql(f"""select count(*) from ( {partial_query} ) p""")[0][0]
    else:
        fieldname = [f"count({fieldname}) as total_count"]
        count = execute(
            doctype,
            distinct=distinct,
            limit=limit,
            fields=fieldname,
            filters=filters,
            or_filters=or_filters,
            ignore_permissions=ignore_permissions,
        )[0].get("total_count")
    return count


def update_weekly_status_of_timesheet(employee: str, date: str):
    from frappe.utils import get_first_day_of_week, get_last_day_of_week

    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)

    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": ["!=", 2],
        },
        fields=["name", "start_date"],
    )
    if not timesheets:
        return
    current_week_timesheet = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
        },
        ["name", "custom_approval_status", "start_date"],
        group_by="start_date",
    )
    week_status = "Not Submitted"

    status_count = {
        "Not Submitted": 0,
        "Approved": 0,
        "Rejected": 0,
        "Partially Approved": 0,
        "Partially Rejected": 0,
        "Approval Pending": 0,
    }

    for timesheet in current_week_timesheet:
        status_count[timesheet.custom_approval_status] += 1

    if status_count["Rejected"] == len(current_week_timesheet):
        week_status = "Rejected"
    elif status_count["Approved"] == len(current_week_timesheet):
        week_status = "Approved"
    elif status_count["Approval Pending"] == len(current_week_timesheet):
        week_status = "Approval Pending"
    elif status_count["Rejected"] > 0:
        week_status = "Partially Rejected"
    elif status_count["Approved"] > 0:
        week_status = "Partially Approved"

    for timesheet in timesheets:
        frappe.db.set_value(
            "Timesheet", timesheet.name, "custom_weekly_approval_status", week_status
        )


def get_holidays(employee: str, start_date: str, end_date: str):
    holiday_name = get_holiday_list_for_employee(employee)
    if not holiday_name:
        return []
    holidays = frappe.get_all(
        "Holiday",
        filters={
            "parent": holiday_name,
            "holiday_date": ["between", (getdate(start_date), getdate(end_date))],
        },
        fields=["holiday_date", "description", "weekly_off"],
    )
    return holidays
