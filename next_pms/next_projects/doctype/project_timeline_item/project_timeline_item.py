# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class ProjectTimelineItem(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        actual_end_date: DF.Date | None
        category: DF.Link | None
        is_complete: DF.Check
        is_internal: DF.Check
        item_owner: DF.Link
        item_owner_name: DF.Data | None
        planned_end_date: DF.Date
        project: DF.Link
        start_date: DF.Date | None
        title: DF.Data
        type: DF.Literal["Milestone", "Touchpoint"]
    # end: auto-generated types

    def validate(self):
        if self.type == "Touchpoint" and not self.start_date:
            self.start_date = self.planned_end_date

        self.validate_category()

    def validate_category(self):
        if not self.category:
            self.category = f"Other - {self.type}"
            return

        applies_to = frappe.db.get_value("Project Timeline Item Category", self.category, "applies_to")
        if applies_to != self.type:
            frappe.throw(_("Category {0} applies to {1}, not to {2}").format(self.category, applies_to, self.type))
