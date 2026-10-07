# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from next_pms.utils.permissions import has_owner_gated_permission
from next_pms.utils.update_log import prevent_changing_others_update_rows, stamp_new_update_rows


class Risk(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.next_pms.doctype.risk_update.risk_update import RiskUpdate

        mitigation_plan: DF.TextEditor | None
        project: DF.Link
        risk_category: DF.Link | None
        risk_level: DF.Link
        risk_owner: DF.Link | None
        risk_update_log: DF.Table[RiskUpdate]
        status: DF.Link
        summary: DF.TextEditor | None
    # end: auto-generated types

    def before_save(self):
        self._ensure_initial_update_log()
        stamp_new_update_rows(self.risk_update_log)
        prevent_changing_others_update_rows(self, "risk_update_log", ("note", "status", "risk_level"))
        self._sync_fields_from_latest_update()

    def _ensure_initial_update_log(self):
        if self.risk_update_log:
            return
        if not self.status and not self.risk_level:
            return
        self.append(
            "risk_update_log",
            {
                "status": self.status,
                "risk_level": self.risk_level,
                "updated_at": self.creation,
            },
        )

    def _sync_fields_from_latest_update(self):
        if not self.risk_update_log:
            return
        latest = self.risk_update_log[-1]
        if latest.status and self.status != latest.status:
            self.status = latest.status
        if latest.risk_level and self.risk_level != latest.risk_level:
            self.risk_level = latest.risk_level


def has_permission(doc, ptype="read", user=None, debug=False):
    """Projects User may write only when they are risk_owner."""
    return has_owner_gated_permission(doc.risk_owner, ptype, user or frappe.session.user)
