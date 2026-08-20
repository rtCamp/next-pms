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
        self._prevent_editing_others_rows()
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
            fields=["name", "updated_by"],
        )
        for row in existing_rows:
            if row["name"] not in submitted_names and row["updated_by"] != frappe.session.user:
                frappe.throw(
                    frappe._("You can only delete rows you created. Row created by {0} cannot be removed.").format(
                        row["updated_by"]
                    ),
                    frappe.PermissionError,
                )

    def _prevent_editing_others_rows(self):
        if "System Manager" in frappe.get_roles():
            return

        existing_rows = {
            row["name"]: row
            for row in frappe.get_all(
                "Risk Update",
                filters={"parent": self.name},
                fields=["name", "updated_by", "note", "status", "risk_level", "updated_at"],
            )
        }

        for row in self.risk_update_log:
            # if it is a new row, skip - it is the creation flow
            if row.is_new() or not row.name:
                continue

            prev = existing_rows.get(row.name)
            # the user who made the row can edit it
            if prev["updated_by"] == frappe.session.user:
                continue

            fields_changed = (
                (row.note or None) != (prev.get("note") or None)
                or (row.status or None) != (prev.get("status") or None)
                or (row.risk_level or None) != (prev.get("risk_level") or None)
                or str(row.updated_at or "") != str(prev.get("updated_at") or "")
                or (row.updated_by or None) != (prev.get("updated_by") or None)
            )

            if fields_changed:
                frappe.throw(
                    frappe._("You can only edit rows you created. Row created by {0} cannot be modified.").format(
                        prev["updated_by"]
                    ),
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
