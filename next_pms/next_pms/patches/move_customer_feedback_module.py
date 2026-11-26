import frappe


def execute():
    """Customer Feedback moved from the rtcamp app; on sites that had it, hand its Module Def to next_pms."""
    frappe.db.set_value("Module Def", "Customer Feedback", "app_name", "next_pms")
