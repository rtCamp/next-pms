# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.permissions import add_user_permission


class NextPMSNotifications(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        label: DF.Data
        linked_doctype: DF.Link
        linked_document: DF.DynamicLink
        user: DF.Link
    # end: auto-generated types

    def after_insert(self):
        # Restrict each user to their own notifications (one User Permission per user, scoped to this doctype).
        if self.user:
            add_user_permission(
                "User",
                self.user,
                self.user,
                applicable_for="NextPMS Notifications",
                ignore_permissions=True,
            )


def create_notification(user, label, linked_doctype, linked_document):
    frappe.get_doc(
        {
            "doctype": "NextPMS Notifications",
            "user": user,
            "label": label,
            "linked_doctype": linked_doctype,
            "linked_document": linked_document,
        }
    ).insert(ignore_permissions=True)
