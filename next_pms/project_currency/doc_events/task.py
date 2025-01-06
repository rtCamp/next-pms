import frappe


def after_insert(doc, method=None):
    if doc.project:
        custom_billing_type = frappe.db.get_value("Project", doc.project, "custom_billing_type")

        is_billable = custom_billing_type != "Non-Billable"

        if is_billable:
            doc.custom_is_billable = 1
            doc.save(ignore_permissions=True)


def validate(doc, method=None):
    doc.update_time_and_costing()
