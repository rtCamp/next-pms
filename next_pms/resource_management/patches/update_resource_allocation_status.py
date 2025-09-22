import frappe


def execute():
    frappe.db.set_value("Resource Allocation", {"status": ("!=", "Confirmed")}, "status", "Confirmed")
