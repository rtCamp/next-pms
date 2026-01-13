from collections import defaultdict

import frappe
from frappe import get_doc, render_template, sendmail
from frappe.utils import add_days, get_weekday, getdate

from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
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

    next_monday = add_days(date, (7 - weekday) % 7 + 0)
    next_sunday = add_days(date, (7 - weekday) % 7 + 6)

    # Get all employee names (managers + their children)
    all_employee_names = set(employees.keys())
    for emp, data in employees.items():
        for child in data.get("childrens", []):
            all_employee_names.add(child.get("name"))

    # Batch fetch allocations for all employees
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
        values=list(all_employee_names),
        start_date=next_monday,
        end_date=next_sunday,
    )

    # Build allocation map: employee -> list of allocations
    allocation_map = defaultdict(list)
    for alloc in allocations:
        allocation_map[alloc.get("employee")].append(alloc)

    # Batch fetch leaves for all employees
    leaves = frappe.db.sql("""
        SELECT employee, from_date, to_date
        FROM `tabLeave Application`
        WHERE employee IN %(employees)s
        AND status IN ('Approved', 'Open')
        AND (docstatus = 1 OR docstatus = 0)
        AND (
            (from_date <= %(start_date)s AND to_date >= %(start_date)s)
            OR (from_date >= %(start_date)s AND to_date <= %(end_date)s)
            OR (from_date <= %(end_date)s AND to_date >= %(end_date)s)
            OR (from_date <= %(start_date)s AND to_date >= %(end_date)s)
        )
    """, {
        "employees": list(all_employee_names),
        "start_date": next_monday,
        "end_date": next_sunday
    }, as_dict=True)

    # Build leave map: employee -> list of (from_date, to_date) tuples
    leave_map = defaultdict(list)
    for leave in leaves:
        leave_map[leave.employee].append((leave.from_date, leave.to_date))

    # Pre-generate all dates for the week
    week_dates = []
    current = next_monday
    while current <= next_sunday:
        if current.weekday() not in SKIP_WEEKDAYS:
            week_dates.append(current)
        current = add_days(current, 1)

    args = []
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
            if r_employee.get("designation") not in designations:
                continue

            emp_name = r_employee.get("name")
            emp_missing_allocations = {
                "employee": emp_name,
                "employee_name": r_employee.get("employee_name"),
                "designation": r_employee.get("designation"),
                "dates": [],
            }

            # Get allocations and leaves for this employee from the maps
            employee_allocations = allocation_map.get(emp_name, [])
            employee_leaves = leave_map.get(emp_name, [])

            # Check each date in the week
            for date_to_check in week_dates:
                # Check if there's an allocation for this date
                has_allocation = any(
                    alloc.get("allocation_start_date") <= date_to_check <= alloc.get("allocation_end_date")
                    for alloc in employee_allocations
                )

                # Check if there's a leave for this date
                has_leave = any(
                    from_date <= date_to_check <= to_date
                    for from_date, to_date in employee_leaves
                )

                # If no allocation and no leave, add to missing allocations
                if not has_allocation and not has_leave:
                    emp_missing_allocations["dates"].append(date_to_check.strftime("%Y-%m-%d"))

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
