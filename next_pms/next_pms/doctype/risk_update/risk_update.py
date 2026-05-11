# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class RiskUpdate(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        note: DF.TextEditor | None
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
        risk_level: DF.Literal["Low", "Medium", "High"]
        status: DF.Literal["Todo", "In Progress", "Escalated", "Blocked", "Mitigated"]
        updated_by: DF.Link | None
    # end: auto-generated types

    pass
