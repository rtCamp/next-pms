import frappe


def after_insert(doc, method=None):
    if doc.project:
        is_billable = frappe.db.get_value("Project", doc.project, "custom_is_billable")

        if is_billable:
            doc.custom_is_billable = 1
            doc.save()
