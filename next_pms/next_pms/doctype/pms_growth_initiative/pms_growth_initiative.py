# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from next_pms.utils.permissions import has_owner_gated_permission

STATUS_DOCTYPE = "PMS Growth Initiative Status"


class PMSGrowthInitiative(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        activity: DF.Data
        activity_owner: DF.Link | None
        billable_outcome: DF.Currency
        category: DF.Link | None
        client_priority: DF.Literal["", "Low", "Medium", "High"]
        closed_status: DF.Link | None
        description: DF.TextEditor | None
        desired_outcome: DF.TextEditor | None
        ideation_date: DF.Date
        ideation_owner: DF.Link | None
        is_closed: DF.Check
        project: DF.Link
        status: DF.Link
    # end: auto-generated types

    def validate(self):
        self._validate_status_type("status", "Status")
        self.is_closed = frappe.db.get_value(STATUS_DOCTYPE, self.status, "is_closed") or 0
        self._validate_closed_status()

    def _validate_status_type(self, fieldname, expected_type):
        value = self.get(fieldname)
        if value and frappe.db.get_value(STATUS_DOCTYPE, value, "status_type") != expected_type:
            frappe.throw(
                _("{0} must be a status of type {1}.").format(
                    frappe.bold(self.meta.get_label(fieldname)), frappe.bold(expected_type)
                )
            )

    def _validate_closed_status(self):
        if not self.is_closed:
            self.closed_status = None
            return
        if not self.closed_status:
            frappe.throw(_("Closed Status is required when the status is {0}.").format(frappe.bold(self.status)))
        self._validate_status_type("closed_status", "Closed Status")


def has_permission(doc, ptype="read", user=None, debug=False):
    """Timesheet Manager / Projects User may write only when they are activity_owner."""
    return has_owner_gated_permission(doc.activity_owner, ptype, user or frappe.session.user)
