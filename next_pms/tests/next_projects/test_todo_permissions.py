# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_todo_permissions
from next_pms.tests.utils import make_employee

ASSIGNEE_USER = "test.todo.assignee@example.com"
ASSIGNER_USER = "test.todo.assigner@example.com"
OTHER_USER = "test.todo.other@example.com"
SYSTEM_MANAGER_USER = "test.todo.sm@example.com"


class TestToDoPermissions(IntegrationTestCase):
    """Verify setup_todo_permissions grants System Manager delete on any ToDo.

    The ToDo controller hook ignores automatic roles (All, Desk User). Without a
    named delete role, only allocated_to / assigned_by can delete. This setup
    adds delete on System Manager so they pass that hook.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_todo_permissions()
        make_employee(ASSIGNEE_USER)
        make_employee(ASSIGNER_USER)
        make_employee(OTHER_USER)
        cls._make_user(SYSTEM_MANAGER_USER, ["System Manager"])
        frappe.clear_cache()

        cls.todo = frappe.get_doc(
            {
                "doctype": "ToDo",
                "description": "ToDo permission test",
                "allocated_to": ASSIGNEE_USER,
                "assigned_by": ASSIGNER_USER,
            }
        ).insert(ignore_permissions=True)

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

    def test_system_manager_custom_docperm_has_delete(self):
        self.assertTrue(
            frappe.db.get_value(
                "Custom DocPerm",
                {"parent": "ToDo", "role": "System Manager", "permlevel": 0},
                "delete",
            ),
            "System Manager Custom DocPerm on ToDo should have delete",
        )

    def test_system_manager_can_delete_foreign_todo(self):
        self.assertTrue(
            frappe.has_permission("ToDo", "delete", doc=self.todo, user=SYSTEM_MANAGER_USER),
            "System Manager should be able to delete a ToDo assigned to someone else",
        )

    def test_other_user_cannot_delete_foreign_todo(self):
        self.assertFalse(
            frappe.has_permission("ToDo", "delete", doc=self.todo, user=OTHER_USER),
            "A user who is not assignee, assigner, or System Manager should not delete",
        )

    def test_assignee_can_delete(self):
        self.assertTrue(
            frappe.has_permission("ToDo", "delete", doc=self.todo, user=ASSIGNEE_USER),
            "allocated_to should be able to delete the ToDo",
        )

    def test_assigner_can_delete(self):
        self.assertTrue(
            frappe.has_permission("ToDo", "delete", doc=self.todo, user=ASSIGNER_USER),
            "assigned_by should be able to delete the ToDo",
        )

    def test_system_manager_can_delete_doc(self):
        todo = frappe.get_doc(
            {
                "doctype": "ToDo",
                "description": "ToDo SM delete test",
                "allocated_to": ASSIGNEE_USER,
                "assigned_by": ASSIGNER_USER,
            }
        ).insert(ignore_permissions=True)

        frappe.set_user(SYSTEM_MANAGER_USER)
        todo.delete()
        self.assertFalse(frappe.db.exists("ToDo", todo.name))

    def test_setup_is_idempotent(self):
        setup_todo_permissions()
        setup_todo_permissions()
        rules = frappe.get_all(
            "Custom DocPerm",
            filters={"parent": "ToDo", "role": "System Manager", "permlevel": 0},
        )
        self.assertEqual(len(rules), 1)
        self.assertTrue(frappe.db.get_value("Custom DocPerm", rules[0].name, "delete"))
