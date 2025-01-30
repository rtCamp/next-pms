# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from erpnext.setup.utils import get_exchange_rate
from frappe import _, get_doc, get_list, get_meta, get_value
from frappe.utils import add_days, get_date_str, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.timesheet.api.employee import get_employee_daily_working_norm

CURRENCY = "USD"


def execute(filters=None):
    employee_meta = get_meta("Employee")
    columns = get_columns(employee_meta)
    data = get_data(filters=filters, meta=employee_meta)
    return columns, data


def get_data(meta, filters=None):
    start_date = filters.get("from")
    end_date = filters.get("to")
    employee_status = filters.get("status")

    fields = ["name as employee", "employee_name", "designation"]

    if meta.has_field("custom_business_unit"):
        fields.append("custom_business_unit")

    employees = get_list("Employee", fields=fields, filters={"status": employee_status})
    employee_names = [employee.employee for employee in employees]

    resource_allocations = get_allocation_list_for_employee_for_given_range(
        columns=get_resource_allocation_fields(),
        value_key="employee",
        values=employee_names,
        start_date=start_date,
        end_date=end_date,
    )
    data = calculate_hours_and_revenue(employees, resource_allocations, start_date, end_date)
    return data


def get_columns(meta):
    has_bu_field = meta.has_field("custom_business_unit")

    columns = [
        {
            "fieldname": "employee",
            "label": _("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
            "width": 300,
        },
        {
            "fieldname": "designation",
            "label": _("Designation"),
            "fieldtype": "Link",
            "options": "Designation",
        },
        {
            "fieldname": "custom_business_unit",
            "label": _("Business Unit"),
            "fieldtype": "Link",
            "options": "Business Unit",
        },
        {
            "fieldname": "booked_hous",
            "label": _("Booked Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "available_hours",
            "label": _("Available Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "potential_revenue",
            "label": _("Potential Revenue"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "booked_revenue",
            "label": _("Booked Revenue"),
            "fieldtype": "Float",
        },
    ]
    if not has_bu_field:
        columns.pop(3)
    return columns


def get_resource_allocation_fields():
    return [
        "name",
        "employee",
        "employee_name",
        "allocation_start_date",
        "allocation_end_date",
        "hours_allocated_per_day",
        "project",
        "project_name",
        "customer",
        "is_billable",
        "note",
        "total_allocated_hours",
    ]


def calculate_hours_and_revenue(employees, resource_allocations, start_date, end_date):
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    for employee in employees:
        employee_allocations = [resource for resource in resource_allocations if resource.employee == employee.employee]
        daily_hours = get_employee_daily_working_norm(employee.employee)
        free_hours = calculate_employee_free_hours(
            employee.employee, daily_hours, start_date, end_date, resource_allocations
        )
        free_hours_revenue = calculate_and_convert_free_hour_revenue(employee.employee, free_hours)
        employee_billable_hours = sum(item.total_allocated_hours for item in employee_allocations if item.is_billable)
        employee_non_billable_hours = sum(
            item.total_allocated_hours for item in employee_allocations if not item.is_billable
        )
        employee["booked_hous"] = employee_billable_hours
        employee["available_hours"] = free_hours + employee_non_billable_hours
        employee["booked_revenue"] = calculate_and_convert_revenue(
            employee.employee,
            [resource for resource in resource_allocations if resource.is_billable],
        )
        employee["potential_revenue"] = (
            calculate_and_convert_revenue(
                employee.employee,
                [resource for resource in resource_allocations if not resource.is_billable],
            )
            + free_hours_revenue
        )
    return employees


def calculate_and_convert_revenue(employee, allocations):
    total_revenue = 0
    for allocation in allocations:
        project = allocation.project
        if not project:
            continue
        rate = get_employee_hourly_billing_rate(employee, project)
        currency = get_value("Project", project, "custom_currency")
        hours = allocation.total_allocated_hours

        if currency != CURRENCY:
            exchange_rate = get_exchange_rate(currency, CURRENCY)
            rate = rate * exchange_rate
        revenue = hours * rate
        total_revenue += revenue
    return total_revenue


def calculate_and_convert_free_hour_revenue(employee, free_hours):
    hourly_salary = get_employee_hourly_salary(employee)
    return (hourly_salary * 3) * free_hours


def get_employee_hourly_billing_rate(employee, project: str | None = None):
    if not project:
        return 0

    custom_billing_type, custom_default_hourly_billing_rate = get_value(
        "Project",
        project,
        ["custom_billing_type", "custom_default_hourly_billing_rate"],
    )

    if custom_billing_type == "Non-Billable":
        return 0
    elif custom_billing_type == "Fixed Rate" or custom_billing_type == "Retainer":
        return custom_default_hourly_billing_rate
    else:
        rate = get_value(
            "Project Billing Team",
            {"parent": project, "employee": employee},
            "hourly_billing_rate",
        )
        return rate or 0


def calculate_employee_free_hours(employee, daily_hours, start_date, end_date, resource_allocations):
    start_date = getdate(start_date)
    end_date = getdate(end_date)
    total_hours = 0
    total_hours_for_resource_allocation = 0
    holiday_list_name = get_holiday_list_for_employee(employee)
    holidays = get_doc("Holiday List", holiday_list_name).holidays
    leaves = get_employee_leaves(employee, get_date_str(start_date), get_date_str(end_date))

    while start_date <= end_date:
        data = is_on_leave(start_date, daily_hours, leaves, holidays)
        if not data.get("on_leave"):
            total_hours += daily_hours
        else:
            total_hours += data.get("leave_work_hours")
        start_date = add_days(start_date, 1)

    for resource in resource_allocations:
        if resource.employee != employee:
            continue
        total_hours_for_resource_allocation += resource.total_allocated_hours

    return total_hours - total_hours_for_resource_allocation


def get_employee_hourly_salary(employee: str):
    ctc, salary_currency = get_value("Employee", employee, ["ctc", "salary_currency"])
    monthly_salary = ctc / 12
    hourly_salary = monthly_salary / 160
    if salary_currency != CURRENCY:
        exchange_rate = get_exchange_rate(salary_currency, CURRENCY)
        hourly_salary = hourly_salary * (exchange_rate or 1)
    return hourly_salary
