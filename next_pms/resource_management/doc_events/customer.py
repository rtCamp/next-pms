import frappe

from next_pms.api.customer import generate_unique_abbr


def validate_abbr(doc, method=None):
    if not doc.custom_abbr:
        doc.custom_abbr = generate_unique_abbr(doc.customer_name, exclude_name=doc.name)
        return

    doc.custom_abbr = doc.custom_abbr.strip()

    if not doc.custom_abbr:
        frappe.throw(frappe._("Abbreviation is mandatory"))

    if frappe.db.get_value("Customer", {"custom_abbr": doc.custom_abbr, "name": ["!=", doc.name]}):
        frappe.throw(frappe._("Abbreviation already used for another customer"))
