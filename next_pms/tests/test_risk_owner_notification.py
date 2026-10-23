# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

from unittest.mock import patch

import frappe
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

    def setUp(self):
        sendmail = patch(SENDMAIL)
        self.sendmail = sendmail.start()
        self.addCleanup(sendmail.stop)

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
            fields=["label", "linked_document", "url", "email_subject"],
        )

    def test_assigning_owner_on_create_notifies_them(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()

        notifications = self._owner_notifications(OWNER_USER)
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].linked_document, risk.name)
        self.assertEqual(
            notifications[0].url,
            f"/next-pms/projects/{self.project.name}?tab=risks&risk={risk.name}",
        )
        self.assertIn("Third-party API outage", notifications[0].label)
        self.assertIn(self.project.project_name, notifications[0].label)

        self.sendmail.assert_called_once()
        kwargs = self.sendmail.call_args.kwargs
        self.assertEqual(kwargs["recipients"], [OWNER_USER])
        self.assertEqual(kwargs["reference_name"], risk.name)
        self.assertIn("Technical", kwargs["message"])
        self.assertIn("Low", kwargs["message"])
        self.assertIn("To-do", kwargs["message"])

    def test_reassigning_owner_notifies_only_the_new_owner(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()
        self.sendmail.reset_mock()
        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)

        doc = frappe.get_doc("Risk", risk.name)
        doc.risk_owner = REASSIGNED_USER
        doc.save(ignore_permissions=True)

        self.assertEqual(len(self._owner_notifications(REASSIGNED_USER)), 1)
        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        self.sendmail.assert_called_once()

    def test_saving_without_owner_change_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()
        self.sendmail.reset_mock()

        doc = frappe.get_doc("Risk", risk.name)
        doc.summary = "<p>Updated summary</p>"
        doc.save(ignore_permissions=True)

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        self.sendmail.assert_not_called()

    def test_self_assignment_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        self._make_risk(owner=ACTOR_USER)

        self.assertEqual(self._owner_notifications(ACTOR_USER), [])
        self.sendmail.assert_not_called()

    def test_email_and_notification_are_delivered_together(self):
        frappe.set_user(ACTOR_USER)
        risk = self._make_risk()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        self.sendmail.assert_called_once()
        kwargs = self.sendmail.call_args.kwargs
        self.assertEqual(kwargs["recipients"], [OWNER_USER])
        self.assertEqual(kwargs["reference_doctype"], "Risk")
        self.assertEqual(kwargs["reference_name"], risk.name)
        self.assertTrue(kwargs["now"])

    def test_risk_saves_without_an_outgoing_email_account(self):
        # Patched globally, not just on the doctype: a site with no outgoing email account must
        # still be able to save a Risk.
        frappe.set_user(ACTOR_USER)
        with patch("frappe.sendmail", side_effect=frappe.OutgoingEmailError("no outgoing account")):
            risk = self._make_risk()
        self.assertTrue(frappe.db.exists("Risk", risk.name))

    def test_mail_failure_does_not_lose_the_notification(self):
        frappe.set_user(ACTOR_USER)
        with patch(SENDMAIL, side_effect=frappe.OutgoingEmailError("no outgoing account")):
            self._make_risk()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)

    def test_oversized_label_still_delivers_both_channels(self):
        # A maximum-length project name plus the summary overflows the Data column the label lives
        # in; an unhandled length error would fail the job and drop both channels.
        project_name = "L" * frappe.db.VARCHAR_LEN
        project = frappe.get_doc(
            {"doctype": "Project", "project_name": project_name, "custom_project_manager": OWNER_USER}
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Project", project.name, force=True, ignore_permissions=True)

        frappe.set_user(ACTOR_USER)
        self._make_risk(project=project.name, summary=f"<p>{'S' * 200}</p>")

        notifications = self._owner_notifications(OWNER_USER)
        self.assertEqual(len(notifications), 1)
        self.assertLessEqual(len(notifications[0].label), frappe.db.VARCHAR_LEN)
        # The subject is not a Data field, so the full project name survives.
        self.assertIn(project_name, notifications[0].email_subject)

        self.sendmail.assert_called_once()
        self.assertEqual(self.sendmail.call_args.kwargs["recipients"], [OWNER_USER])
