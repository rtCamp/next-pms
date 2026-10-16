import frappe
from frappe import _

NON_BILLABLE = "Non-Billable"


def validate(doc, method=None):
    validate_tech_stack(doc)


def validate_tech_stack(doc):
    if doc.custom_billing_type == NON_BILLABLE or doc.get("tech_stack"):
        return
    if doc.is_new() or doc.has_value_changed("custom_billing_type"):
        frappe.throw(_("Tech Stack is required for billable projects."), title=_("Missing Tech Stack"))
