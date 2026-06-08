# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
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
        risk_category: DF.Link | None
        risk_level: DF.Link | None
        risk_update_log: DF.Table[RiskUpdate]
        status: DF.Link | None
        summary: DF.TextEditor | None
    # end: auto-generated types

    def before_save(self):
        self._set_updated_by_on_new_rows()
        self._prevent_deleting_others_rows()
        self._sync_fields_from_latest_update()

    def _set_updated_by_on_new_rows(self):
        for row in self.risk_update_log:
            if row.is_new():
                row.updated_by = frappe.session.user

    def _prevent_deleting_others_rows(self):
        if "System Manager" in frappe.get_roles():
            return

        submitted_names = {row.name for row in self.risk_update_log if row.name}
        existing_rows = frappe.get_all(
            "Risk Update",
            filters={"parent": self.name},
            fields=["name", "owner"],
        )
        for row in existing_rows:
            if row["name"] not in submitted_names and row["owner"] != frappe.session.user:
                frappe.throw(
                    f"You can only delete rows you created. Row created by {row['owner']} cannot be removed.",
                    frappe.PermissionError,
                )

    def _sync_fields_from_latest_update(self):
        if not self.risk_update_log:
            return
        latest = self.risk_update_log[-1]
        if latest.status:
            self.status = latest.status
        if latest.risk_level:
            self.risk_level = latest.risk_level
