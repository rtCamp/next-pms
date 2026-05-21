# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ProjectStatusUpdate(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.next_pms.doctype.project_comments.project_comments import ProjectComments

        comments: DF.Table[ProjectComments]
        description: DF.TextEditor | None
        last_edited_at: DF.Datetime | None
        last_edited_by: DF.Link | None
        project: DF.Link | None
        status: DF.Literal["Draft", "Review", "Publish"]
        title: DF.Data | None
    # end: auto-generated types

    pass
