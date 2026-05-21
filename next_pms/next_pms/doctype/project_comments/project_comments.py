# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ProjectComments(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        comment: DF.TextEditor | None
        created_at: DF.Datetime | None
        modified_at: DF.Datetime | None
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
        reply_to: DF.Link | None
        user: DF.Link | None
    # end: auto-generated types

    pass
