# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class PMSGrowthInitiativeStatus(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        is_closed: DF.Check
        status_type: DF.Literal["Status", "Closed Status"]
    # end: auto-generated types

    def validate(self):
        if self.status_type != "Status":
            self.is_closed = 0
        self._prevent_type_change_in_use()
        self._prevent_closing_status_in_use()

    def _prevent_type_change_in_use(self):
        if self.is_new() or not self.has_value_changed("status_type"):
            return
        if any(
            frappe.db.exists(doctype, {fieldname: self.name})
            for doctype in ("PMS Growth Initiative", "PMS Growth Initiative Update")
            for fieldname in ("status", "closed_status")
        ):
            frappe.throw(
                _("Status Type of {0} cannot be changed because growth initiatives already use it.").format(
                    frappe.bold(self.name)
                )
            )

    def _prevent_closing_status_in_use(self):
        if not (self.is_closed and self.has_value_changed("is_closed")):
            return
        if frappe.db.exists("PMS Growth Initiative Update", {"status": self.name}):
            frappe.throw(
                _(
                    "{0} cannot be marked closed because growth initiatives already use it without a closed status."
                ).format(frappe.bold(self.name))
            )

    def on_update(self):
        if self.has_value_changed("is_closed"):
            values = {"is_closed": self.is_closed}
            if not self.is_closed:
                values["closed_status"] = None
            frappe.db.set_value(
                "PMS Growth Initiative",
                {"status": self.name},
                values,
                update_modified=False,
            )
