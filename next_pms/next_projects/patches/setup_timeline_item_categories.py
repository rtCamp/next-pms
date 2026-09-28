import frappe

from next_pms.install import create_default_timeline_item_categories
from next_pms.next_projects.doctype.project_timeline_item_category.project_timeline_item_category import (
    get_fallback_category,
)


def execute():
    create_default_timeline_item_categories()

    for item_type in ("Milestone", "Touchpoint"):
        frappe.db.set_value(
            "Project Timeline Item",
            {"type": item_type, "category": ("in", (None, ""))},
            "category",
            get_fallback_category(item_type),
            update_modified=False,
        )
