# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

from unittest.mock import patch

import frappe
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase

from next_pms.next_pms.notifications import send_note_published_notifications
from next_pms.tests.timesheet.api.test_project_status_update import make_project, make_user

NOTIFICATIONS = "next_pms.next_pms.notifications"
SENDMAIL = "next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications.frappe.sendmail"
JOB_KWARGS = ("note", "actor")

AUTHOR_USER = "note-notify-author@example.com"
SUBSCRIBER_USER = "note-notify-subscriber@example.com"
ACCOUNT_MANAGER_USER = "note-notify-am@example.com"
BYSTANDER_USER = "note-notify-bystander@example.com"
DISABLED_USER = "note-notify-disabled@example.com"
ALL_USERS = (AUTHOR_USER, SUBSCRIBER_USER, ACCOUNT_MANAGER_USER, BYSTANDER_USER, DISABLED_USER)


REAL_ENQUEUE = frappe.enqueue


def run_job_now(method, **kwargs):
    if method is not send_note_published_notifications:
        return REAL_ENQUEUE(method, **kwargs)
    return method(**{key: value for key, value in kwargs.items() if key in JOB_KWARGS})


class IntegrationTestNotePublishedNotification(IntegrationTestCase):
    """Publishing a note notifies project subscribers and the Account Manager exactly once each."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        for email in ALL_USERS:
            make_user(email, roles=("Projects Manager",))
        frappe.db.set_value("User", DISABLED_USER, "enabled", 0)
        cls.project = make_project("Note Notification Project")
        for user in (SUBSCRIBER_USER, AUTHOR_USER, DISABLED_USER):
            frappe.get_doc({"doctype": "PMS Project Update Subscription", "project": cls.project, "user": user}).insert(
                ignore_permissions=True
            )

    def setUp(self):
        patcher = patch(f"{NOTIFICATIONS}.get_project_account_manager", return_value=ACCOUNT_MANAGER_USER)
        patcher.start()
        self.addCleanup(patcher.stop)
        enqueue = patch(f"{NOTIFICATIONS}.frappe.enqueue", side_effect=run_job_now)
        self.enqueue = enqueue.start()
        self.addCleanup(enqueue.stop)

    def tearDown(self):
        frappe.set_user("Administrator")
        frappe.db.delete("NextPMS Notifications", {"user": ["in", ALL_USERS]})
        super().tearDown()

    def _post_note(self, status="Publish"):
        frappe.set_user(AUTHOR_USER)
        doc = frappe.get_doc(
            {
                "doctype": "Project Status Update",
                "project": self.project,
                "title": "Sprint 12 wrap-up",
                "description": "<p>Done</p>",
                "status": status,
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Project Status Update", doc.name, force=True, ignore_permissions=True)
        return doc

    def _flush(self):
        frappe.set_user("Administrator")
        with patch(SENDMAIL) as sendmail:
            save_to_db()
        return sendmail

    def _note_jobs(self):
        return [c for c in self.enqueue.call_args_list if c.args[0] is send_note_published_notifications]

    def _notified_users(self, note):
        return sorted(
            frappe.get_all(
                "NextPMS Notifications",
                filters={"linked_doctype": "Project Status Update", "linked_document": note},
                pluck="user",
            )
        )

    def test_publishing_notifies_subscribers_and_account_manager(self):
        note = self._post_note()
        sendmail = self._flush()

        self.assertEqual(self._notified_users(note.name), sorted([SUBSCRIBER_USER, ACCOUNT_MANAGER_USER]))
        self.assertEqual(
            sorted(c.kwargs["recipients"][0] for c in sendmail.call_args_list), self._notified_users(note.name)
        )
        self.assertTrue(all(c.kwargs["now"] for c in sendmail.call_args_list))

        notification = frappe.get_all(
            "NextPMS Notifications",
            filters={"user": SUBSCRIBER_USER, "linked_document": note.name},
            fields=["url", "label"],
        )[0]
        self.assertEqual(notification.url, f"/next-pms/projects/{self.project}?tab=notes&note={note.name}")
        self.assertIn("Sprint 12 wrap-up", notification.label)

    def test_author_and_disabled_users_are_not_notified(self):
        note = self._post_note()
        self._flush()

        notified = self._notified_users(note.name)
        self.assertNotIn(AUTHOR_USER, notified)
        self.assertNotIn(DISABLED_USER, notified)
        self.assertNotIn(BYSTANDER_USER, notified)

    def test_account_manager_who_also_subscribed_is_notified_once(self):
        with patch(f"{NOTIFICATIONS}.get_project_account_manager", return_value=SUBSCRIBER_USER):
            note = self._post_note()
        self._flush()

        self.assertEqual(self._notified_users(note.name), [SUBSCRIBER_USER])

    def test_draft_does_not_notify_until_published(self):
        note = self._post_note(status="Draft")
        self.assertFalse(self._note_jobs())

        note.status = "Publish"
        note.save(ignore_permissions=True)
        self._flush()

        self.assertEqual(self._notified_users(note.name), sorted([SUBSCRIBER_USER, ACCOUNT_MANAGER_USER]))

    def test_saving_a_published_note_again_does_not_renotify(self):
        note = self._post_note()
        self._flush()

        frappe.set_user(AUTHOR_USER)
        note.reload()
        note.title = "Sprint 12 wrap-up (edited)"
        note.save(ignore_permissions=True)
        self._flush()

        self.assertEqual(len(self._note_jobs()), 1)
        self.assertEqual(len(self._notified_users(note.name)), 2)
