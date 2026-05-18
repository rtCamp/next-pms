import frappe


def validate_abbr(doc, method=None):
    if not doc.custom_abbr:
        doc.custom_abbr = _generate_unique_abbr(doc.customer_name, exclude_name=doc.name)
        return

    doc.custom_abbr = doc.custom_abbr.strip()

    if not doc.custom_abbr:
        frappe.throw(frappe._("Abbreviation is mandatory"))

    if frappe.db.get_value("Customer", {"custom_abbr": doc.custom_abbr, "name": ["!=", doc.name]}):
        frappe.throw(frappe._("Abbreviation already used for another customer"))


def _generate_unique_abbr(customer_name, exclude_name=None):
    """Build a unique custom_abbr from customer_name initials.

    On collision, extend the abbr by pulling the next character from the
    leftmost word that still has unused characters. Example:
        "Acme Web Co"      -> AWC
        "Apex Widget Corp" -> APWC   (first word extended to AP)
        "AP Web Company"   -> APWEC  (first word exhausted, second extended to WE)

    Every candidate abbr we could generate starts with the first letter of
    each word in order, so we prefetch all existing customer abbrs matching
    that shape (e.g. ``A%W%C%``) in one query and check collisions in memory.
    """
    words = (customer_name or "").split()
    if not words:
        frappe.throw(frappe._("Abbreviation is mandatory"))

    shape_pattern = "%".join(w[0] for w in words).upper() + "%"
    filters = {"custom_abbr": ["like", shape_pattern]}
    if exclude_name:
        filters["name"] = ["!=", exclude_name]
    taken = set(frappe.get_all("Customer", filters=filters, pluck="custom_abbr"))

    slice_lens = [1] * len(words)
    while True:
        abbr = "".join(words[i][: slice_lens[i]] for i in range(len(words))).upper()
        if abbr not in taken:
            return abbr

        for i in range(len(words)):
            if slice_lens[i] < len(words[i]):
                slice_lens[i] += 1
                break
        else:
            frappe.throw(frappe._("Unable to generate unique abbreviation from customer name"))
