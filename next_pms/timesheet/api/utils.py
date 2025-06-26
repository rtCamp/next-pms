import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week
from frappe.utils.caching import redis_cache
from frappe.utils.data import getdate

READ_ONLY_ROLE = ["Timesheet User", "Projects User"]
READ_WRITE_ROLE = ["Timesheet Manager", "Projects Manager"]


def has_write_access():
    roles = frappe.get_roles()
    return set(roles).intersection(READ_WRITE_ROLE)


@redis_cache()
def get_week_dates(date, ignore_weekend=False):
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
            "docstatus": ["<", 2],
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


@redis_cache()
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
    from .employee import get_employee_from_user

    if frappe.session.user == "Administrator":
        return True
    roles = frappe.get_roles()
    session_employee = get_employee_from_user()
    if (
        set(roles).intersection(["Projects Manager", "Projects User"])
        and ptype == "write"
        and not set(roles).intersection(["Timesheet Manager"])
    ):
        if employee == session_employee:
            return True
        else:
            reports_to = frappe.db.get_value("Employee", employee, "reports_to")
            if reports_to == session_employee:
                return True
            else:
                return False
    if set(roles).intersection(READ_ONLY_ROLE + READ_WRITE_ROLE) and ptype == "read":
        return True
    if set(roles).intersection(READ_WRITE_ROLE) and ptype == "write":
        return True

    return employee == session_employee
