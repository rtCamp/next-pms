# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

from copy import deepcopy

import frappe
from frappe import _, get_meta
from frappe.types.frappedict import _dict
from frappe.utils import add_days, flt, getdate

from next_pms.next_pms.report.profit_report.profit_report import (
    calculate_employee_total_hours,
    get_employees_billable_amount,
    get_employees_timesheet_hours,
)
from next_pms.resource_management.report.spare_capacity_report.spare_capacity_report import (
    convert_currency,
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
    employee_age_in_company,
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
        frappe.log_error(
            title=_("Error in Appraisal Evaluation Report"),
            message=frappe.get_traceback(),
        )
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
        # {
        #     "label": _("Annual Salary ({0})").format(currency),
        #     "fieldname": "ctc",
        #     "fieldtype": "Currency",
        #     "options": "currency",
        #     "width": 200,
        # },
        {
            "label": _("Capacity Hours"),
            "fieldname": "capacity_hours",
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
            "label": _("Non Billable Hours"),
            "fieldname": "non_billable_hours",
            "fieldtype": "Float",
            "width": 160,
        },
        {
            "label": _("Untracked Hours"),
            "fieldname": "untracked_hours",
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
            "label": _("% Margin"),
            "fieldname": "percent_margin",
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

    filters = get_employee_filters(filters)

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
        emp.indent = (emp.level or 0) if group_by else 0
        emp.has_value = len(parent_child_map.get(emp.name, {}).get("childrens", [])) > 0
        emp.is_employee = True

    employee_names = [emp.name for emp in employees if emp.get("is_employee", False)]

    timesheets = get_employees_timesheet_hours(employee_names, start_date, end_date)
    billing_amount = get_employees_billable_amount(employee_names, start_date, end_date)

    without_group_by_employees = []

    for emp in employees:
        if not emp.get("is_employee", False):
            continue

        daily_hours = get_employee_daily_working_norm(emp.name)
        employee_leave_and_holiday = get_employee_leaves_and_holidays(emp.name, getdate(start_date), getdate(end_date))

        actual_date_of_joining = emp.date_of_joining
        emp.date_of_joining = get_employee_joining_date_based_on_work_history(emp)

        total_hours = calculate_employee_total_hours(
            emp,
            start_date=getdate(start_date),
            end_date=getdate(end_date),
            daily_hours=daily_hours,
            employee_leave_and_holidays=employee_leave_and_holiday,
        )

        emp.date_of_joining = actual_date_of_joining

        if emp.currency != currency:
            emp.ctc = convert_currency(emp.ctc, emp.currency, currency)
            emp.currency = currency

        emp.age = employee_age_in_company(emp, end_date=getdate(end_date))

        emp.monthly_salary = emp.ctc / 12
        emp._monthly_salary = emp.monthly_salary
        emp.hourly_salary = emp.monthly_salary / 160

        emp.capacity_hours = total_hours

        emp_timesheet = next(
            (timesheet for timesheet in timesheets if timesheet.employee == emp.employee),
            None,
        )

        emp.billable_hours = flt(emp_timesheet.get("billable_hours", 0) if emp_timesheet else 0)
        emp.non_billable_hours = flt(emp_timesheet.get("non_billable_hours", 0) if emp_timesheet else 0)
        emp.untracked_hours = emp.capacity_hours - emp.billable_hours - emp.non_billable_hours

        emp.percent_billable_hours = (emp.billable_hours / emp.capacity_hours) * 100 if emp.capacity_hours else 0
        emp.revenue = convert_currency(billing_amount.get(emp.employee, 0), "USD", currency)

        salary_slips = frappe.get_all(
            "Salary Slip",
            fields=["gross_pay", "currency", "start_date", "end_date"],
            filters={
                "employee": emp.name,
                "start_date": [">=", start_date],
                "end_date": ["<=", end_date],
            },
            order_by="end_date asc",
        )

        if len(salary_slips) != 0 and salary_slips[0].get("currency"):
            last_end_date = None
            emp_salary_paid = 0

            for salary_slip in salary_slips:
                emp_salary_paid += convert_currency(
                    flt(salary_slip.gross_pay),
                    salary_slip.currency,
                    currency,
                )
                last_end_date = salary_slip.end_date

            if last_end_date != getdate(end_date):
                new_start_date = add_days(last_end_date, 1)

                total_hours_after_company_change = calculate_employee_total_hours(
                    emp,
                    start_date=new_start_date,
                    end_date=getdate(end_date),
                    daily_hours=daily_hours,
                    employee_leave_and_holidays=employee_leave_and_holiday,
                )
                emp_salary_paid += total_hours_after_company_change * emp.hourly_salary

            emp.salary_paid = emp_salary_paid
        else:
            emp.salary_paid = emp.hourly_salary * emp.capacity_hours

        emp.profit_absolute = flt(emp.revenue) - flt(emp.salary_paid)
        emp.percent_margin = (emp.profit_absolute / emp.revenue) * 100 if emp.revenue else 0

        if not emp.get(BU_FIELD_NAME):
            emp[BU_FIELD_NAME] = "No BU"

        without_group_by_employees.append(emp)

    if not group_by:
        return without_group_by_employees

    if len(without_group_by_employees) == 0:
        return []

    if group_by == "reporting_manager":
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
            if group_by == "reporting_manager":
                childrens = parent_child_map.get(emp, {}).get("childrens", [])
                child_names = [child.name for child in childrens if child.name in employee_map]

            elif group_by == "business_unit":
                child_names = [
                    child.name
                    for child in employees
                    if child.get(BU_FIELD_NAME) == emp and child.name in employee_map and child.is_employee
                ]

            else:
                child_names = [
                    child.name
                    for child in employees
                    if child.designation == emp and child.name in employee_map and child.is_employee
                ]

            root_emp.capacity_hours += sum(employee_map[c].capacity_hours for c in child_names)

            root_emp.monthly_salary += sum(employee_map[c].monthly_salary for c in child_names)
            root_emp.ctc += sum(employee_map[c].ctc for c in child_names)
            root_emp.hourly_salary += sum(employee_map[c].hourly_salary for c in child_names)

            root_emp.billable_hours += sum(employee_map[c].billable_hours for c in child_names)
            root_emp.non_billable_hours += sum(employee_map[c].non_billable_hours for c in child_names)
            root_emp.untracked_hours += sum(employee_map[c].untracked_hours for c in child_names)

            root_emp.revenue += sum(employee_map[c].revenue for c in child_names)
            root_emp.salary_paid += sum(employee_map[c].salary_paid for c in child_names)

            root_emp.profit_absolute += sum(employee_map[c].profit_absolute for c in child_names)

            root_emp.percent_billable_hours = (
                (root_emp.billable_hours / root_emp.capacity_hours) * 100 if root_emp.capacity_hours else 0
            )

            root_emp.percent_margin = (root_emp.profit_absolute / root_emp.revenue) * 100 if root_emp.revenue else 0

    return employees


def sort_by_business_unit(employees, has_bu_field=False, currency="USD"):
    """
    Sorts employees based on their business unit.
    If has_bu_field is True, it will sort by the business unit field.
    """
    if not has_bu_field:
        return employees

    units = list({emp[BU_FIELD_NAME] for emp in employees if emp.get(BU_FIELD_NAME) != "No BU"})
    units.append("No BU")
    if not units:
        return employees
    result = []
    default = deepcopy(employees[0])
    empty_copy = {key: 0 for key in default}

    for unit in units:
        empty_copy.update(
            {
                "name": unit,
                "indent": 0,
                "has_value": False,
                "is_employee": False,
                "currency": currency,
            }
        )
        bu_employees = [emp for emp in employees if emp.get(BU_FIELD_NAME) == unit]
        if bu_employees:
            empty_copy["has_value"] = True
            result.append(_dict(empty_copy.copy()))
            for e in bu_employees:
                e["indent"] = 1
                e["has_value"] = False

            sorted_bu_employees = sorted(bu_employees, key=lambda x: x.get("name", ""))
            result.extend(sorted_bu_employees)
    return result


def validate_filters(filters):
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
