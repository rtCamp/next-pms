# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.next_pms.patches.backfill_notification_title import NOTIFICATION_TITLES
from next_pms.next_pms.patches.backfill_notification_title import execute as backfill_notification_title

# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
# "user" links to User, whose own dependency chain (Email Account -> Company)
# pulls in erpnext's global test bootstrap. All users this suite needs are
# created explicitly in _make_user(), so skip the auto-generated "User" fixture.
IGNORE_TEST_RECORD_DEPENDENCIES = ["User"]

SYSTEM_MANAGER_USER = "test.sm.notifications@example.com"
PROJECTS_MANAGER_USER = "test.pm.notifications@example.com"
PROJECTS_USER_USER = "test.pu.notifications@example.com"
DELIVERY_MANAGER_USER = "test.dm.notifications@example.com"
DELIVERY_USER_USER = "test.du.notifications@example.com"

# Every role other than System Manager: read/write at permlevel 0, no create/delete,
# read-only at permlevel 1 (per nextpms_notifications.json "permissions").
RESTRICTED_ROLE_USERS = [
    PROJECTS_MANAGER_USER,
    PROJECTS_USER_USER,
    DELIVERY_MANAGER_USER,
    DELIVERY_USER_USER,
]


class IntegrationTestNextPMSNotifications(IntegrationTestCase):
    """
    Integration tests for NextPMSNotifications.
    Use this class for testing interactions between multiple components.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._make_user(SYSTEM_MANAGER_USER, ["System Manager"])
        cls._make_user(PROJECTS_MANAGER_USER, ["Projects Manager"])
        cls._make_user(PROJECTS_USER_USER, ["Projects User"])
        cls._make_user(DELIVERY_MANAGER_USER, ["Delivery Manager"])
        cls._make_user(DELIVERY_USER_USER, ["Delivery User"])
        frappe.clear_cache()

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

    def _make_notification(self, user):
        """Create a notification for user, the way create_notification() does in production
        (inserted by the system, bypassing the create permission that end users don't have)."""
        frappe.set_user("Administrator")
        doc = frappe.get_doc(
            {
                "doctype": "NextPMS Notifications",
                "user": user,
                "title": "Original title",
                "label": "Original label",
                "linked_doctype": "User",
                "linked_document": user,
            }
        )
        doc.insert(ignore_permissions=True)
        self.addCleanup(
            frappe.delete_doc,
            "NextPMS Notifications",
            doc.name,
            ignore_permissions=True,
            force=True,
        )
        return doc

    # Create / delete — System Manager only
    def test_create_denied_for_non_system_manager_roles(self):
        for user in RESTRICTED_ROLE_USERS:
            frappe.set_user(user)
            with self.subTest(user=user):
                with self.assertRaises(frappe.PermissionError):
                    frappe.get_doc(
                        {
                            "doctype": "NextPMS Notifications",
                            "user": user,
                            "title": "Should not be creatable",
                            "label": "Should not be creatable",
                            "linked_doctype": "User",
                            "linked_document": user,
                        }
                    ).insert()

    def test_create_allowed_for_system_manager(self):
        frappe.set_user(SYSTEM_MANAGER_USER)
        doc = frappe.get_doc(
            {
                "doctype": "NextPMS Notifications",
                "user": SYSTEM_MANAGER_USER,
                "title": "Created by System Manager",
                "label": "Created by System Manager",
                "linked_doctype": "User",
                "linked_document": SYSTEM_MANAGER_USER,
            }
        )
        doc.insert()
        self.addCleanup(
            frappe.delete_doc,
            "NextPMS Notifications",
            doc.name,
            ignore_permissions=True,
            force=True,
        )
        self.assertTrue(frappe.db.exists("NextPMS Notifications", doc.name))

    def test_delete_denied_for_non_system_manager_roles(self):
        for user in RESTRICTED_ROLE_USERS:
            doc = self._make_notification(user)
            frappe.set_user(user)
            with self.subTest(user=user):
                with self.assertRaises(frappe.PermissionError):
                    frappe.delete_doc("NextPMS Notifications", doc.name)

    def test_delete_allowed_for_system_manager(self):
        doc = self._make_notification(SYSTEM_MANAGER_USER)
        frappe.set_user(SYSTEM_MANAGER_USER)
        frappe.delete_doc("NextPMS Notifications", doc.name)
        self.assertFalse(frappe.db.exists("NextPMS Notifications", doc.name))

    # Row-level isolation — after_insert() scopes each notification to its
    # own recipient via a User Permission, regardless of doctype-level read access.
    def test_user_cannot_list_another_users_notification(self):
        own_doc = self._make_notification(PROJECTS_MANAGER_USER)
        other_doc = self._make_notification(DELIVERY_MANAGER_USER)

        frappe.set_user(PROJECTS_MANAGER_USER)
        names = frappe.get_list("NextPMS Notifications", pluck="name")

        self.assertIn(own_doc.name, names)
        self.assertNotIn(other_doc.name, names)

    # Permlevel 1 fields (label, user, linked_doctype, linked_document) are
    # read-only for every role except System Manager; only "viewed" (permlevel 0)
    # is writable by the other four roles.
    def test_restricted_roles_cannot_write_permlevel1_fields(self):
        for user in RESTRICTED_ROLE_USERS:
            doc = self._make_notification(user)
            frappe.set_user(user)
            with self.subTest(user=user):
                as_user = frappe.get_doc("NextPMS Notifications", doc.name)
                as_user.title = "Edited by restricted role"
                as_user.label = "Edited by restricted role"
                as_user.viewed = 1
                as_user.save()

                reloaded = frappe.get_doc("NextPMS Notifications", doc.name)
                self.assertEqual(
                    reloaded.title,
                    "Original title",
                    f"{user} should not be able to write the permlevel-1 'title' field",
                )
                self.assertEqual(
                    reloaded.label,
                    "Original label",
                    f"{user} should not be able to write the permlevel-1 'label' field",
                )
                self.assertEqual(
                    reloaded.viewed,
                    1,
                    f"{user} should be able to write the permlevel-0 'viewed' field",
                )

    def test_system_manager_can_write_permlevel1_fields(self):
        doc = self._make_notification(SYSTEM_MANAGER_USER)
        frappe.set_user(SYSTEM_MANAGER_USER)

        as_user = frappe.get_doc("NextPMS Notifications", doc.name)
        as_user.title = "Edited by System Manager"
        as_user.label = "Edited by System Manager"
        as_user.save()

        reloaded = frappe.get_doc("NextPMS Notifications", doc.name)
        self.assertEqual(reloaded.title, "Edited by System Manager")
        self.assertEqual(reloaded.label, "Edited by System Manager")

    # Title is mandatory — every notification created from now on carries one.
    def test_title_is_mandatory(self):
        frappe.set_user("Administrator")
        with self.assertRaises(frappe.MandatoryError):
            frappe.get_doc(
                {
                    "doctype": "NextPMS Notifications",
                    "user": SYSTEM_MANAGER_USER,
                    "label": "Missing title",
                    "linked_doctype": "User",
                    "linked_document": SYSTEM_MANAGER_USER,
                }
            ).insert(ignore_permissions=True)

    # Backfill patch — existing rows with no title get one derived from the linked doctype.
    def test_backfill_sets_title_from_linked_doctype(self):
        frappe.set_user("Administrator")
        for linked_doctype, expected_title in NOTIFICATION_TITLES.items():
            with self.subTest(linked_doctype=linked_doctype):
                doc = frappe.get_doc(
                    {
                        "doctype": "NextPMS Notifications",
                        "user": SYSTEM_MANAGER_USER,
                        "title": "placeholder",
                        "label": "Legacy notification",
                        "linked_doctype": linked_doctype,
                        "linked_document": SYSTEM_MANAGER_USER,
                    }
                )
                doc.flags.ignore_links = True
                doc.insert(ignore_permissions=True)
                self.addCleanup(
                    frappe.delete_doc,
                    "NextPMS Notifications",
                    doc.name,
                    ignore_permissions=True,
                    force=True,
                )
                # Simulate a row created before the title field existed.
                frappe.db.set_value("NextPMS Notifications", doc.name, "title", "", update_modified=False)

                backfill_notification_title()

                self.assertEqual(
                    frappe.db.get_value("NextPMS Notifications", doc.name, "title"),
                    expected_title,
                )

    # Backfill must not clobber a title that is already set.
    def test_backfill_preserves_existing_title(self):
        frappe.set_user("Administrator")
        doc = frappe.get_doc(
            {
                "doctype": "NextPMS Notifications",
                "user": SYSTEM_MANAGER_USER,
                "title": "Already set",
                "label": "Notification with title",
                "linked_doctype": "Risk",
                "linked_document": SYSTEM_MANAGER_USER,
            }
        )
        doc.flags.ignore_links = True
        doc.insert(ignore_permissions=True)
        self.addCleanup(
            frappe.delete_doc,
            "NextPMS Notifications",
            doc.name,
            ignore_permissions=True,
            force=True,
        )

        backfill_notification_title()

        self.assertEqual(
            frappe.db.get_value("NextPMS Notifications", doc.name, "title"),
            "Already set",
        )
