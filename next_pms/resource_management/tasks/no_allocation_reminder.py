from frappe import get_doc, render_template, sendmail
from frappe.utils import add_days, get_weekday, getdate

from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.utils.employee import generate_flat_tree

SKIP_WEEKENDS = [5, 6]  # Saturday and Sunday


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

    employee_names = list(employees.keys())
    for emp, data in employees.items():
        for child in data.get("childrens", []):
            employee_names.append(child.get("name"))

    employee_names = list(set(employee_names))

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
        values=employee_names,
        start_date=next_monday,
        end_date=next_sunday,
    )

    allocation_map = {}
    for alloc in allocations:
        emp = alloc.get("employee")
        if emp not in allocation_map:
            allocation_map[emp] = []
        allocation_map[emp].append(alloc)

    leaves = get_employee_leaves(
        employee=tuple(employee_names),
        start_date=next_monday,
        end_date=next_sunday,
    )

    leave_map = {}
    for leave in leaves:
        emp = leave.employee
        if emp not in leave_map:
            leave_map[emp] = []
        leave_map[emp].append(leave)

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

            emp_name = r_employee.get("name")
            emp_missing_allocations = {
                "employee": emp_name,
                "employee_name": r_employee.get("employee_name"),
                "designation": r_employee.get("designation"),
                "dates": [],
            }
            leaves = leave_map.get(emp_name, [])
            employee_allocations = allocation_map.get(emp_name, [])

            while _start_date <= _end_date:
                if _start_date.weekday() in SKIP_WEEKENDS:
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
        message = render_template(  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti
            template.response if not template.use_html else template.response_html, arg
        )
        subject = render_template(template.subject, arg)  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti
        sender = template.custom_sender_email if hasattr(template, "custom_sender_email") else None
        sendmail(recipients=arg["user_id"], subject=subject, message=message, sender=sender)
