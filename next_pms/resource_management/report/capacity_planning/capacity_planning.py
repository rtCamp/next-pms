# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

import datetime

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe import _, get_list, get_meta, get_value
from frappe.utils import add_days, getdate
from hrms.hr.utils import get_holidays_for_employee

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.resource_management.report.utils import (
    calculate_employee_available_hours,
    calculate_employee_hours,
    get_employee_allocations_for_date,
)
from next_pms.utils.employee import get_employee_salary

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
    for employee in employees:
        employee["currency"] = CURRENCY

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
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "booked_revenue",
            "label": _("Booked Revenue"),
            "fieldtype": "Currency",
            "options": "currency",
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


def batch_fetch_project_data(all_projects):
    """Batch fetch all project data in one query.

    Args:
        all_projects (set): Set of project names

    Returns:
        dict: Dictionary mapping project name to project data
    """
    if not all_projects:
        return {}

    projects = frappe.get_all(
        "Project",
        filters={"name": ["in", list(all_projects)]},
        fields=["name", "custom_currency", "custom_billing_type", "custom_default_hourly_billing_rate"],
    )
    return {p.name: p for p in projects}


def batch_fetch_billing_rates(all_projects, employee_names):
    """Batch fetch all billing rates in one query.

    Args:
        all_projects (set): Set of project names
        employee_names (list): List of employee names

    Returns:
        dict: Dictionary mapping (project, employee) tuple to billing rate
    """
    if not all_projects or not employee_names:
        return {}

    rates = frappe.get_all(
        "Project Billing Team",
        filters={"parent": ["in", list(all_projects)], "employee": ["in", employee_names]},
        fields=["parent", "employee", "hourly_billing_rate"],
    )
    billing_rates = {}
    for r in rates:
        key = (r.parent, r.employee)
        billing_rates[key] = r.hourly_billing_rate
    return billing_rates


def batch_fetch_exchange_rates(project_data):
    """Pre-fetch exchange rates for all currencies.

    Args:
        project_data (dict): Dictionary of project data

    Returns:
        dict: Dictionary mapping currency to exchange rate
    """
    currencies = set(
        p.custom_currency for p in project_data.values() if p.custom_currency and p.custom_currency != CURRENCY
    )
    exchange_rates = {}
    for currency in currencies:
        exchange_rates[currency] = get_exchange_rate(currency, CURRENCY)
    return exchange_rates


def batch_fetch_employee_work_data(employee_names):
    """Batch fetch employee working hours data.

    Args:
        employee_names (list): List of employee names

    Returns:
        dict: Dictionary mapping employee name to work data
    """
    if not employee_names:
        return {}

    emp_data = frappe.get_all(
        "Employee",
        filters={"name": ["in", employee_names]},
        fields=["name", "custom_working_hours", "custom_work_schedule"],
    )
    emp_work_map = {}
    for e in emp_data:
        emp_work_map[e.name] = e
    return emp_work_map


def batch_get_leaves_and_holidays(employee_names, start_date, end_date):
    """Batch fetch leaves and holidays for all employees.

    Args:
        employee_names (list): List of employee names
        start_date (date): Start date
        end_date (date): End date

    Returns:
        dict: Dictionary mapping employee name to leaves and holidays
    """
    if not employee_names:
        return {}

    all_leaves_holidays = {}
    for employee in employee_names:
        holidays = get_holidays_for_employee(employee, start_date, end_date)
        leaves = get_employee_leaves(employee, str(start_date), str(end_date))
        all_leaves_holidays[employee] = {"holidays": holidays, "leaves": leaves}

    return all_leaves_holidays


def calculate_daily_norm(emp_work):
    """Calculate daily working norm from employee work data.

    Args:
        emp_work (dict): Employee work data with custom_working_hours and custom_work_schedule

    Returns:
        float: Daily working hours
    """
    working_hour = emp_work.get("custom_working_hours")
    working_frequency = emp_work.get("custom_work_schedule")

    if not working_hour:
        working_hour = frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8

    if not working_frequency:
        working_frequency = "Per Day"

    if working_frequency != "Per Day":
        return working_hour / 5
    return working_hour


def calculate_hours_and_revenue(employees, resource_allocations, start_date, end_date):
    res = []
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    # Build resource allocation map and collect all projects
    resource_allocation_map = {}
    all_projects = set()
    for resource_allocation in resource_allocations:
        emp = resource_allocation.employee
        if emp not in resource_allocation_map:
            resource_allocation_map[emp] = []
        resource_allocation_map[emp].append(resource_allocation)
        if resource_allocation.project:
            all_projects.add(resource_allocation.project)

    # Batch fetch all data upfront
    employee_names = [e.employee for e in employees]
    project_data = batch_fetch_project_data(all_projects)
    billing_rates = batch_fetch_billing_rates(all_projects, employee_names)
    exchange_rates = batch_fetch_exchange_rates(project_data)
    emp_work_map = batch_fetch_employee_work_data(employee_names)
    all_leaves_holidays = batch_get_leaves_and_holidays(employee_names, start_date, end_date)

    for employee in employees:
        employee_allocations = resource_allocation_map.get(employee.employee, [])
        if not employee_allocations and employee.status != "Active":
            continue

        # Use pre-fetched data
        emp_work = emp_work_map.get(employee.employee, {})
        daily_hours = calculate_daily_norm(emp_work)

        leaves_holidays = all_leaves_holidays.get(employee.employee, {"holidays": [], "leaves": []})
        holidays = leaves_holidays["holidays"]
        leaves = leaves_holidays["leaves"]

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
        employee["booked_revenue"] = calculate_revenue_batch(
            employee.employee,
            billable_allocations,
            start_date,
            end_date,
            daily_hours,
            holidays,
            leaves,
            project_data,
            billing_rates,
            exchange_rates,
        )
        employee["potential_revenue"] = (
            calculate_revenue_batch(
                employee.employee,
                non_billable_allocations,
                start_date,
                end_date,
                daily_hours,
                holidays,
                leaves,
                project_data,
                billing_rates,
                exchange_rates,
            )
            + free_hours_revenue
        )
        employee["total_hours"] = employee_billable_hours + employee_free_hours + employee_non_billable_hours
        res.append(employee)
    return res


def calculate_revenue_batch(
    employee,
    allocations,
    start_date,
    end_date,
    daily_hours,
    holidays,
    leaves,
    project_data,
    billing_rates,
    exchange_rates,
):
    """Calculate revenue using pre-fetched data - no queries in loop.

    Args:
        employee (str): Employee name
        allocations (list): List of resource allocations
        start_date (date): Start date
        end_date (date): End date
        daily_hours (float): Daily working hours
        holidays (list): List of holidays
        leaves (list): List of leaves
        project_data (dict): Pre-fetched project data
        billing_rates (dict): Pre-fetched billing rates
        exchange_rates (dict): Pre-fetched exchange rates

    Returns:
        float: Total revenue
    """
    total_revenue = 0
    current_date = start_date

    # Convert holidays to set for O(1) lookup
    holiday_dates = set(h.holiday_date for h in holidays)

    while current_date <= end_date:
        # Skip holidays
        if current_date in holiday_dates:
            current_date = add_days(current_date, 1)
            continue

        # Check leaves
        on_leave = False
        for leave in leaves:
            if leave.get("from_date") <= current_date <= leave.get("to_date"):
                if not (leave.get("half_day") and leave.get("half_day_date") == current_date):
                    on_leave = True
                    break

        if not on_leave:
            allocation_for_date = get_employee_allocations_for_date(allocations, current_date)
            for allocation in allocation_for_date:
                project = allocation.project
                if not project or project not in project_data:
                    continue

                proj = project_data[project]

                # Get rate from pre-fetched data
                if proj.custom_billing_type == "Non-Billable":
                    rate = 0
                elif proj.custom_billing_type in ("Fixed Cost", "Retainer"):
                    rate = proj.custom_default_hourly_billing_rate or 0
                else:
                    rate = billing_rates.get((project, employee), 0)

                # Apply exchange rate
                if proj.custom_currency and proj.custom_currency != CURRENCY:
                    rate *= exchange_rates.get(proj.custom_currency, 1)

                total_revenue += allocation.hours_allocated_per_day * rate

        current_date = add_days(current_date, 1)

    return total_revenue


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
    hourly_salary = get_employee_salary(employee, CURRENCY, throw=False).get("hourly_salary", 0)
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
