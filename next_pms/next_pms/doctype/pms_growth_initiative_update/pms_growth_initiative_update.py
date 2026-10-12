# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class PMSGrowthInitiativeUpdate(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        billable_outcome: DF.Currency
        client_priority: DF.Literal["", "Low", "Medium", "High"]
        closed_status: DF.Link | None
        note: DF.TextEditor | None
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
        status: DF.Link | None
        updated_at: DF.Datetime | None
        updated_by: DF.Link | None
    # end: auto-generated types

    pass
