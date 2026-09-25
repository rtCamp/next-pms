# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


def get_fallback_category(item_type: str) -> str:
    return f"Other - {item_type}"


class ProjectTimelineItemCategory(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        applies_to: DF.Literal["Milestone", "Touchpoint"]
        category_name: DF.Data
        position: DF.Int
    # end: auto-generated types

    def on_trash(self):
        if self.name == get_fallback_category(self.applies_to):
            frappe.throw(
                _("{0} is the fallback category for {1} items and cannot be deleted").format(self.name, self.applies_to)
            )
