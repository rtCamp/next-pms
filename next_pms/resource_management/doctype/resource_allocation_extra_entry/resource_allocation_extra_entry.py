# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ResourceAllocationExtraEntry(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        cancelled: DF.Check
        date: DF.Date
        hours: DF.Float
        parent: DF.Data
        parentfield: DF.Data
        parenttype: DF.Data
    # end: auto-generated types

    pass
