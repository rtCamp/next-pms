# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

# import frappe


from frappe import _, get_meta
from frappe.utils import getdate

from next_pms.resource_management.api.utils.query import get_allocation_list_for_employee_for_given_range
from next_pms.resource_management.report.utils import calculate_employee_available_hours, calculate_employee_hours
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import generate_flat_tree, get_employee_leaves_and_holidays

from .utils import BU_FIELD_NAME, convert_currency, get_employee_fields, get_employee_filters, sort_by_reports_to


def execute(filters=None):
    employee_meta = get_meta("Employee")
    has_bu_field = employee_meta.has_field(BU_FIELD_NAME)

    columns = get_columns(filters)
    data = get_data(filters, has_bu_field)
    summary = get_report_summary(filters=filters, data=data)
    return columns, data, None, None, summary


def get_data(filters=None, has_bu_field=False):
    """
    Main function to fetch employee data for the team availability report.
    """
    start_date = filters.get("from")
    end_date = filters.get("to")
    is_group = filters.get("is_group", False)
    currency = filters.get("currency") or "USD"
    fields = get_employee_fields(has_bu_field)

    #  Fetch employee based on their reports_to hierarchy
    data = generate_flat_tree(
        doctype="Employee",
        fields=fields,
        filters=get_employee_filters(filters, has_bu_field),
        nsm_field="reports_to",
    )

    employees = data.get("level", [])
    parent_child_map = data.get("with_children", {})

    #  We need to update the indent value for each employee.
    #  If employee has a level, we set indent to that level,
    #  otherwise we set it to 0.
    #  We need to set has_value to True if the employee has any children based on the parent_child_map.
    for emp in employees:
        emp.indent = emp.level or 0
        emp.has_value = len(parent_child_map.get(emp.name, {}).get("childrens", [])) > 0

    employees = sort_by_reports_to(employees)

    employee_names = [emp.name for emp in employees]
    resource_allocation_map = get_allocations(start_date, end_date, employee_names)
    for emp in employees:
        daily_hours = get_employee_daily_working_norm(emp.name)
        employee_allocations = resource_allocation_map.get(emp.name, [])

        non_billable_allocations = [resource for resource in employee_allocations if not resource.is_billable]
        billable_allocations = [resource for resource in employee_allocations if resource.is_billable]

        employee_leave_and_holiday = get_employee_leaves_and_holidays(emp.name, getdate(start_date), getdate(end_date))

        holidays = employee_leave_and_holiday.get("holidays")
        leaves = employee_leave_and_holiday.get("leaves")

        employee_non_billable_hours = calculate_employee_hours(
            daily_hours,
            start_date,
            end_date,
            non_billable_allocations,
            holidays,
            leaves,
        )
        employee_billable_hours = calculate_employee_hours(
            daily_hours,
            start_date,
            end_date,
            billable_allocations,
            holidays,
            leaves,
        )
        employee_free_hours = calculate_employee_available_hours(
            daily_hours, start_date, end_date, employee_allocations, holidays, leaves
        )

        emp.available_capacity = employee_free_hours + employee_non_billable_hours
        emp._available_capacity = emp.available_capacity  # Store original available capacity

        # Calculate monthly salary
        emp.monthly_salary = emp.ctc / 12
        if emp.currency != currency:
            emp.monthly_salary = convert_currency(emp.monthly_salary, emp.currency, currency)
            emp.currency = currency
        emp._monthly_salary = emp.monthly_salary  # Store original monthly salary

        emp.hourly_salary = emp.monthly_salary / 160  # Assuming 160 working hours in a month

        emp.actual_unbilled_cost = emp.hourly_salary * emp.available_capacity
        emp._actual_unbilled_cost = emp.actual_unbilled_cost  # Store original unbilled cost
        # Calculate % Capacity

        if emp.available_capacity > 0:
            emp.percentage_capacity_available = (
                emp.available_capacity / (emp.available_capacity + employee_billable_hours)
            ) * 100
        else:
            emp.percentage_capacity_available = 0
        emp._percentage_capacity_available = emp.percentage_capacity_available  # Store original percentage capacity

    if is_group:
        employee_map = {emp.name: emp for emp in employees}
        root_nodes = [emp.name for emp in employees if emp.has_value]
        for emp in root_nodes:
            childrens = parent_child_map.get(emp, {}).get("childrens", [])
            child_names = [child.name for child in childrens if child.name in employee_names]
            hours = sum(employee_map[c].available_capacity for c in child_names)
            root_emp = employee_map[emp]
            root_emp.available_capacity += hours

            # Calculate monthly salary for root nodes (group)
            root_emp.monthly_salary += sum(employee_map[c].monthly_salary for c in child_names)
            # Calculate hourly salary for root nodes (group)
            root_emp.hourly_salary += sum(employee_map[c].hourly_salary for c in child_names)
            # Calculate actual unbilled cost for root nodes (group)
            root_emp.actual_unbilled_cost += sum(employee_map[c].actual_unbilled_cost for c in child_names)

            # Calculate % Capacity for root nodes (group)
            root_emp.percentage_capacity_available += sum(
                employee_map[c].percentage_capacity_available for c in child_names
            )
    return employees


def get_report_summary(data, filters=None):
    currency = filters.get("currency") or "USD"
    total_available_capacity = sum(emp._available_capacity for emp in data)
    total_actual_unbilled_cost = sum(emp._actual_unbilled_cost for emp in data)
    avg_unbilled_cost = total_actual_unbilled_cost / len(data) if data else 0
    return [
        {
            "label": _("Total Available Capacity (hrs)"),
            "value": total_available_capacity,
            "indicator": "Blue",
        },
        {
            "label": _("Total Actual Unbilled Cost ({0})").format(filters.get("currency") or "USD"),
            "value": total_actual_unbilled_cost,
            "indicator": "Green",
            "datatype": "Currency",
            "currency": currency,
        },
        {
            "label": _("Average Unbilled Cost ({0})").format(filters.get("currency") or "USD"),
            "value": avg_unbilled_cost,
            "indicator": "Green",
            "datatype": "Currency",
            "currency": currency,
        },
    ]


def get_allocations(start_date, end_date, employee_names):
    resource_allocations = get_allocation_list_for_employee_for_given_range(
        columns=get_resource_allocation_fields(),
        value_key="employee",
        values=employee_names,
        start_date=start_date,
        end_date=end_date,
    )
    resource_allocation_map = {}
    for resource_allocation in resource_allocations:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)
    return resource_allocation_map


def get_columns(filters=None):
    currency = filters.get("currency") or "USD"
    return [
        {
            "fieldname": "name",
            "label": _("ID"),
            "fieldtype": "Link",
            "options": "Employee",
            "width": 150,
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee Name"),
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "fieldname": "designation",
            "label": _("Designation"),
            "fieldtype": "Link",
            "options": "Designation",
            "width": 180,
        },
        {
            "label": _("Available Capacity (hrs)"),
            "fieldname": "available_capacity",
            "fieldtype": "Float",
            "width": 160,
        },
        {
            "label": _("% Capacity Available"),
            "fieldname": "percentage_capacity_available",
            "fieldtype": "Percent",
            "width": 120,
            "precision": 2,
        },
        {
            "label": _("Monthly Salary ({0})").format(currency),
            "fieldname": "monthly_salary",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 200,
        },
        {
            "label": _("Actual unbilled cost ({0})").format(currency),
            "fieldname": "actual_unbilled_cost",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 200,
        },
    ]


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
