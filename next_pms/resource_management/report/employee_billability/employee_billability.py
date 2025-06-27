# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt


from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe import _, get_all, get_doc
from frappe.utils import add_days, flt, get_date_str, getdate, month_diff

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import get_employee_joining_date_based_on_work_history


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_data(filters):
    res = []
    employees = get_employees(designation=filters.get("designation"), status=filters.get("status"))
    employee_names = [employee.employee for employee in employees]
    time_entries = get_employee_time(filters.get("from"), filters.get("to"), employee_names)
    for employee in employees:
        employee_time_entry = time_entries.get(employee.employee)
        if (
            not employee_time_entry.get("billable_hours", 0)
            and not employee_time_entry.get("valuable_hours", 0)
            and employee.status != "Active"
        ):
            continue
        capacity_hours = get_employee_total_hours(employee, filters.get("from"), filters.get("to"))
        billable_hours = employee_time_entry.get("billable_hours", 0)
        valuable_hours = employee_time_entry.get("valuable_hours", 0)

        number_of_years = year_diff(getdate(), employee.date_of_joining)

        employee["number_of_years"] = number_of_years
        employee["capacity_hours"] = capacity_hours
        employee["billable_hours"] = billable_hours
        employee["valuable_hours"] = valuable_hours
        employee["untracked_hours"] = capacity_hours - (billable_hours + valuable_hours)
        employee["billing_percentage"] = (billable_hours / capacity_hours) * 100
        employee["deficit"] = get_deficit(capacity_hours, billable_hours, number_of_years)
        res.append(employee)
    return res


def get_columns():
    return [
        {"fieldname": "employee", "label": _("Employee"), "fieldtype": "Link", "options": "Employee", "width": 200},
        {"fieldname": "employee_name", "label": _("Employee Name"), "fieldtype": "Data"},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data"},
        {"fieldname": "number_of_years", "label": _("Number of Years"), "fieldtype": "Int"},
        {"fieldname": "capacity_hours", "label": _("Capacity Hours"), "fieldtype": "Float"},
        {"fieldname": "billable_hours", "label": _("Billable Hours"), "fieldtype": "Float"},
        {"fieldname": "valuable_hours", "label": _("Valuable Hours"), "fieldtype": "Float"},
        {"fieldname": "untracked_hours", "label": _("Untracked Hours"), "fieldtype": "Float"},
        {"fieldname": "billing_percentage", "label": _("Billing %"), "fieldtype": "Percent"},
        {"fieldname": "deficit", "label": _("Deficit"), "fieldtype": "Float"},
    ]


def get_employees(designation=None, status=None):
    filters = {}
    if designation:
        filters.update({"designation": ["in", designation]})

    if status:
        filters.update({"status": status})
    employees = get_all(
        "Employee",
        filters=filters,
        fields=["name as employee", "employee_name", "date_of_joining", "status"],
        order_by="employee_name ASC",
    )
    for employee in employees:
        joining_date = get_employee_joining_date_based_on_work_history(employee)
        employee["date_of_joining"] = joining_date
    return employees


def year_diff(string_ed_date, string_st_date):
    month = month_diff(string_ed_date, string_st_date)
    return month / 12


def get_employee_total_hours(employee, start_date: str, end_date: str):
    total_hours = 0

    start_date = getdate(start_date)
    end_date = getdate(end_date)

    daily_hours = get_employee_daily_working_norm(employee.employee)

    holiday_list_name = get_holiday_list_for_employee(employee.employee)
    holidays = get_doc("Holiday List", holiday_list_name).holidays

    leaves = get_employee_leaves(employee.employee, get_date_str(start_date), get_date_str(end_date))

    while start_date <= end_date:
        if start_date < employee.date_of_joining:
            start_date = add_days(start_date, 1)
            continue
        data = is_on_leave(start_date, daily_hours, leaves, holidays)
        if not data.get("on_leave"):
            total_hours += daily_hours
        else:
            total_hours += flt(data.get("leave_work_hours"))
        start_date = add_days(start_date, 1)
    return total_hours


def get_employee_time(start_date, end_date, employee_names):
    data = {}
    timesheets = get_all(
        "Timesheet",
        fields=["employee", "time_logs.hours", "time_logs.is_billable"],
        filters={
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "employee": ["in", employee_names],
            "docstatus": ["in", [0, 1]],
        },
    )

    for employee in employee_names:
        timesheet = [ts for ts in timesheets if ts.employee == employee]

        billable_hours = sum([flt(ts.hours) for ts in timesheet if ts.is_billable])
        valuable_hours = sum([flt(ts.hours) for ts in timesheet if not ts.is_billable])
        data[employee] = {"billable_hours": billable_hours, "valuable_hours": valuable_hours}

    return data


def get_deficit(capacity_hours, billable_hours, years):
    threshold = 0
    if years > 5:
        threshold = 0.9
    elif years > 2:
        threshold = 0.8
    else:
        threshold = 0.4

    return (capacity_hours * threshold) - billable_hours
