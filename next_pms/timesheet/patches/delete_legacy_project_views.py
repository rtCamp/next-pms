import frappe


def execute():
    """Delete saved PMS views for Project.

    The view layer reuses the PMS View Setting doctype but stores `order_by` as a list
    instead of a dict, so views saved by the previous implementation break the Projects
    page when it applies them.
    """
    if not frappe.db.table_exists("PMS View Setting"):
        return

    frappe.db.delete("PMS View Setting", {"dt": "Project"})
