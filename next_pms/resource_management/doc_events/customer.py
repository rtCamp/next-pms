import re

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


@frappe.whitelist()
def _generate_unique_abbr(customer_name: str, exclude_name: str | None = None) -> str:
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

    # Strip SQL LIKE wildcards (and other non-alphanumerics) from the leading
    # char of each word so a customer name like "%Foo Bar" can't leak `%`/`_`
    # into the prefetch pattern. The inner loop below still uses the raw
    # word chars for the generated abbr itself — only the prefetch shape is
    # sanitized.
    shape_chars = [re.sub(r"[^A-Za-z0-9]", "", w[:1]) for w in words]
    shape_chars = [c for c in shape_chars if c]

    if not shape_chars:
        # Customer name has no usable alphanumeric leading chars — fall back
        # to no prefetch; the in-memory collision check will just see an
        # empty set and the first candidate abbr will be returned.
        taken = set()
    else:
        shape_pattern = "%".join(shape_chars).upper() + "%"
        filters = {"custom_abbr": ["like", shape_pattern]}
        if exclude_name:
            filters["name"] = ["!=", exclude_name]
        # Case-normalize: DB collation may be case-insensitive and return
        # lowercase values like "awc" for the pattern "A%W%C%". Our generated
        # candidate is uppercase, so we upper-case the taken set too.
        taken = {v.upper() for v in frappe.get_all("Customer", filters=filters, pluck="custom_abbr")}

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
