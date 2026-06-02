import re

import frappe


@frappe.whitelist()
def generate_unique_abbr(customer_name: str, exclude_name: str | None = None) -> str:
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
    initial_chars = [re.sub(r"[^A-Za-z0-9]", "", w[:1]) for w in words]
    initial_chars = [c for c in initial_chars if c]

    if not initial_chars:
        # Customer name has no usable alphanumeric leading chars — fall back
        # to no prefetch; the in-memory collision check will just see an
        # empty set and the first candidate abbr will be returned.
        taken = set()
    else:
        abbr_like_pattern = "%".join(initial_chars).upper() + "%"
        filters = {"custom_abbr": ["like", abbr_like_pattern]}
        if exclude_name:
            filters["name"] = ["!=", exclude_name]
        # Case-normalize: DB collation may be case-insensitive and return
        # lowercase values like "awc" for the pattern "A%W%C%". Our generated
        # candidate is uppercase, so we upper-case the taken set too.
        taken = {v.upper() for v in frappe.get_all("Customer", filters=filters, pluck="custom_abbr")}

    # In-memory disambiguation loop — `taken` was prefetched above so this
    # does no DB I/O regardless of how many iterations it takes.
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
