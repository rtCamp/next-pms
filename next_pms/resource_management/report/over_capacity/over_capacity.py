# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt


from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe import _, get_all, get_doc, get_meta
from frappe.query_builder import DocType
from frappe.query_builder.functions import Sum
from frappe.utils import add_days, flt, get_date_str, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.api.employee import get_employee_daily_working_norm


def execute(filters=None):
    employee_meta = get_meta("Employee")
    columns = get_columns(employee_meta)
    data = get_data(filters=filters, meta=employee_meta)
    return columns, data


def get_data(filters, meta):
    res = []
    start_date = filters.get("from")
    end_date = filters.get("to")

    fields = ["name as employee", "employee_name", "reports_to", "status"]

    if meta.has_field("custom_business_unit"):
        fields.append("custom_business_unit")

    if meta.has_field("custom_reporting_manager"):
        fields.append("custom_reporting_manager")

    if filters.get("status"):
        emp_filters = {"status": filters.get("status")}
    else:
        emp_filters = {}
    employees = get_all("Employee", fields=fields, filters=emp_filters, order_by="employee_name ASC")
    logged_hours = get_logged_hours(employees, start_date, end_date)

    for employee in employees:
        if not logged_hours.get(employee["employee"], 0) and employee.status != "Active":
            continue
        capcity_hours = get_employee_total_hours(employee["employee"], start_date, end_date)
        employee_logged_hours = logged_hours.get(employee["employee"], 0) or 0
        employee["capacity_hours"] = capcity_hours
        employee["logged_hours"] = employee_logged_hours
        res.append(employee)
    return res


def get_logged_hours(employees, start_date, end_date):
    import frappe

    employee_names = [employee.employee for employee in employees]
    start_date = getdate(start_date)
    end_date = getdate(end_date)
    timesheets = DocType("Timesheet")
    query = (
        frappe.qb.from_(timesheets)
        .select(Sum(timesheets.total_hours).as_("hours"), timesheets.employee)
        .where(timesheets.employee.isin(employee_names))
        .where(timesheets.start_date >= start_date)
        .where(timesheets.end_date <= end_date)
        .where(timesheets.docstatus.isin([0, 1]))
        .groupby(timesheets.employee)
    )
    data = query.run(as_dict=True)
    return {item["employee"]: item["hours"] for item in data}


def get_employee_total_hours(employee: str, start_date: str, end_date: str):
    total_hours = 0

    start_date = getdate(start_date)
    end_date = getdate(end_date)

    daily_hours = get_employee_daily_working_norm(employee)

    holiday_list_name = get_holiday_list_for_employee(employee)
    holidays = get_doc("Holiday List", holiday_list_name).holidays

    leaves = get_employee_leaves(employee, get_date_str(start_date), get_date_str(end_date))

    while start_date <= end_date:
        data = is_on_leave(start_date, daily_hours, leaves, holidays)
        if not data.get("on_leave"):
            total_hours += daily_hours
        else:
            total_hours += flt(data.get("leave_work_hours"))
        start_date = add_days(start_date, 1)
    return total_hours


def get_columns(meta):
    columns = [
        {"fieldname": "employee", "label": _("Employee"), "fieldtype": "Link", "options": "Employee", "width": 200},
        {"fieldname": "employee_name", "label": _("Employee Name"), "fieldtype": "Data"},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data"},
        {
            "fieldname": "custom_business_unit",
            "label": _("Business Unit"),
            "fieldtype": "Link",
            "options": "Business Unit",
        },
        {"fieldname": "reports_to", "label": _("Reporting Manager"), "fieldtype": "Link", "options": "Employee"},
        {"fieldname": "custom_reporting_manager", "label": _("Reporting Manager"), "fieldtype": "Data"},
        {"fieldname": "capacity_hours", "label": _("Capacity Hours"), "fieldtype": "Float"},
        {"fieldname": "logged_hours", "label": _("Logged Hours"), "fieldtype": "Float"},
    ]
    if not meta.has_field("custom_business_unit"):
        columns.pop(1)

    if not meta.has_field("custom_reporting_manager"):
        columns.pop(3)
    return columns
