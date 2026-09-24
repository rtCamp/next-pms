# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import today

from next_pms.install import create_default_growth_masters

IGNORE_TEST_RECORD_DEPENDENCIES = ["User", "Project"]

DOCTYPE = "PMS Growth Initiative"
STATUS_DOCTYPE = "PMS Growth Initiative Status"

OWNER_USER = "test.growth.owner@example.com"
OTHER_TM_USER = "test.growth.other.tm@example.com"
PROJECTS_USER = "test.growth.pu@example.com"
PROJECTS_MANAGER_USER = "test.growth.pm@example.com"
DELIVERY_MANAGER_USER = "test.growth.dm@example.com"
DELIVERY_USER_USER = "test.growth.du@example.com"

UNRESTRICTED_USERS = (PROJECTS_MANAGER_USER, DELIVERY_MANAGER_USER, DELIVERY_USER_USER)


class IntegrationTestPMSGrowthInitiative(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
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
                "project_name": "Growth Initiative Test Project",
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

    def _make_initiative(self, **kwargs):
        doc = frappe.get_doc(
            {
                "doctype": DOCTYPE,
                "project": self.project.name,
                "activity": "Expand to mobile app",
                "status": "Ideation",
                "activity_owner": OWNER_USER,
                **kwargs,
            }
        )
        doc.insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, DOCTYPE, doc.name, force=True, ignore_permissions=True)
        return doc

    def _make_status(self, name, **kwargs):
        if not frappe.db.exists(STATUS_DOCTYPE, name):
            frappe.get_doc({"doctype": STATUS_DOCTYPE, "name": name, **kwargs}).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, STATUS_DOCTYPE, name, force=True, ignore_permissions=True)
        return frappe.get_doc(STATUS_DOCTYPE, name)

    def test_ideation_date_defaults_to_today(self):
        initiative = self._make_initiative()
        self.assertEqual(str(initiative.ideation_date), today())

    def test_open_status_is_not_closed(self):
        initiative = self._make_initiative()
        self.assertEqual(initiative.is_closed, 0)

    def test_closed_status_is_required_when_closed(self):
        with self.assertRaises(frappe.ValidationError):
            self._make_initiative(status="Closed")

    def test_closing_records_closed_status(self):
        initiative = self._make_initiative()
        initiative.status = "Closed"
        initiative.closed_status = "Won"
        initiative.save(ignore_permissions=True)
        initiative.reload()
        self.assertEqual(initiative.is_closed, 1)
        self.assertEqual(initiative.closed_status, "Won")

    def test_reopening_clears_closed_status(self):
        initiative = self._make_initiative(status="Closed", closed_status="Lost")
        initiative.status = "In Progress"
        initiative.save(ignore_permissions=True)
        initiative.reload()
        self.assertEqual(initiative.is_closed, 0)
        self.assertIsNone(initiative.closed_status)

    def test_status_must_be_of_status_type(self):
        with self.assertRaises(frappe.ValidationError):
            self._make_initiative(status="Won")

    def test_closed_status_must_be_of_closed_status_type(self):
        with self.assertRaises(frappe.ValidationError):
            self._make_initiative(status="Closed", closed_status="Ideation")

    def test_custom_closed_status_is_honoured(self):
        self._make_status("Test Archived", status_type="Status", is_closed=1)
        with self.assertRaises(frappe.ValidationError):
            self._make_initiative(status="Test Archived")
        initiative = self._make_initiative(status="Test Archived", closed_status="Not Pursued")
        self.assertEqual(initiative.is_closed, 1)

    def test_closed_status_type_cannot_be_flagged_closed(self):
        status = self._make_status("Test Outcome", status_type="Closed Status", is_closed=1)
        self.assertEqual(status.is_closed, 0)

    def test_toggling_is_closed_on_status_propagates(self):
        self._make_status("Test Paused", status_type="Status")
        initiative = self._make_initiative(status="Test Paused")
        self.assertEqual(initiative.is_closed, 0)

        status = frappe.get_doc(STATUS_DOCTYPE, "Test Paused")
        status.is_closed = 1
        status.save(ignore_permissions=True)
        self.assertEqual(frappe.db.get_value(DOCTYPE, initiative.name, "is_closed"), 1)

    def test_gated_roles_can_read_any_initiative(self):
        initiative = self._make_initiative()
        for user in (OWNER_USER, OTHER_TM_USER, PROJECTS_USER):
            with self.subTest(user=user):
                self.assertTrue(frappe.has_permission(DOCTYPE, "read", doc=initiative, user=user))

    def test_activity_owner_can_write(self):
        initiative = self._make_initiative()
        self.assertTrue(frappe.has_permission(DOCTYPE, "write", doc=initiative, user=OWNER_USER))

        frappe.set_user(OWNER_USER)
        doc = frappe.get_doc(DOCTYPE, initiative.name)
        doc.activity = "Updated by owner"
        doc.save()
        doc.reload()
        self.assertEqual(doc.activity, "Updated by owner")

    def test_non_owner_gated_role_cannot_write(self):
        initiative = self._make_initiative()
        for user in (OTHER_TM_USER, PROJECTS_USER):
            with self.subTest(user=user):
                self.assertFalse(frappe.has_permission(DOCTYPE, "write", doc=initiative, user=user))
                frappe.set_user(user)
                doc = frappe.get_doc(DOCTYPE, initiative.name)
                doc.activity = "Hacked"
                with self.assertRaises(frappe.PermissionError):
                    doc.save()
                frappe.set_user("Administrator")

    def test_gated_roles_cannot_delete(self):
        initiative = self._make_initiative()
        for user in (OWNER_USER, PROJECTS_USER):
            with self.subTest(user=user):
                self.assertFalse(frappe.has_permission(DOCTYPE, "delete", doc=initiative, user=user))

    def test_unrestricted_roles_can_write_and_delete(self):
        initiative = self._make_initiative()
        for user in UNRESTRICTED_USERS:
            with self.subTest(user=user):
                self.assertTrue(frappe.has_permission(DOCTYPE, "write", doc=initiative, user=user))
                self.assertTrue(frappe.has_permission(DOCTYPE, "delete", doc=initiative, user=user))
                frappe.set_user(user)
                doc = frappe.get_doc(DOCTYPE, initiative.name)
                doc.activity = f"Updated by {user}"
                doc.save()
                doc.reload()
                self.assertEqual(doc.activity, f"Updated by {user}")
                frappe.set_user("Administrator")

    def test_gated_activity_owner_cannot_reassign(self):
        initiative = self._make_initiative()
        frappe.set_user(OWNER_USER)
        doc = frappe.get_doc(DOCTYPE, initiative.name)
        doc.activity_owner = OTHER_TM_USER
        with self.assertRaises(frappe.PermissionError):
            doc.save()
        initiative.reload()
        self.assertEqual(initiative.activity_owner, OWNER_USER)
