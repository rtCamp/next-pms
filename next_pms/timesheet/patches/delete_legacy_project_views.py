import frappe


def execute():
    """Delete saved PMS views for Project.

    The current view layer stores `order_by` as a list where the previous implementation stored
    a dict, so views saved by it break the Projects page when they are applied. Views for other
    doctypes are left alone — no page reads them today, and whether they can be carried forward
    is decided when those pages adopt the new view layer.
    """
    if not frappe.db.table_exists("PMS View Setting"):
        return

    frappe.db.delete("PMS View Setting", {"dt": "Project"})
