# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe


def get_permission_query_conditions_for_timesheet(user=None):
    """Return SQL WHERE condition to scope Timesheet queries.

    Managers / Admins have unrestricted visibility.
    Regular Employees can only view their own timesheets.
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)
    if any(
        r in roles
        for r in (
            "System Manager",
            "Projects Manager",
            "HR User",
            "Accounts User",
            "Administrator",
        )
    ):
        return ""

    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if employee:
        return f"`tabTimesheet`.`employee` = {frappe.db.escape(employee)}"

    return f"`tabTimesheet`.`owner` = {frappe.db.escape(user)}"


def has_permission_for_timesheet(doc, ptype="read", user=None):
    """Document-level permission evaluator for Timesheet."""
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)
    if any(
        r in roles
        for r in (
            "System Manager",
            "Projects Manager",
            "HR User",
            "Accounts User",
            "Administrator",
        )
    ):
        return True

    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    doc_employee = doc.get("employee") if isinstance(doc, dict) else getattr(doc, "employee", None)
    doc_owner = doc.get("owner") if isinstance(doc, dict) else getattr(doc, "owner", None)

    if employee and doc_employee == employee:
        return True

    if doc_owner == user:
        return True

    return False
