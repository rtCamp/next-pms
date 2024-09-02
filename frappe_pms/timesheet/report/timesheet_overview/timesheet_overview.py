# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _, get_list
from frappe.query_builder import Case, DocType
from frappe.query_builder.functions import Sum


def get_employee_list(employee: str | None = None):
    if employee:
        return get_list("Employee", filters={"name": employee}, pluck="name")
    return get_list("Employee", pluck="name")


def get_columns():
    return [
        {
            "fieldname": "from_date",
            "label": _("Date"),
            "fieldtype": "Date",
        },
        {
            "fieldname": "employee",
            "label": _("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
            "width": 200,
        },
        {
            "fieldname": "project",
            "label": _("Projects"),
            "fieldtype": "Link",
            "options": "Project",
        },
        {
            "fieldname": "task_subject",
            "label": _("Task Subject"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "non_billable_hours",
            "label": _("Non-billable Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "billable_hours",
            "label": _("Billable Hours"),
            "fieldtype": "Float",
        },
    ]


def get_data(filters):
    employees = get_employee_list(filters.get("employee", None))
    timesheet = DocType("Timesheet")
    timesheet_details = DocType("Timesheet Detail")
    task = DocType("Task")
    billable_hours = Sum(
        Case()
        .when(timesheet_details.is_billable == 1, timesheet_details.hours)
        .else_(0)
    ).as_("billable_hours")

    non_billable_hours = Sum(
        Case()
        .when(timesheet_details.is_billable == 0, timesheet_details.hours)
        .else_(0)
    ).as_("non_billable_hours")

    query = (
        frappe.qb.from_(timesheet)
        .inner_join(timesheet_details)
        .on(timesheet_details.parent == timesheet.name)
        .inner_join(task)
        .on(task.name == timesheet_details.task)
        .select(
            timesheet.start_date.as_("from_date"),
            timesheet.employee,
            timesheet.employee_name,
            timesheet_details.project,
            task.subject.as_("task_subject"),
            billable_hours,
            non_billable_hours,
        )
        .where(timesheet.employee.isin(employees))
        .where(timesheet.start_date >= filters.get("from_date"))
        .where(timesheet.end_date <= filters.get("to_date"))
        .groupby(timesheet_details.task, timesheet.employee)
    )

    if filters.get("task", None) is not None:
        query = query.where(timesheet_details.task == filters.get("task"))

    if filters.get("project", None) is not None:
        query = query.where(timesheet_details.project == filters.get("project"))

    return query.run(as_dict=True)


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data
