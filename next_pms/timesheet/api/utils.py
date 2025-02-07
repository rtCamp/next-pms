import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week, nowdate
from frappe.utils.data import getdate

now = nowdate()
READ_ONLY_ROLE = ["Timesheet User", "Projects User"]
READ_WRITE_ROLE = ["Timesheet Manager", "Projects Manager"]


def is_timesheet_user():
    return "Timesheet User" in frappe.get_roles()


def is_timesheet_manager():
    return "Timesheet Manager" in frappe.get_roles()


def get_week_dates(date, current_week: bool = False, ignore_weekend=False):
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
    now = getdate()
    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)

    if start_date <= now <= end_date:
        key = "This Week"
    else:
        if ignore_weekend:
            end_date_for_key = add_days(end_date, -2)
        else:
            end_date_for_key = end_date
        key = f"{start_date.strftime('%b %d')} - {end_date_for_key.strftime('%b %d')}"

    data = {"start_date": start_date, "end_date": end_date, "key": key}

    while start_date <= end_date:
        if ignore_weekend and start_date.weekday() in [5, 6]:
            start_date = add_days(start_date, 1)
            continue
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
    status=None,
    ids: list[str] | None = None,
    reports_to: None | str = None,
    business_unit=None,
    designation=None,
    ignore_default_filters=False,
    ignore_permissions=False,
):
    import json

    from .utils import READ_ONLY_ROLE, READ_WRITE_ROLE

    roles = frappe.get_roles()

    if not ignore_permissions:
        ignore_permissions = READ_ONLY_ROLE in roles or READ_WRITE_ROLE in roles

    fields = ["name", "image", "employee_name", "department", "designation"]
    employee_ids = []
    filters = {"status": ["in", ["Active"]]}
    or_filters = {}

    if reports_to:
        filters["reports_to"] = reports_to

    if isinstance(department, str):
        department = json.loads(department)

    if isinstance(business_unit, str):
        business_unit = json.loads(business_unit)

    if isinstance(designation, str):
        designation = json.loads(designation)

    if isinstance(status, str):
        status = json.loads(status)
        if len(status) > 0:
            filters["status"] = ["in", status]

    if isinstance(status, list):
        if len(status) > 0:
            filters["status"] = ["in", status]

    if isinstance(project, str):
        project = json.loads(project)

    if isinstance(user_group, str):
        user_group = json.loads(user_group)

    if employee_name:
        or_filters["employee_name"] = ["like", f"%{employee_name}%"]

    if department and len(department) > 0:
        filters["department"] = ["in", department]

    if designation and len(designation) > 0:
        filters["designation"] = ["in", designation]

    if business_unit and len(business_unit) > 0:
        filters["custom_business_unit"] = ["in", business_unit]

    if ids:
        employee_ids.extend(ids)

    if project and len(project) > 0:
        project_employee = frappe.get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["IN", project]},
            pluck="user",
        )
        ids = [frappe.get_value("Employee", {"user_id": employee}) for employee in project_employee]
        employee_ids.extend(ids)

    if user_group and len(user_group) > 0:
        users = frappe.get_all("User Group Member", pluck="user", filters={"parent": ["in", user_group]})
        ids = [frappe.get_value("Employee", {"user_id": user}, cache=True) for user in users]
        employee_ids.extend(ids)

    if len(employee_ids) > 0:
        filters["name"] = ["in", employee_ids]

    if ignore_default_filters:
        filters.pop("status", None)

    employees = frappe.get_list(
        "Employee",
        fields=fields,
        or_filters=or_filters,
        filters=filters,
        page_length=page_length,
        start=start,
        ignore_permissions=ignore_permissions,
        order_by="employee_name asc",
    )
    total_count = get_count(
        "Employee",
        filters=filters,
        or_filters=or_filters,
        ignore_permissions=ignore_permissions,
    )

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

    from .employee import get_workable_days_for_employee

    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)
    working_days = get_workable_days_for_employee(employee, start_date, end_date)

    current_week_timesheet = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
        },
        ["name", "custom_approval_status", "start_date"],
    )
    if not current_week_timesheet:
        return
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

    if status_count["Rejected"] >= working_days.get("total_working_days"):
        week_status = "Rejected"
    elif status_count["Approved"] >= working_days.get("total_working_days"):
        week_status = "Approved"
    elif status_count["Rejected"] > 0:
        week_status = "Partially Rejected"
    elif status_count["Approved"] > 0:
        week_status = "Partially Approved"

    for timesheet in current_week_timesheet:
        frappe.db.set_value("Timesheet", timesheet.name, "custom_weekly_approval_status", week_status)


def get_holidays(employee: str, start_date: str, end_date: str):
    holiday_name = get_holiday_list_for_employee(employee, raise_exception=False)
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


def apply_role_permission_for_doctype(roles: list[str], doctype: str, ptype: str = "read", doc=None):
    if frappe.session.user == "Administrator":
        return

    user_roles = frappe.get_roles()

    if not set(roles).intersection(user_roles):
        frappe.has_permission(doctype, ptype, doc, throw=True)


def employee_has_higher_access(employee: str, ptype: str = "read") -> bool:
    from .employee import validate_current_employee

    if frappe.session.user == "Administrator":
        return True
    roles = frappe.get_roles()

    if set(roles).intersection(READ_ONLY_ROLE + READ_WRITE_ROLE) and ptype == "read":
        return True
    if ptype == "write" and set(roles).intersection(READ_WRITE_ROLE):
        return True
    is_current_employee = validate_current_employee(employee)
    if is_current_employee:
        return True

    return False
