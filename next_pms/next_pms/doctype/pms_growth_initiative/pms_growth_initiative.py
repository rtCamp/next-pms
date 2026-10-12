# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from itertools import pairwise

import frappe
from frappe import _
from frappe.model.document import Document

from next_pms.utils.linked_todos import validate_linked_todos
from next_pms.utils.permissions import has_owner_gated_permission
from next_pms.utils.update_log import prevent_changing_others_update_rows, stamp_new_update_rows

STATUS_DOCTYPE = "PMS Growth Initiative Status"


class PMSGrowthInitiative(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.next_pms.doctype.pms_growth_initiative_update.pms_growth_initiative_update import (
            PMSGrowthInitiativeUpdate,
        )
        from next_pms.next_pms.doctype.pms_linked_todo.pms_linked_todo import PMSLinkedToDo

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
        linked_todos: DF.Table[PMSLinkedToDo]
        project: DF.Link
        status: DF.Link
        update_log: DF.Table[PMSGrowthInitiativeUpdate]
    # end: auto-generated types

    def validate(self):
        self._ensure_initial_update_log()
        self._carry_forward_unset_update_fields()
        stamp_new_update_rows(self.update_log)
        prevent_changing_others_update_rows(
            self, "update_log", ("note", "status", "closed_status", "client_priority", "billable_outcome")
        )
        self._sync_fields_from_latest_update()

        self._validate_status_type(self.status, "status", "Status")
        self.is_closed = frappe.db.get_value(STATUS_DOCTYPE, self.status, "is_closed") or 0
        self._validate_closed_status()
        self._validate_update_log_rows()
        if self.update_log and self.update_log[-1].is_new():
            self.update_log[-1].closed_status = self.closed_status
        validate_linked_todos(self)

    def _ensure_initial_update_log(self):
        if self.update_log or not self.status:
            return
        self.append(
            "update_log",
            {
                "status": self.status,
                "closed_status": self.closed_status,
                "client_priority": self.client_priority or "",
                "billable_outcome": self.billable_outcome,
                "updated_at": self.creation,
            },
        )

    def _carry_forward_unset_update_fields(self):
        for previous, row in pairwise(self.update_log):
            if not row.is_new():
                continue
            if not row.status:
                row.status, row.closed_status = previous.status, previous.closed_status
            if not row.client_priority:
                row.client_priority = previous.client_priority
            if row.billable_outcome is None:
                row.billable_outcome = previous.billable_outcome

    def _sync_fields_from_latest_update(self):
        if not self.update_log:
            return
        latest = self.update_log[-1]
        if latest.status:
            self.status, self.closed_status = latest.status, latest.closed_status
        if latest.client_priority is not None:
            self.client_priority = latest.client_priority
        if latest.billable_outcome is not None:
            self.billable_outcome = latest.billable_outcome

    def _validate_status_type(self, value, fieldname, expected_type):
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
        self._validate_status_type(self.closed_status, "closed_status", "Closed Status")

    def _validate_update_log_rows(self):
        for row in self.update_log:
            if not row.status:
                continue
            self._validate_status_type(row.status, "status", "Status")
            if not (frappe.db.get_value(STATUS_DOCTYPE, row.status, "is_closed") or 0):
                continue
            if not row.closed_status:
                frappe.throw(_("Closed Status is required when the status is {0}.").format(frappe.bold(row.status)))
            self._validate_status_type(row.closed_status, "closed_status", "Closed Status")


def has_permission(doc, ptype="read", user=None, debug=False):
    """Projects User may write only when they are activity_owner."""
    return has_owner_gated_permission(doc.activity_owner, ptype, user or frappe.session.user)
