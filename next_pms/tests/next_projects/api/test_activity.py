# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_growth_masters
from next_pms.next_projects.api.activity import get_activity

DOCTYPE = "PMS Growth Initiative"
EDITOR_USER = "test.activity.editor@example.com"
OUTSIDER_USER = "test.activity.outsider@example.com"


class IntegrationTestActivity(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
        cls._make_user(EDITOR_USER, ["Projects Manager"])
        cls._make_user(OUTSIDER_USER, [])
        frappe.clear_cache()
        cls.project = frappe.get_doc({"doctype": "Project", "project_name": "Activity Test Project"}).insert(
            ignore_permissions=True
        )

    @classmethod
    def tearDownClass(cls):
        frappe.delete_doc("Project", cls.project.name, force=True, ignore_permissions=True)
        super().tearDownClass()

    @classmethod
    def _make_user(cls, email, roles):
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
        user = frappe.get_doc("User", email)
        for role in roles:
            user.add_roles(role)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _make_initiative(self):
        doc = frappe.get_doc(
            {
                "doctype": DOCTYPE,
                "project": self.project.name,
                "activity": "Expand to mobile app",
                "status": "Ideation",
                "activity_owner": EDITOR_USER,
                "billable_outcome": 0,
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, DOCTYPE, doc.name, force=True, ignore_permissions=True)
        return doc

    def test_new_document_lists_only_creation(self):
        initiative = self._make_initiative()
        result = get_activity(DOCTYPE, initiative.name)
        self.assertEqual([item["type"] for item in result["items"]], ["created"])
        self.assertEqual(result["items"][0]["user"], "Administrator")
        self.assertIn("Administrator", result["users"])

    def test_field_change_is_reported_with_label_and_values(self):
        initiative = self._make_initiative()
        frappe.set_user(EDITOR_USER)
        initiative.append("update_log", {"client_priority": "High", "billable_outcome": 123})
        initiative.save(ignore_version=False)

        result = get_activity(DOCTYPE, initiative.name)
        self.assertEqual([item["type"] for item in result["items"]], ["changed", "edited", "created"])

        changed = result["items"][0]
        self.assertEqual(changed["user"], EDITOR_USER)
        self.assertEqual(
            changed["changes"],
            [
                {"label": "Priority for Client", "old": "", "new": "High"},
                {"label": "Billable Outcome", "old": "0", "new": "₹ 123.00"},
            ],
        )
        self.assertEqual(changed["table_changes"], [{"label": "Update Log", "added": 1, "removed": 0, "changed": 0}])
        self.assertIsNone(changed["impersonated_by"])
        self.assertEqual(result["items"][1]["user"], EDITOR_USER)
        self.assertIn(EDITOR_USER, result["users"])

    def test_hidden_fields_are_not_reported(self):
        initiative = self._make_initiative()
        initiative.append("update_log", {"status": "Closed", "closed_status": "Won"})
        initiative.save(ignore_permissions=True, ignore_version=False)

        labels = {
            change["label"]
            for item in get_activity(DOCTYPE, initiative.name)["items"]
            if item["type"] == "changed"
            for change in item["changes"]
        }
        self.assertIn("Status", labels)
        self.assertIn("Closed Status", labels)
        self.assertNotIn("Is Closed", labels)

    def test_user_without_read_permission_is_rejected(self):
        initiative = self._make_initiative()
        frappe.set_user(OUTSIDER_USER)
        with self.assertRaises(frappe.PermissionError):
            get_activity(DOCTYPE, initiative.name)
