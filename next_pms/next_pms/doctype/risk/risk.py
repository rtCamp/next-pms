# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Risk(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.next_pms.doctype.risk_update.risk_update import RiskUpdate

        mitigation_plan: DF.TextEditor | None
        project: DF.Link
        risk_category: DF.Literal["Internal Team", "Client", "Design", "Technical", "Timeline/Budget"]
        risk_level: DF.Literal["Low", "Medium", "High"]
        risk_owner: DF.Link | None
        risk_update_log: DF.Table[RiskUpdate]
        status: DF.Literal["Todo", "In Progress", "Escalated", "Blocked", "Mitigated"]
        summary: DF.TextEditor | None
    # end: auto-generated types

    def before_save(self):
        self._sync_fields_from_latest_update()

    def _sync_fields_from_latest_update(self):
        if not self.risk_update_log:
            return
        latest = self.risk_update_log[-1]
        if latest.status:
            self.status = latest.status
        if latest.risk_level:
            self.risk_level = latest.risk_level
