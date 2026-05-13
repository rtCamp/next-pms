# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ProjectTimelineItem(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        actual_end_date: DF.Date | None
        is_complete: DF.Check
        item_owner: DF.Link
        planned_end_date: DF.Date | None
        project: DF.Link
        start_date: DF.Date | None
        title: DF.Data
        type: DF.Literal["Milestone", "Touchpoint"]
    # end: auto-generated types

    pass
