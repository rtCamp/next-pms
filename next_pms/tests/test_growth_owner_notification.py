# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

from unittest.mock import patch

import frappe
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_growth_masters

SENDMAIL = "next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications.frappe.sendmail"
DOCTYPE = "PMS Growth Initiative"

ACTOR_USER = "growth-owner-actor@example.com"
OWNER_USER = "growth-owner-assignee@example.com"
REASSIGNED_USER = "growth-owner-reassigned@example.com"


class IntegrationTestGrowthOwnerNotification(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
        for email in (ACTOR_USER, OWNER_USER, REASSIGNED_USER):
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
        cls.project = frappe.get_doc(
            {"doctype": "Project", "project_name": "Growth Owner Notification Test Project"}
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

    def _make_initiative(self, owner=OWNER_USER):
        doc = frappe.get_doc(
            {
                "doctype": DOCTYPE,
                "project": self.project.name,
                "activity": "Upsell managed hosting",
                "category": "Upsell",
                "status": "Ideation",
                "activity_owner": owner,
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, DOCTYPE, doc.name, force=True, ignore_permissions=True)
        return doc

    def _owner_notifications(self, user):
        return frappe.get_all(
            "NextPMS Notifications",
            filters={"user": user, "title": "Growth initiative assigned"},
            fields=["label", "linked_document", "url"],
        )

    def _flush_capturing_mail(self):
        frappe.set_user("Administrator")
        with patch(SENDMAIL) as sendmail:
            save_to_db()
        return sendmail

    def test_assigning_owner_on_create_notifies_them(self):
        frappe.set_user(ACTOR_USER)
        initiative = self._make_initiative()
        sendmail = self._flush_capturing_mail()

        notifications = self._owner_notifications(OWNER_USER)
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].linked_document, initiative.name)
        self.assertEqual(
            notifications[0].url,
            f"/next-pms/projects/{self.project.name}?tab=growth&growth={initiative.name}",
        )
        self.assertIn("Upsell managed hosting", notifications[0].label)
        self.assertIn(self.project.project_name, notifications[0].label)

        sendmail.assert_called_once()
        kwargs = sendmail.call_args.kwargs
        self.assertEqual(kwargs["recipients"], [OWNER_USER])
        self.assertEqual(kwargs["reference_name"], initiative.name)
        self.assertIn("Upsell", kwargs["message"])
        self.assertIn("Ideation", kwargs["message"])

    def test_reassigning_owner_notifies_only_the_new_owner(self):
        frappe.set_user(ACTOR_USER)
        initiative = self._make_initiative()
        self._flush_capturing_mail()

        frappe.set_user(ACTOR_USER)
        doc = frappe.get_doc(DOCTYPE, initiative.name)
        doc.activity_owner = REASSIGNED_USER
        doc.save(ignore_permissions=True)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(len(self._owner_notifications(REASSIGNED_USER)), 1)
        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        sendmail.assert_called_once()

    def test_saving_without_owner_change_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        initiative = self._make_initiative()
        self._flush_capturing_mail()

        frappe.set_user(ACTOR_USER)
        doc = frappe.get_doc(DOCTYPE, initiative.name)
        doc.activity = "Upsell managed hosting and CDN"
        doc.save(ignore_permissions=True)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(len(self._owner_notifications(OWNER_USER)), 1)
        sendmail.assert_not_called()

    def test_self_assignment_does_not_notify(self):
        frappe.set_user(ACTOR_USER)
        self._make_initiative(owner=ACTOR_USER)
        sendmail = self._flush_capturing_mail()

        self.assertEqual(self._owner_notifications(ACTOR_USER), [])
        sendmail.assert_not_called()
