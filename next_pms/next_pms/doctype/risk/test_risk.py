# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_risk_masters

IGNORE_TEST_RECORD_DEPENDENCIES = ["User", "Project"]

OWNER_USER = "test.risk.owner@example.com"
OTHER_TM_USER = "test.risk.other.tm@example.com"
PROJECTS_USER = "test.risk.pu@example.com"
PROJECTS_MANAGER_USER = "test.risk.pm@example.com"
DELIVERY_MANAGER_USER = "test.risk.dm@example.com"
DELIVERY_USER_USER = "test.risk.du@example.com"

UNRESTRICTED_USERS = (PROJECTS_MANAGER_USER, DELIVERY_MANAGER_USER, DELIVERY_USER_USER)


class IntegrationTestRisk(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_risk_masters()
        cls._make_user(OWNER_USER, ["Timesheet Manager"])
        cls._make_user(OTHER_TM_USER, ["Timesheet Manager"])
        cls._make_user(PROJECTS_USER, ["Projects User"])
        cls._make_user(PROJECTS_MANAGER_USER, ["Projects Manager"])
        cls._make_user(DELIVERY_MANAGER_USER, ["Delivery Manager"])
        cls._make_user(DELIVERY_USER_USER, ["Delivery User"])
        frappe.clear_cache()

        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Risk Permission Test Project",
                "custom_project_manager": OWNER_USER,
            }
        ).insert(ignore_permissions=True)

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

    def _make_risk(self, **kwargs):
        doc = frappe.get_doc(
            {
                "doctype": "Risk",
                "project": self.project.name,
                "status": "To-do",
                "risk_level": "Low",
                "risk_owner": OWNER_USER,
                **kwargs,
            }
        )
        doc.insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Risk", doc.name, force=True, ignore_permissions=True)
        return doc

    def test_insert_seeds_initial_update_log(self):
        risk = self._make_risk()
        self.assertEqual(len(risk.risk_update_log), 1)
        self.assertEqual(risk.risk_update_log[0].status, "To-do")
        self.assertEqual(risk.risk_update_log[0].risk_level, "Low")
        self.assertEqual(risk.risk_update_log[0].updated_by, frappe.session.user)
        self.assertEqual(str(risk.risk_update_log[0].updated_at), str(risk.creation))

    def test_parent_status_reverts_when_it_does_not_match_log(self):
        risk = self._make_risk()
        risk.status = "Mitigated"
        risk.risk_level = "High"
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(risk.status, "To-do")
        self.assertEqual(risk.risk_level, "Low")
        self.assertEqual(len(risk.risk_update_log), 1)

    def test_parent_fields_follow_new_log_row(self):
        risk = self._make_risk()
        risk.append("risk_update_log", {"status": "Mitigated", "risk_level": "High"})
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(risk.status, "Mitigated")
        self.assertEqual(risk.risk_level, "High")
        self.assertEqual(len(risk.risk_update_log), 2)

    def test_gated_roles_can_read_any_risk(self):
        risk = self._make_risk()
        for user in (OWNER_USER, OTHER_TM_USER, PROJECTS_USER):
            with self.subTest(user=user):
                self.assertTrue(frappe.has_permission("Risk", "read", doc=risk, user=user))

    def test_risk_owner_can_write_level_zero_fields(self):
        risk = self._make_risk()
        self.assertTrue(frappe.has_permission("Risk", "write", doc=risk, user=OWNER_USER))

        frappe.set_user(OWNER_USER)
        doc = frappe.get_doc("Risk", risk.name)
        doc.summary = "Updated by owner"
        doc.save()
        doc.reload()
        self.assertEqual(doc.summary, "Updated by owner")

    def test_non_owner_gated_role_cannot_write(self):
        risk = self._make_risk()
        for user in (OTHER_TM_USER, PROJECTS_USER):
            with self.subTest(user=user):
                self.assertFalse(frappe.has_permission("Risk", "write", doc=risk, user=user))
                frappe.set_user(user)
                doc = frappe.get_doc("Risk", risk.name)
                doc.summary = "Hacked"
                with self.assertRaises(frappe.PermissionError):
                    doc.save()
                frappe.set_user("Administrator")

    def test_unrestricted_roles_can_write_any_risk(self):
        risk = self._make_risk()
        for user in UNRESTRICTED_USERS:
            with self.subTest(user=user):
                self.assertTrue(frappe.has_permission("Risk", "write", doc=risk, user=user))
                frappe.set_user(user)
                doc = frappe.get_doc("Risk", risk.name)
                doc.summary = f"Updated by {user}"
                doc.save()
                doc.reload()
                self.assertEqual(doc.summary, f"Updated by {user}")
                frappe.set_user("Administrator")

    def test_gated_risk_owner_cannot_reassign(self):
        risk = self._make_risk()
        frappe.set_user(OWNER_USER)
        doc = frappe.get_doc("Risk", risk.name)
        doc.risk_owner = OTHER_TM_USER
        self.assertFalse(frappe.has_permission("Risk", "write", doc=doc, user=OWNER_USER))
        with self.assertRaises(frappe.PermissionError):
            doc.save()
        risk.reload()
        self.assertEqual(risk.risk_owner, OWNER_USER)
