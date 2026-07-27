import datetime
from collections.abc import Iterable
from functools import wraps

import frappe
from frappe.utils import flt

from next_pms.timesheet.utils.constant import (
    DEFAULT_DAILY_WORKING_HOURS,
    DEFAULT_WORKING_FREQUENCY,
    EMP_WOKING_DETAILS,
)


@frappe.whitelist(methods=["GET"])
def get_data():
    """returns employee, employee_name, employee_working_detail and employee_report_to for the current user"""
    employee = get_employee_from_user()
    doc = frappe.get_cached_doc("Employee", employee)

    return {
        "employee": employee,
        "employee_name": doc.employee_name,
        "employee_working_detail": get_employee_working_hours(employee),
        "employee_report_to": doc.reports_to,
    }


def get_default_working_hours() -> float:
    """returns the standard daily working hours configured in HR Settings.

    Employee.custom_working_hours and Employee.custom_work_schedule are maintained by the HR team
    and are routinely left blank, so every consumer needs a system-wide default to fall back on.
    """
    return flt(frappe.db.get_single_value("HR Settings", "standard_working_hours")) or DEFAULT_DAILY_WORKING_HOURS


def apply_working_hours_fallback(employees: Iterable[dict], default_working_hours: float | None = None) -> None:
    """Fills in the working hour fields left blank on the given Employee rows.

    Without this an unset custom_work_schedule leaves consumers guessing at the frequency, which
    reads 8 hours as 8 hours per week rather than per day.

    Args:
        employees (Iterable[dict]): Employee rows carrying custom_working_hours and
            custom_work_schedule. Mutated in place.
        default_working_hours (float | None): Hours to use for employees with none of their own.
            Resolved once for the whole batch when not provided, so HR Settings is read once per
            request instead of once per employee.
    """
    if default_working_hours is None:
        default_working_hours = get_default_working_hours()

    for employee in employees:
        if not employee.get("custom_working_hours"):
            employee["custom_working_hours"] = default_working_hours
        if not employee.get("custom_work_schedule"):
            employee["custom_work_schedule"] = DEFAULT_WORKING_FREQUENCY


@frappe.whitelist(methods=["GET"])
def get_employee_from_user(user: str | None = None, throw_exception: bool = False):
    """returns the employee id for the current user"""
    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})
    if not employee and throw_exception:
        frappe.throw(frappe._("No employee found for {0}.").format(user), frappe.DoesNotExistError)
    return employee


def get_user_from_employee(employee: str):
    return frappe.get_value("Employee", employee, "user_id")


@frappe.whitelist(methods=["GET"])
def get_employee_working_hours(employee: str | None = None) -> dict:
    """returns the working hours and working frequency for the given employee or current user's employee if employee is not provided.

    Falls back in order:
      1. Employee.custom_working_hours + Employee.custom_work_schedule
      2. HR Settings.standard_working_hours (if custom_working_hours is unset)
      3. 8 hours / "Per Day" (if both above are unset)

    Args:
        employee (str | None): Employee document name (e.g. "HR-EMP-00001").
            If None or not provided, resolves to the current user's linked Employee.
            Returns {"working_hour": 0, "working_frequency": "Per Day"} if no
            employee can be resolved.

    Returns:
        ```py
        >>> get_employee_working_hours("HR-EMP-00001")
        {"working_hour": 8.0, "working_frequency": "Per Day"}

        >>> get_employee_working_hours("HR-EMP-00002")
        {"working_hour": 40.0, "working_frequency": "Per Week"}
        # daily hours = 40.0 / 5 = 8.0
        ```
    """
    if not employee:
        employee = get_employee_from_user()
    if not employee:
        return {"working_hour": 0, "working_frequency": DEFAULT_WORKING_FREQUENCY}

    data = frappe.cache().hget(EMP_WOKING_DETAILS, employee)
    if data:
        return data

    working_hour, working_frequency = frappe.get_value(
        "Employee",
        employee,
        ["custom_working_hours", "custom_work_schedule"],
    )
    data = {
        "working_hour": working_hour or get_default_working_hours(),
        "working_frequency": working_frequency or DEFAULT_WORKING_FREQUENCY,
    }
    frappe.cache().hset(EMP_WOKING_DETAILS, employee, data)
    return data


def get_employee_daily_working_norm(employee: str) -> int:
    working_details = get_employee_working_hours(employee)
    if working_details.get("working_frequency") != "Per Day":
        return working_details.get("working_hour") / 5
    return working_details.get("working_hour")


def get_employee_weekly_working_norm(employee: str) -> int:
    hours = get_employee_daily_working_norm(employee)
    return hours * 5


@frappe.whitelist(methods=["GET"])
def get_employee(filters: dict | str | None = None, fieldname: list | str | None = None):
    """returns the employee's information for the given filters"""
    if not fieldname:
        fieldname = ["name", "employee_name", "image"]

    if fieldname and isinstance(fieldname, str):
        fieldname = frappe.parse_json(fieldname)

    if filters and isinstance(filters, str):
        filters = frappe.parse_json(filters)

    return frappe.db.get_value("Employee", filters=filters, fieldname=fieldname, as_dict=True)


@frappe.whitelist(methods=["GET"])
def get_employee_list(
    employee_name: str | None = None,
    department: str | None = None,
    project: str | None = None,
    page_length: int | None = None,
    start: int = 0,
    status: list | str | None = None,
    user_group: str | None = None,
    reports_to: str | None = None,
    roles: str | list[str] | None = None,
    ignore_default_filters: bool = False,
):
    """Get a paginated list of employees for the employee dropdown in the timesheet entry form, respecting user permissions."""
    from . import filter_employees

    if roles and isinstance(roles, str):
        try:
            roles = frappe.parse_json(roles)
        except (ValueError, TypeError):
            roles = None  ## useFrappeGetCall will  pass string as JSON-String if string received its better to set it to None and handle it in filter_employees function
    employees, count = filter_employees(
        employee_name=employee_name,
        department=department,
        project=project,
        page_length=page_length,
        start=start,
        status=status,
        user_group=user_group,
        reports_to=reports_to,
        roles=roles,
        ignore_permissions=status is not None,
        ignore_default_filters=ignore_default_filters,
        extra_fields=["user_id"],
    )
    return {"data": employees, "count": count}


def get_workable_days_for_employee(employee: str, start_date: str | datetime.date, end_date: str | datetime.date):
    from frappe.utils import date_diff, getdate

    from next_pms.resource_management.api.utils.query import get_employee_leaves
    from next_pms.timesheet.api.team import get_holidays

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


def validate_current_employee(ptype: str = "read"):
    from .utils import employee_has_higher_access

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            employee = kwargs.get("employee", None)
            if frappe.session.user == "Administrator":
                return func(*args, **kwargs)
            if not employee_has_higher_access(employee, ptype):
                frappe.throw(frappe._("You are not authorized to perform this action."), frappe.PermissionError)
            return func(*args, **kwargs)

        return wrapper

    return decorator
