import frappe


def validate_abbr(doc, method=None):
    if not doc.custom_abbr:
        doc.custom_abbr = "".join(c[0] for c in doc.customer_name.split()).upper()

    doc.custom_abbr = doc.custom_abbr.strip()

    if not doc.custom_abbr.strip():
        frappe.throw(frappe._("Abbreviation is mandatory"))

    if frappe.db.get_value("Customer", {"custom_abbr": doc.custom_abbr, "name": ["!=", doc.name]}):
        frappe.throw(frappe._("Abbreviation already used for another company"))
