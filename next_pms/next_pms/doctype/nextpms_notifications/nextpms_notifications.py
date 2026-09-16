# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.deferred_insert import deferred_insert
from frappe.model.document import Document
from frappe.permissions import add_user_permission


class NextPMSNotifications(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        email_message: DF.LongText | None
        email_subject: DF.SmallText | None
        label: DF.Data
        linked_doctype: DF.Link
        linked_document: DF.DynamicLink
        title: DF.Data
        url: DF.SmallText | None
        user: DF.Link
        viewed: DF.Check
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
        self.send_email()

    def send_email(self):
        """Deliver the companion email, if this notification carries one.

        Runs here so the email and the in-app notification reach the user at the same moment:
        both are produced by this single insert, which `frappe.deferred_insert` performs.
        """
        if not self.email_subject:
            return

        recipient = frappe.db.get_value("User", self.user, "email")
        if not recipient:
            return

        # A mail failure must not take the notification down with it: deferred_insert swallows
        # exceptions from this insert into a log line, so raising here would silently drop the row.
        try:
            frappe.sendmail(
                recipients=[recipient],
                subject=self.email_subject,
                message=self.email_message,
                reference_doctype=self.linked_doctype,
                reference_name=self.linked_document,
            )
        except Exception:
            frappe.log_error(
                title="NextPMS notification email failed",
                message=frappe.get_traceback(with_context=True),
                reference_doctype=self.doctype,
                reference_name=self.name,
            )


def truncate(text: str | None, max_length: int) -> str | None:
    """Trim `text` to `max_length` characters, marking the cut with an ellipsis."""
    if not text or len(text) <= max_length:
        return text
    return f"{text[: max_length - 3].rstrip()}..."


def create_notification(user, title, label, linked_doctype, linked_document, url=None, email=None):
    """Queue an in-app notification, optionally with an email delivered alongside it.

    `email` is a {"subject", "message"} dict rendered by the caller, since only the caller has the
    source document in hand. Both land when the deferred queue is flushed.

    `title` and `label` are trimmed to the varchar limit here: they interpolate user-supplied names
    that can each fill a Data column on their own, and `deferred_insert` turns the resulting length
    error into a log line, dropping the notification and its email without a trace.
    """
    deferred_insert(
        "NextPMS Notifications",
        {
            "user": user,
            "title": truncate(title, frappe.db.VARCHAR_LEN),
            "label": truncate(label, frappe.db.VARCHAR_LEN),
            "linked_doctype": linked_doctype,
            "linked_document": linked_document,
            "url": url,
            "email_subject": email.get("subject") if email else None,
            "email_message": email.get("message") if email else None,
        },
    )
