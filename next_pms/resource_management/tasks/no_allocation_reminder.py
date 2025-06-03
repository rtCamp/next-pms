from frappe import get_doc, render_template, sendmail
from frappe.utils import add_days, get_weekday, getdate

from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.utils.employee import generate_flat_tree

SKIP_WEEKDAYS = [5, 6]  # Saturday and Sunday


def send_reminder():
    doc = get_doc("Timesheet Settings")
    date = getdate()
    weekday = date.weekday()
    designations = [d.designation for d in doc.designations]
    if (
        not doc.send_missing_allocation_reminder
        or get_weekday(date) != doc.remind_on
        or not designations
        or not doc.allocation_email_template
    ):
        return

    employees = generate_flat_tree(
        "Employee",
        nsm_field="reports_to",
        filters={"status": "Active"},
        fields=["name", "user_id", "employee_name", "designation"],
    )
    if not employees:
        return
    employees = employees.get("with_children", [])
    if not employees:
        return
    args = []
    next_monday = add_days(date, (7 - weekday) % 7 + 0)
    next_sunday = add_days(date, (7 - weekday) % 7 + 6)

    allocations = get_allocation_list_for_employee_for_given_range(
        columns=[
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
            "modified_by",
            "modified",
            "creation",
        ],
        value_key="employee",
        values=list(employees.keys()),
        start_date=next_monday,
        end_date=next_sunday,
    )
    for employee, data in employees.items():
        if not data.get("childrens"):
            continue
        arg = {
            "employee": employee,
            "employee_name": data.get("employee_name"),
            "user_id": data.get("user_id"),
            "missing_allocations": [],
        }
        for r_employee in data.get("childrens"):
            _start_date = next_monday
            _end_date = next_sunday
            if r_employee.get("designation") not in designations:
                continue
            emp_missing_allocations = {
                "employee": r_employee.get("name"),
                "employee_name": r_employee.get("employee_name"),
                "designation": r_employee.get("designation"),
                "dates": [],
            }
            employee_allocations = [
                allocation for allocation in allocations if allocation.get("employee") == r_employee.get("name")
            ]
            leaves = get_employee_leaves(
                employee=r_employee.get("name"),
                start_date=next_monday,
                end_date=next_sunday,
            )

            while _start_date <= _end_date:
                if _start_date.weekday() in SKIP_WEEKDAYS:
                    _start_date = add_days(_start_date, 1)
                    continue
                if not employee_allocations and not leaves:
                    emp_missing_allocations["dates"].append(_start_date.strftime("%Y-%m-%d"))
                    _start_date = add_days(_start_date, 1)
                    continue
                if not employee_allocations or not any(
                    allocation.get("allocation_start_date") <= _start_date <= allocation.get("allocation_end_date")
                    for allocation in employee_allocations
                ):
                    if not leaves or not any(
                        leave.get("from_date") <= _start_date <= leave.get("to_date") for leave in leaves
                    ):
                        emp_missing_allocations["dates"].append(_start_date.strftime("%Y-%m-%d"))
                _start_date = add_days(_start_date, 1)
            if emp_missing_allocations["dates"]:
                arg["missing_allocations"].append(emp_missing_allocations)

        if arg["missing_allocations"]:
            args.append(arg)

    if not args:
        return

    template = get_doc("Email Template", doc.allocation_email_template)

    for arg in args:
        message = render_template(template.response if not template.use_html else template.response_html, arg)
        subject = render_template(template.subject, arg)
        sender = template.custom_sender_email if hasattr(template, "custom_sender_email") else None
        sendmail(recipients=arg["user_id"], subject=subject, message=message, sender=sender)
