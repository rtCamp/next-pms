import datetime

import frappe


@frappe.whitelist()
def get_data():
    employee = get_employee_from_user()
    return {
        "employee": employee,
        "employee_working_detail": get_employee_working_hours(employee),
        "employee_report_to": frappe.db.get_value("Employee", employee, "reports_to"),
    }


@frappe.whitelist()
def get_employee_from_user(user=None):
    user = frappe.session.user
    return frappe.db.get_value("Employee", {"user_id": user})


def get_user_from_employee(employee: str):
    return frappe.get_value("Employee", employee, "user_id")


@frappe.whitelist()
def get_employee_working_hours(employee: str = None):
    if not employee:
        employee = get_employee_from_user()
    if not employee:
        return {"working_hour": 0, "working_frequency": "Per Day"}
    working_hour, working_frequency = frappe.get_value(
        "Employee",
        employee,
        ["custom_working_hours", "custom_work_schedule"],
    )
    if not working_hour:
        working_hour = frappe.db.get_single_value("HR Settings", "standard_working_hours")
    if not working_frequency:
        working_frequency = "Per Day"
    return {"working_hour": working_hour or 8, "working_frequency": working_frequency}


def get_employee_daily_working_norm(employee: str) -> int:
    working_details = get_employee_working_hours(employee)
    if working_details.get("working_frequency") != "Per Day":
        return working_details.get("working_hour") / 5
    return working_details.get("working_hour")


def get_employee_weekly_working_norm(employee: str) -> int:
    hours = get_employee_daily_working_norm(employee)
    return hours * 5


@frappe.whitelist()
def get_employee(filters=None, fieldname=None):
    import json

    if not fieldname:
        fieldname = ["name", "employee_name", "image"]

    if fieldname and isinstance(fieldname, str):
        fieldname = json.loads(fieldname)

    if filters and isinstance(filters, str):
        filters = json.loads(filters)

    return frappe.db.get_value("Employee", filters=filters, fieldname=fieldname, as_dict=True)


@frappe.whitelist()
def get_employee_list(
    employee_name=None,
    department=None,
    project=None,
    page_length=None,
    start=0,
    status=None,
    user_group=None,
    reports_to: str | None = None,
):
    from .utils import filter_employees

    employees, count = filter_employees(
        employee_name=employee_name,
        department=department,
        project=project,
        page_length=page_length,
        start=start,
        status=status,
        user_group=user_group,
        reports_to=reports_to,
        ignore_permissions=status is not None,
    )
    return {"data": employees, "count": count}


def get_workable_days_for_employee(employee: str, start_date: str | datetime.date, end_date: str | datetime.date):
    from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
    from frappe.utils import date_diff

    holiday_list_name = get_holiday_list_for_employee(employee)

    holidays = frappe.get_all(
        "Holiday",
        filters={
            "parent": holiday_list_name,
            "holiday_date": ["between", (start_date, end_date)],
        },
        pluck="holiday_date",
    )

    return (date_diff(end_date, start_date) + 1) - len(holidays)
