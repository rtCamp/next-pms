# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

import datetime

from erpnext.setup.utils import get_exchange_rate
from frappe import _, get_list, get_meta, get_value
from frappe.utils import add_days, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
)
from next_pms.resource_management.report.utils import (
    calculate_employee_available_hours,
    calculate_employee_hours,
    get_employee_allocations_for_date,
)
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import (
    get_employee_leaves_and_holidays,
    get_employee_salary,
)

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

    fields = ["name as employee", "employee_name", "designation", "status"]

    if meta.has_field("custom_business_unit"):
        fields.append("custom_business_unit")

    employees = get_list(
        "Employee",
        fields=fields,
        filters={"status": employee_status} if employee_status else {},
        order_by="employee_name ASC",
    )
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
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee Name"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "status",
            "label": _("Status"),
            "fieldtype": "Data",
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
            "fieldname": "total_hours",
            "label": _("Total Hours"),
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
    res = []
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    resource_allocation_map = {}
    for resource_allocation in resource_allocations:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)

    for employee in employees:
        employee_allocations = resource_allocation_map.get(employee.employee, [])
        if not employee_allocations and employee.status != "Active":
            continue
        daily_hours = get_employee_daily_working_norm(employee.employee)
        employee_leave_and_holiday = get_employee_leaves_and_holidays(employee.employee, start_date, end_date)
        holidays = employee_leave_and_holiday.get("holidays")
        leaves = employee_leave_and_holiday.get("leaves")
        billable_allocations = [resource for resource in employee_allocations if resource.is_billable]
        non_billable_allocations = [resource for resource in employee_allocations if not resource.is_billable]
        employee_free_hours = calculate_employee_available_hours(
            daily_hours, start_date, end_date, employee_allocations, holidays, leaves
        )
        free_hours_revenue = calculate_and_convert_free_hour_revenue(employee.employee, employee_free_hours)
        employee_billable_hours = calculate_employee_hours(
            daily_hours, start_date, end_date, billable_allocations, holidays, leaves
        )

        employee_non_billable_hours = calculate_employee_hours(
            daily_hours,
            start_date,
            end_date,
            non_billable_allocations,
            holidays,
            leaves,
        )

        employee["booked_hous"] = employee_billable_hours
        employee["available_hours"] = employee_free_hours + employee_non_billable_hours
        employee["booked_revenue"] = calculate_and_convert_revenue(
            employee.employee,
            [resource for resource in employee_allocations if resource.is_billable],
            start_date,
            end_date,
            daily_hours,
            holidays,
            leaves,
        )
        employee["potential_revenue"] = (
            calculate_and_convert_revenue(
                employee.employee,
                [resource for resource in employee_allocations if not resource.is_billable],
                start_date,
                end_date,
                daily_hours,
                holidays,
                leaves,
            )
            + free_hours_revenue
        )
        employee["total_hours"] = employee_billable_hours + employee_free_hours + employee_non_billable_hours
        res.append(employee)
    return res


def calculate_and_convert_revenue(
    employee: str,
    allocations: list,
    start_date: datetime.date,
    end_date: datetime.date,
    daily_hours: float,
    holidays,
    leaves,
):
    total_revenue = 0

    while start_date <= end_date:
        data = is_on_leave(start_date, daily_hours, leaves, holidays)
        if not data.get("on_leave"):
            allocation_for_date = get_employee_allocations_for_date(allocations, start_date)
            for allocation in allocation_for_date:
                project = allocation.project
                if not project:
                    continue
                rate = get_employee_hourly_billing_rate(employee, project)
                currency = get_value("Project", project, "custom_currency")
                hours = allocation.hours_allocated_per_day

                if currency != CURRENCY:
                    exchange_rate = get_exchange_rate(currency, CURRENCY)
                    rate = rate * exchange_rate
                revenue = hours * rate
                total_revenue += revenue
        start_date = add_days(start_date, 1)
    return total_revenue


def calculate_and_convert_free_hour_revenue(employee: str, free_hours: float):
    hourly_salary = get_employee_salary(employee, CURRENCY).get("hourly_salary", 0)
    return (hourly_salary * 3) * free_hours


def get_employee_hourly_billing_rate(employee: str, project: str | None = None):
    if not project:
        return 0

    custom_billing_type, custom_default_hourly_billing_rate = get_value(
        "Project",
        project,
        ["custom_billing_type", "custom_default_hourly_billing_rate"],
    )

    if custom_billing_type == "Non-Billable":
        return 0
    elif custom_billing_type == "Fixed Cost" or custom_billing_type == "Retainer":
        return custom_default_hourly_billing_rate
    else:
        rate = get_value(
            "Project Billing Team",
            {"parent": project, "employee": employee},
            "hourly_billing_rate",
        )
        return rate or 0
