# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from frappe.model.document import Document


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

    pass
