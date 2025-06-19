# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _, get_meta
from frappe.utils import flt, getdate, month_diff

from next_pms.next_pms.report.profit_report.profit_report import (
    calculate_employee_cost,
    calculate_employee_total_hours,
    calculate_un_paid_leaves,
    get_employees_billable_amount,
    get_employees_timesheet_hours,
)
from next_pms.resource_management.report.spare_capacity_report.spare_capacity_report import (
    convert_currency,
    filter_by_capacity,
    sort_by_business_unit,
    sort_by_designation,
    sort_by_reports_to,
)
from next_pms.resource_management.report.spare_capacity_report.utils import (
    BU_FIELD_NAME,
    get_employee_fields,
    get_employee_filters,
)
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import (
    generate_flat_tree,
    get_employee_joining_date_based_on_work_history,
    get_employee_leaves_and_holidays,
)


def execute(filters=None):
    validate_filters(filters)
    employee_meta = get_meta("Employee")
    has_bu_field = employee_meta.has_field(BU_FIELD_NAME)

    columns = get_columns(filters)
    data = []
    try:
        data = get_data(filters, has_bu_field)
    except Exception:
        return

    return columns, data, None, None


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
            "fieldname": "age",
            "label": _("Age in Company (yrs)"),
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": _("Hourly Salary ({0})").format(currency),
            "fieldname": "hourly_salary",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 200,
        },
        {
            "label": _("Annual Salary ({0})").format(currency),
            "fieldname": "ctc",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 200,
        },
        {
            "label": _("Capacity Hours"),
            "fieldname": "available_capacity",
            "fieldtype": "Float",
            "width": 160,
        },
        {
            "label": _("Billable Hours"),
            "fieldname": "billable_hours",
            "fieldtype": "Float",
            "width": 160,
        },
        {
            "label": _("% Billable Hours"),
            "fieldname": "percent_billable_hours",
            "fieldtype": "Percent",
            "width": 120,
            "precision": 2,
        },
        {
            "label": _("Revenue Generated ({0})").format(currency),
            "fieldname": "revenue",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 120,
            "precision": 2,
        },
        {
            "label": _("Salary Paid ({0})").format(currency),
            "fieldname": "salary_paid",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 120,
            "precision": 2,
        },
        {
            "label": _("Profit ({0})").format(currency),
            "fieldname": "profit_absolute",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 120,
            "precision": 2,
        },
        {
            "label": _("% Profit"),
            "fieldname": "percent_profit",
            "fieldtype": "Percent",
            "width": 120,
            "precision": 2,
        },
    ]


def get_data(filters=None, has_bu_field=False):
    start_date = filters.get("from")
    end_date = filters.get("to")
    aggregate = filters.get("aggregate", False)
    group_by = filters.get("group_by", "")
    currency = filters.get("currency") or "USD"
    appraisal_cycle = filters.get("appraisal_cycle", None)
    fields = get_employee_fields(has_bu_field)

    fields.append("date_of_joining")
    fields.append("employee")

    filters = get_employee_filters(filters, has_bu_field)

    if appraisal_cycle:
        employee_id_appraisal_cycle = get_employee_id_appraisal_cycle(appraisal_cycle)

        if len(employee_id_appraisal_cycle) == 0:
            return []

        filters["name"] = ["in", employee_id_appraisal_cycle]

    data = generate_flat_tree(
        doctype="Employee",
        fields=fields,
        filters=filters,
        nsm_field="reports_to",
    )

    employees = data.get("level", [])

    if len(employees) == 0:
        return []

    parent_child_map = data.get("with_children", {})

    for emp in employees:
        emp.indent = emp.level or 0 if group_by else 0
        emp.has_value = len(parent_child_map.get(emp.name, {}).get("childrens", [])) > 0
        emp.is_employee = True

    employee_names = [emp.name for emp in employees if emp.get("is_employee", False)]

    timesheets = get_employees_timesheet_hours(employee_names, start_date, end_date)
    billing_amount = get_employees_billable_amount(employee_names, start_date, end_date)  # This will be in USD

    without_group_by_employees = []

    for emp in employees:
        if not emp.get("is_employee", False):
            continue
        daily_hours = get_employee_daily_working_norm(emp.name)
        employee_leave_and_holiday = get_employee_leaves_and_holidays(emp.name, getdate(start_date), getdate(end_date))

        actual_date_oj_joining = emp.date_of_joining
        emp.date_of_joining = get_employee_joining_date_based_on_work_history(emp)

        total_hours = calculate_employee_total_hours(
            emp,
            start_date=getdate(start_date),
            end_date=getdate(end_date),
            daily_hours=daily_hours,
            employee_leave_and_holidays=employee_leave_and_holiday,
        )

        emp.date_of_joining = actual_date_oj_joining

        if emp.currency != currency:
            emp.ctc = convert_currency(emp.ctc, emp.currency, currency)
            emp.currency = currency

        emp.age = employee_age_in_company(emp)
        emp.monthly_salary = emp.ctc / 12
        emp._monthly_salary = emp.monthly_salary

        emp.hourly_salary = emp.monthly_salary / 160

        emp.available_capacity = total_hours

        emp_timesheet = next((timesheet for timesheet in timesheets if timesheet.employee == emp.employee), None)

        emp.billable_hours = flt(emp_timesheet.get("billable_hours", 0) if emp_timesheet else 0)

        emp.percent_billable_hours = (
            (emp.billable_hours / emp.available_capacity) * 100 if emp.available_capacity else 0
        )

        emp.revenue = convert_currency(billing_amount.get(emp.employee, 0), "USD", currency)

        salary_slips = frappe.get_list(
            "Salary Slip",
            fields=["sum(gross_pay) as gross_pay", "currency"],
            filters={
                "employee": emp.name,
                "start_date": [">=", start_date],
                "end_date": ["<=", end_date],
            },
        )

        if len(salary_slips) != 0 and salary_slips[0].get("currency"):
            salary_slip = salary_slips[0]

            emp.salary_paid = convert_currency(
                flt(salary_slip.gross_pay),
                salary_slip.currency,
                currency,
            )
        else:
            emp.salary_paid = convert_currency(
                calculate_employee_cost(
                    emp,
                    start_date=getdate(start_date),
                    end_date=getdate(end_date),
                    num_of_holidays=len(employee_leave_and_holiday.get("holidays")),
                    num_unpaid_leaves=calculate_un_paid_leaves(employee_leave_and_holiday),
                    daily_hours=daily_hours,
                    hourly_rate=emp.hourly_salary,
                ),
                emp.currency,
                currency,
            )

        emp.profit_absolute = flt(emp.revenue) - flt(emp.salary_paid)

        emp.percent_profit = (emp.profit_absolute / emp.salary_paid) * 100 if emp.salary_paid else 0

        without_group_by_employees.append(emp)

    if not group_by:
        return without_group_by_employees

    #  Filter out employees based on the capacity filter
    show_no_capacity = filters.get("show_no_capacity", False)
    employees = filter_by_capacity(employees, show_no_capacity)

    if group_by == "employee":
        employees = sort_by_reports_to(employees)
    elif group_by == "business_unit":
        employees = sort_by_business_unit(employees, has_bu_field, currency)
    elif group_by == "designation":
        employees = sort_by_designation(employees, currency)

    if aggregate:
        employee_map = {emp.name: emp for emp in employees}
        root_nodes = [emp.name for emp in employees if emp.has_value]
        for emp in root_nodes:
            root_emp = employee_map[emp]
            if group_by == "employee":
                childrens = parent_child_map.get(emp, {}).get("childrens", [])
                child_names = [child.name for child in childrens if child.name in employee_map]

                # percent_billable_hours = (
                #     sum(employee_map[c].percent_billable_hours for c in child_names) + root_emp.percent_billable_hours
                # ) / (len(child_names) + 1)

                # percent_profit = (
                #     sum(employee_map[c].percent_profit for c in child_names) + root_emp.percent_profit
                # ) / (len(child_names) + 1)

            elif group_by == "business_unit":
                child_names = [
                    child.name
                    for child in employees
                    if child.get(BU_FIELD_NAME) == emp and child.name in employee_map and child.is_employee
                ]

                # # Calculate % Capacity for root nodes (group)
                # percent_billable_hours = (sum(employee_map[c].percent_billable_hours for c in child_names)) / len(
                #     child_names
                # )
                # percent_profit = (sum(employee_map[c].percent_profit for c in child_names)) / len(child_names)

            else:
                child_names = [
                    child.name
                    for child in employees
                    if child.designation == emp and child.name in employee_map and child.is_employee
                ]

                # percent_billable_hours = (sum(employee_map[c].percent_billable_hours for c in child_names)) / len(
                #     child_names
                # )
                # percent_profit = (sum(employee_map[c].percent_profit for c in child_names)) / len(child_names)

            root_emp.available_capacity += sum(employee_map[c].available_capacity for c in child_names)

            # Calculate monthly salary for root nodes (group)
            root_emp.monthly_salary += sum(employee_map[c].monthly_salary for c in child_names)

            root_emp.ctc += sum(employee_map[c].ctc for c in child_names)

            # Calculate hourly salary for root nodes (group)
            root_emp.hourly_salary += sum(employee_map[c].hourly_salary for c in child_names)
            # Calculate actual unbilled cost for root nodes (group)
            root_emp.billable_hours += sum(employee_map[c].billable_hours for c in child_names)

            root_emp.revenue += sum(employee_map[c].revenue for c in child_names)

            root_emp.salary_paid += sum(employee_map[c].salary_paid for c in child_names)

            root_emp.profit_absolute += sum(employee_map[c].profit_absolute for c in child_names)

            root_emp.percent_billable_hours = (
                (root_emp.billable_hours / root_emp.available_capacity) * 100 if root_emp.available_capacity else 0
            )
            root_emp.percent_profit = (
                (root_emp.profit_absolute / root_emp.salary_paid) * 100 if root_emp.salary_paid else 0
            )

    return employees


def validate_filters(filters, ignore_pass_date=False):
    if not filters.get("from") or not filters.get("to"):
        frappe.throw(_("Both From and To dates must be provided."))

    start_date = getdate(filters.get("from"))
    end_date = getdate(filters.get("to"))

    if start_date > end_date:
        frappe.throw(_("The From date should be than the To date."))


def get_employee_id_appraisal_cycle(appraisal_cycle):
    all_employee = frappe.db.get_all(
        "Appraisal",
        filters={"appraisal_cycle": appraisal_cycle},
        fields=["employee"],
    )

    employee_ids = [emp.employee for emp in all_employee if emp.employee]

    return employee_ids


def employee_age_in_company(employee):
    all_comapines = frappe.get_all("Company")
    all_company_name = [company.name for company in all_comapines]

    all_work_history = frappe.get_all(
        "Employee Internal Work History",
        filters={"parent": employee.employee, "custom_company": ["in", all_company_name]},
        fields=["custom_company", "from_date", "to_date"],
    )

    total_age = month_diff(getdate(), employee.date_of_joining)

    for work_history in all_work_history:
        if work_history.from_date and work_history.to_date:
            total_age += month_diff(work_history.to_date, work_history.from_date)

    years = int(total_age / 12)
    remaining_months = int(total_age % 12)

    return f"{years} years {remaining_months} months" if years > 0 else f"{remaining_months} months"
