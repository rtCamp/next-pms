import frappe

from next_pms.install import create_default_timeline_item_categories


def execute():
    create_default_timeline_item_categories()

    for item_type in ("Milestone", "Touchpoint"):
        frappe.db.set_value(
            "Project Timeline Item",
            {"type": item_type, "category": ("in", (None, ""))},
            "category",
            f"Other - {item_type}",
            update_modified=False,
        )
