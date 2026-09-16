# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

from unittest.mock import patch

import frappe
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_risk_masters

SENDMAIL = "next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications.frappe.sendmail"

ACTOR_USER = "risk-owner-actor@example.com"
OWNER_USER = "risk-owner-assignee@example.com"
REASSIGNED_USER = "risk-owner-reassigned@example.com"


class IntegrationTestRiskOwnerNotification(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_risk_masters()
        for email in (ACTOR_USER, OWNER_USER, REASSIGNED_USER):
            cls._make_user(email)
        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Risk Owner Notification Test Project",
                "custom_project_manager": OWNER_USER,
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _make_user(cls, email):
        if not frappe.db.exists("User", email):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "first_name": email.split("@")[0],
                    "user_type": "System User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)

    @classmethod
    def tearDownClass(cls):
        frappe.delete_doc("Project", cls.project.name, force=True, ignore_permissions=True)
        super().tearDownClass()

    def tearDown(self):
        for name in frappe.get_all(
            "NextPMS Notifications",
            filters={"user": ["in", [OWNER_USER, REASSIGNED_USER, ACTOR_USER]]},
            pluck="name",
        ):
            frappe.delete_doc("NextPMS Notifications", name, force=True, ignore_permissions=True)
        frappe.set_user("Administrator")
        super().tearDown()

    def _make_risk(self, owner=OWNER_USER, **kwargs):
        risk = frappe.get_doc(
            {
                "doctype": "Risk",
                "project": self.project.name,
                "status": "To-do",
                "risk_level": "Low",
                "risk_category": "Technical",
                "risk_owner": owner,
                "summary": "<p>Third-party API outage</p>",
                **kwargs,
            }
        )
        risk.insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Risk", risk.name, force=True, ignore_permissions=True)
        return risk

    def _owner_notifications(self, user):
        return frappe.get_all(
            "NextPMS Notifications",
            filters={"user": user, "title": "Risk assigned"},
            fields=["label", "linked_document", "url"],
        )

    def _flush(self):
        # Deferred inserts run under the flush caller; in production a scheduler job
        # does this as Administrator, so reset the session before flushing.
        frappe.set_user("Administrator")
        save_to_db()

    def _flush_capturing_mail(self):
        """Flush the deferred queue, capturing the emails the inserts send."""
        with patch(SENDMAIL) as sendmail:
            self._flush()
        return sendmail

    def test_assigning_owner_on_create_notifies_them(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()
        sendmail = self._flush_capturing_mail()

        notifications = self._owner_notifications(OWNER_USER)
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].linked_document, risk.name)
        self.assertEqual(
            notifications[0].url,
            f"/next-pms/projects/{self.project.name}?tab=risks&risk={risk.name}",
        )
        self.assertIn("Third-party API outage", notifications[0].label)
        self.assertIn(self.project.project_name, notifications[0].label)

        sendmail.assert_called_once()
        kwargs = sendmail.call_args.kwargs
        self.assertEqual(kwargs["recipients"], [OWNER_USER])
        self.assertEqual(kwargs["reference_name"], risk.name)
        self.assertIn("Technical", kwargs["message"])
        self.assertIn("Low", kwargs["message"])
        self.assertIn("To-do", kwargs["message"])

    def test_reassigning_owner_notifies_only_the_new_owner(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()
        self._flush()
        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)

        doc = frappe.get_doc("Risk", risk.name)
        doc.risk_owner = REASSIGNED_USER
        doc.save(ignore_permissions=True)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(len(self._owner_notifications(REASSIGNED_USER)), 1)
        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        sendmail.assert_called_once()

    def test_saving_without_owner_change_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()
        self._flush()

        doc = frappe.get_doc("Risk", risk.name)
        doc.summary = "<p>Updated summary</p>"
        doc.save(ignore_permissions=True)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        sendmail.assert_not_called()

    def test_self_assignment_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        self._make_risk(owner=ACTOR_USER)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(self._owner_notifications(ACTOR_USER), [])
        sendmail.assert_not_called()

    def test_email_and_notification_are_delivered_together(self):
        frappe.set_user(ACTOR_USER)
        with patch(SENDMAIL) as sendmail:
            risk = self._make_risk()
            # Saving only queues the pair; neither channel has fired yet.
            self.assertEqual(self._owner_notifications(OWNER_USER), [])
            sendmail.assert_not_called()

            self._flush()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        sendmail.assert_called_once()
        kwargs = sendmail.call_args.kwargs
        self.assertEqual(kwargs["recipients"], [OWNER_USER])
        self.assertEqual(kwargs["reference_doctype"], "Risk")
        self.assertEqual(kwargs["reference_name"], risk.name)

    def test_saving_a_risk_does_not_send_mail(self):
        # Patched globally, not just on the doctype: saving a Risk must not reach sendmail from
        # anywhere. A site with no outgoing email account would otherwise fail the save outright.
        frappe.set_user(ACTOR_USER)
        with patch("frappe.sendmail", side_effect=frappe.OutgoingEmailError("no outgoing account")):
            risk = self._make_risk()
        self.assertTrue(frappe.db.exists("Risk", risk.name))

    def test_mail_failure_does_not_lose_the_notification(self):
        frappe.set_user(ACTOR_USER)
        self._make_risk()
        with patch(SENDMAIL, side_effect=frappe.OutgoingEmailError("no outgoing account")):
            self._flush()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
