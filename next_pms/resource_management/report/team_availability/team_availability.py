# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

# import frappe


from frappe import _, get_meta
from frappe.utils import getdate

from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
)
from next_pms.resource_management.report.utils import (
    calculate_employee_available_hours,
    calculate_employee_hours,
)
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import generate_flat_tree, get_employee_leaves_and_holidays

from .utils import (
    BU_FIELD_NAME,
    convert_currency,
    get_employee_fields,
    get_employee_filters,
    sort_by_reports_to,
)


def execute(filters=None):
    employee_meta = get_meta("Employee")
    has_bu_field = employee_meta.has_field(BU_FIELD_NAME)

    columns = get_columns(filters)
    data = get_data(filters, has_bu_field)
    return columns, data


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
        employee_free_hours = calculate_employee_available_hours(
            daily_hours, start_date, end_date, employee_allocations, holidays, leaves
        )
        emp.available_capacity = employee_free_hours + employee_non_billable_hours

        # Calculate monthly salary
        emp.monthly_salary = emp.ctc / 12
        if emp.currency != currency:
            emp.monthly_salary = convert_currency(emp.monthly_salary, emp.currency, currency)
            emp.currency = currency

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
    return employees


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
            "width": 200,
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee Name"),
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "fieldname": "designation",
            "label": _("Designation"),
            "fieldtype": "Link",
            "options": "Designation",
            "width": 200,
        },
        {
            "label": _("Available Capacity (hrs)"),
            "fieldname": "available_capacity",
            "fieldtype": "Float",
            "width": 150,
        },
        {
            "label": _("Monthly Salary ({0})").format(currency),
            "fieldname": "monthly_salary",
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
