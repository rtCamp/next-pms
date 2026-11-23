import frappe


def after_insert(doc, method=None):
    if doc.project:
        custom_billing_type = frappe.db.get_value("Project", doc.project, "custom_billing_type")

        is_billable = custom_billing_type != "Non-Billable"

        if is_billable:
            doc.custom_is_billable = 1
            doc.save(ignore_permissions=True)


def validate(doc, method=None):
    _check_project_access(doc)
    doc.update_time_and_costing()


def _check_project_access(doc):
    """A task can only be put on a project the user can read, so an Employee adds tasks
    only to projects shared with them."""
    if doc.flags.ignore_permissions or not doc.project:
        return
    if doc.is_new() or doc.has_value_changed("project"):
        frappe.has_permission("Project", doc=doc.project, throw=True)
