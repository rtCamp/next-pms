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
        self.restrict_to_recipient()
        self.send_email()

    def restrict_to_recipient(self):
        """Restrict the recipient to their own notifications (one User Permission per user, scoped to this doctype).

        Notifications are inserted by parallel jobs and User Permission has no unique constraint, so the
        check-then-insert is serialised per recipient: lock their User row, then re-check with a locking
        read, which sees a permission another job committed while this one waited.
        """
        if not self.user:
            return

        frappe.db.get_value("User", self.user, "name", for_update=True)
        if frappe.db.get_value(
            "User Permission",
            {"user": self.user, "allow": "User", "for_value": self.user, "applicable_for": self.doctype},
            "name",
            for_update=True,
        ):
            return

        add_user_permission("User", self.user, self.user, applicable_for=self.doctype, ignore_permissions=True)

    def send_email(self):
        """Deliver the companion email, if this notification carries one.

        Runs here so the email and the in-app notification reach the user at the same moment:
        both are produced by this single insert, which `insert_notification` performs.
        """
        if not self.email_subject:
            return

        recipient = frappe.db.get_value("User", self.user, "email")
        if not recipient:
            return

        # A mail failure must not take the notification down with it: raising here would fail the
        # job and roll back the row, so the email error is logged on its own instead.
        try:
            frappe.sendmail(
                recipients=[recipient],
                subject=self.email_subject,
                message=self.email_message,
                reference_doctype=self.linked_doctype,
                reference_name=self.linked_document,
                now=True,
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
    source document in hand. Both land when the background job runs, after the caller commits.

    `title` and `label` are trimmed to the varchar limit here: they interpolate user-supplied names
    that can each fill a Data column on their own, and the resulting length error would fail the job.
    """
    frappe.enqueue(
        insert_notification,
        queue="short",
        enqueue_after_commit=True,
        now=frappe.in_test,
        record={
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


def insert_notification(record):
    """Runs as a background job, so a failure lands in the Error Log with its traceback.

    Permissions are ignored because the job runs as whoever triggered it, not as the recipient.
    """
    frappe.get_doc({"doctype": "NextPMS Notifications", **record}).insert(ignore_permissions=True)
