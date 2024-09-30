# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt


import frappe
from frappe import _, get_all, get_list
from frappe.query_builder import DocType


def get_columns():
    return [
        {
            "fieldname": "from_date",
            "label": _("Date"),
            "fieldtype": "Date",
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee"),
            "fieldtype": "Data",
            "options": "Employee",
            "width": 200,
        },
        {
            "fieldname": "project",
            "label": _("Project"),
            "fieldtype": "Link",
            "options": "Project",
        },
        {
            "fieldname": "task_subject",
            "label": _("Task Subject"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "hours",
            "label": _("Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "description",
            "label": _("Comments"),
            "fieldtype": "data",
            "width": 300,
        },
    ]


def get_employee_list(employee: str | None = None):
    current_user_roles = frappe.get_roles()
    filters = {}
    if employee:
        filters["name"] = employee

    if "Timesheet Manager" in current_user_roles:
        return get_all("Employee", filters=filters, pluck="name")
    else:
        return get_list("Employee", filters=filters, pluck="name")


def get_data(filters):
    employees = get_employee_list(filters.get("employee", None))
    timesheet = DocType("Timesheet")
    timesheet_details = DocType("Timesheet Detail")
    task = DocType("Task")
    query = (
        frappe.qb.from_(timesheet)
        .inner_join(timesheet_details)
        .on(timesheet_details.parent == timesheet.name)
        .inner_join(task)
        .on(task.name == timesheet_details.task)
        .select(
            timesheet.start_date.as_("from_date"),
            timesheet.employee_name,
            timesheet_details.project,
            task.subject.as_("task_subject"),
            timesheet_details.hours,
            timesheet_details.description,
        )
        .where(timesheet.employee.isin(employees))
        .where(timesheet.start_date >= filters.get("from_date"))
        .where(timesheet.end_date <= filters.get("to_date"))
        .where(timesheet_details.is_billable == 1)
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
