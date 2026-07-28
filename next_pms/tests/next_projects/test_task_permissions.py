# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_task_permissions
from next_pms.tests.utils import make_employee

TASK_OWNER_USER = "test.task.owner@example.com"
OTHER_EMPLOYEE_USER = "test.task.other@example.com"
DELIVERY_MANAGER_USER = "test.task.dm@example.com"
DELIVERY_USER_USER = "test.task.du@example.com"
PROJECTS_MANAGER_USER = "test.task.pm@example.com"


class TestTaskPermissions(IntegrationTestCase):
    """Verify the Task permission rules applied by setup_task_permissions.

    Projects Manager, Delivery Manager and Delivery User get full CRUD on any
    task. Employee gets full CRUD only on tasks they created (owner-scoped).
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_task_permissions()
        make_employee(TASK_OWNER_USER)
        make_employee(OTHER_EMPLOYEE_USER)
        cls._make_user(DELIVERY_MANAGER_USER, ["Delivery Manager"])
        cls._make_user(DELIVERY_USER_USER, ["Delivery User"])
        cls._make_user(PROJECTS_MANAGER_USER, ["Projects Manager"])
        frappe.clear_cache()

        frappe.set_user(TASK_OWNER_USER)
        cls.task = frappe.get_doc({"doctype": "Task", "subject": "Task permission test"}).insert()
        frappe.set_user("Administrator")

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

    def test_manager_roles_have_full_crud_on_any_task(self):
        for user in (DELIVERY_MANAGER_USER, DELIVERY_USER_USER, PROJECTS_MANAGER_USER):
            for ptype in ("read", "write", "create", "delete"):
                with self.subTest(user=user, ptype=ptype):
                    self.assertTrue(
                        frappe.has_permission("Task", ptype, doc=self.task, user=user),
                        f"{user} should have {ptype} permission on any Task",
                    )

    def test_owner_employee_has_full_crud_on_own_task(self):
        for ptype in ("read", "write", "delete"):
            with self.subTest(ptype=ptype):
                self.assertTrue(
                    frappe.has_permission("Task", ptype, doc=self.task, user=TASK_OWNER_USER),
                    f"Task owner should have {ptype} permission on their own Task",
                )
        self.assertTrue(frappe.has_permission("Task", "create", user=TASK_OWNER_USER))

    def test_other_employee_cannot_delete_foreign_task(self):
        self.assertFalse(
            frappe.has_permission("Task", "delete", doc=self.task, user=OTHER_EMPLOYEE_USER),
            "An Employee should not be able to delete a Task they did not create",
        )

    def test_owner_employee_can_delete_own_task(self):
        frappe.set_user(TASK_OWNER_USER)
        task = frappe.get_doc({"doctype": "Task", "subject": "Task delete test"}).insert()
        task.delete()
        self.assertFalse(frappe.db.exists("Task", task.name))

    def test_setup_is_idempotent(self):
        setup_task_permissions()
        setup_task_permissions()
        owner_rules = frappe.get_all(
            "Custom DocPerm",
            filters={"parent": "Task", "role": "Employee", "permlevel": 0, "if_owner": 1},
        )
        self.assertEqual(len(owner_rules), 1)
