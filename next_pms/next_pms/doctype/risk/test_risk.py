# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, get_datetime

from next_pms.install import create_default_risk_masters

IGNORE_TEST_RECORD_DEPENDENCIES = ["User", "Project"]

OWNER_USER = "test.risk.gated.owner@example.com"
OTHER_GATED_USER = "test.risk.other.gated@example.com"
PROJECTS_USER = "test.risk.pu@example.com"
PROJECTS_MANAGER_USER = "test.risk.pm@example.com"
LEADERSHIP_USER = "test.risk.pl@example.com"
SYSTEM_MANAGER_USER = "test.risk.sm@example.com"
EMPLOYEE_USER = "test.risk.employee@example.com"

UNRESTRICTED_USERS = (PROJECTS_MANAGER_USER, LEADERSHIP_USER, SYSTEM_MANAGER_USER)


class IntegrationTestRisk(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_risk_masters()
        cls._make_user(OWNER_USER, ["Projects User"])
        cls._make_user(OTHER_GATED_USER, ["Projects User"])
        cls._make_user(PROJECTS_USER, ["Projects User"])
        cls._make_user(PROJECTS_MANAGER_USER, ["Projects Manager"])
        cls._make_user(LEADERSHIP_USER, ["PMS Leadership"])
        cls._make_user(SYSTEM_MANAGER_USER, ["System Manager"])
        frappe.clear_cache()

        cls.project = frappe.get_doc({"doctype": "Project", "project_name": "Risk Permission Test Project"}).insert(
            ignore_permissions=True
        )
        cls.project.db_set("custom_project_manager", OWNER_USER)

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

    def test_mitigated_on_is_empty_for_open_risk(self):
        risk = self._make_risk()
        self.assertIsNone(risk.mitigated_on)

    def test_risk_created_as_mitigated_uses_creation(self):
        risk = self._make_risk(status="Mitigated")
        self.assertEqual(str(risk.mitigated_on), str(risk.creation))

    def test_mitigated_on_set_from_mitigating_update(self):
        risk = self._make_risk()
        mitigated_at = add_to_date(risk.creation, hours=1)
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": mitigated_at})
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(get_datetime(risk.mitigated_on), get_datetime(mitigated_at))

    def test_mitigated_on_kept_on_later_mitigated_updates(self):
        risk = self._make_risk()
        mitigated_at = add_to_date(risk.creation, hours=1)
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": mitigated_at})
        risk.save(ignore_permissions=True)
        risk.append(
            "risk_update_log",
            {"status": "Mitigated", "note": "Still fine", "updated_at": add_to_date(risk.creation, hours=2)},
        )
        risk.append("risk_update_log", {"note": "No status change", "updated_at": add_to_date(risk.creation, hours=3)})
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(get_datetime(risk.mitigated_on), get_datetime(mitigated_at))

    def test_mitigated_on_ignores_log_row_order(self):
        risk = self._make_risk()
        mitigated_at = add_to_date(risk.creation, hours=1)
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": mitigated_at})
        risk.save(ignore_permissions=True)

        newest_first = [row.as_dict() for row in reversed(risk.risk_update_log)]
        risk.set(
            "risk_update_log",
            [
                *newest_first,
                {"status": "Mitigated", "note": "Still fine", "updated_at": add_to_date(risk.creation, hours=2)},
            ],
        )
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(get_datetime(risk.mitigated_on), get_datetime(mitigated_at))

    def test_mitigated_on_cleared_when_reopened(self):
        risk = self._make_risk()
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": add_to_date(risk.creation, hours=1)})
        risk.save(ignore_permissions=True)
        risk.append("risk_update_log", {"status": "In Progress", "updated_at": add_to_date(risk.creation, hours=2)})
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertIsNone(risk.mitigated_on)

    def test_mitigated_on_resets_when_mitigated_again(self):
        risk = self._make_risk()
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": add_to_date(risk.creation, hours=1)})
        risk.append("risk_update_log", {"status": "Escalated", "updated_at": add_to_date(risk.creation, hours=2)})
        remitigated_at = add_to_date(risk.creation, hours=3)
        risk.append("risk_update_log", {"status": "Mitigated", "updated_at": remitigated_at})
        risk.save(ignore_permissions=True)
        risk.reload()
        self.assertEqual(get_datetime(risk.mitigated_on), get_datetime(remitigated_at))

    def test_projects_user_can_create_a_risk(self):
        frappe.set_user(PROJECTS_USER)
        risk = frappe.get_doc(
            {
                "doctype": "Risk",
                "project": self.project.name,
                "status": "To-do",
                "risk_level": "Low",
                "risk_owner": PROJECTS_USER,
            }
        ).insert()
        self.addCleanup(frappe.delete_doc, "Risk", risk.name, force=True, ignore_permissions=True)
        self.assertEqual(risk.owner, PROJECTS_USER)

    def test_employee_cannot_create_a_risk(self):
        self._make_user(EMPLOYEE_USER, ["Employee"])
        self.assertFalse(frappe.has_permission("Risk", "create", user=EMPLOYEE_USER))

    def test_gated_roles_can_read_any_risk(self):
        risk = self._make_risk()
        for user in (OWNER_USER, OTHER_GATED_USER, PROJECTS_USER):
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

    def test_projects_user_can_update_a_risk_they_do_not_own(self):
        risk = self._make_risk()
        frappe.set_user(PROJECTS_USER)
        doc = frappe.get_doc("Risk", risk.name)
        doc.append("risk_update_log", {"status": "In Progress", "note": "Picked up"})
        doc.save()
        doc.reload()
        self.assertEqual(doc.status, "In Progress")
        self.assertEqual(doc.risk_update_log[-1].updated_by, PROJECTS_USER)

    def test_projects_user_edits_and_deletes_only_their_own_update_rows(self):
        risk = self._make_risk()
        frappe.set_user(PROJECTS_USER)
        doc = frappe.get_doc("Risk", risk.name)
        doc.append("risk_update_log", {"status": "In Progress", "note": "Mine"})
        doc.save()

        doc.risk_update_log[-1].note = "Mine, edited"
        doc.save()
        doc.risk_update_log.pop()
        doc.save()

        doc.risk_update_log[0].note = "Rewriting the seeded row"
        with self.assertRaises(frappe.PermissionError):
            doc.save()
        doc = frappe.get_doc("Risk", risk.name)
        doc.risk_update_log.pop(0)
        with self.assertRaises(frappe.PermissionError):
            doc.save()

    def test_projects_user_cannot_delete_a_risk(self):
        risk = self._make_risk()
        self.assertFalse(frappe.has_permission("Risk", "delete", doc=risk, user=PROJECTS_USER))

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
