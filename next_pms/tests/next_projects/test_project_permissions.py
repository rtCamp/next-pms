import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_project_permissions_for_managers
from next_pms.tests.utils import make_employee

SYSTEM_MANAGER_USER = "test.project.sm@example.com"
DELIVERY_MANAGER_USER = "test.project.dm@example.com"
OTHER_USER = "test.project.other@example.com"

BASE_PERMISSIONS = {"read": 1, "write": 1, "create": 1, "select": 1, "report": 1, "export": 1, "share": 1}
FIELD_PERMISSIONS = {"read": 1, "write": 1}

ROLE_PERMLEVELS = (("System Manager", (0, 1, 2, 3)), ("Delivery Manager", (0, 1, 2)))


class TestProjectPermissionsForManagers(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_project_permissions_for_managers()
        make_employee(OTHER_USER, leave_approver="Administrator")
        cls._make_user(SYSTEM_MANAGER_USER, ["System Manager"])
        cls._make_user(DELIVERY_MANAGER_USER, ["Delivery Manager"])
        frappe.clear_cache()

        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Project permission test",
                "company": get_default_company(),
                "custom_billing_type": "Non-Billable",
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

    def test_custom_docperms_exist_for_every_permlevel(self):
        for role, permlevels in ROLE_PERMLEVELS:
            for permlevel in permlevels:
                with self.subTest(role=role, permlevel=permlevel):
                    self.assertTrue(
                        frappe.db.exists("Custom DocPerm", {"parent": "Project", "role": role, "permlevel": permlevel}),
                        f"Custom DocPerm missing for {role} at permlevel {permlevel}",
                    )

    def test_base_permissions_on_permlevel_zero(self):
        for role, _ in ROLE_PERMLEVELS:
            with self.subTest(role=role):
                for perm_key, perm_val in BASE_PERMISSIONS.items():
                    self.assertEqual(
                        frappe.db.get_value(
                            "Custom DocPerm", {"parent": "Project", "role": role, "permlevel": 0}, perm_key
                        ),
                        perm_val,
                        f"{role} should have {perm_key}={perm_val} at permlevel 0",
                    )

    def test_field_permissions_on_field_permlevels(self):
        for role, permlevels in ROLE_PERMLEVELS:
            for permlevel in permlevels:
                if permlevel == 0:
                    continue
                with self.subTest(role=role, permlevel=permlevel):
                    for perm_key, perm_val in FIELD_PERMISSIONS.items():
                        self.assertEqual(
                            frappe.db.get_value(
                                "Custom DocPerm", {"parent": "Project", "role": role, "permlevel": permlevel}, perm_key
                            ),
                            perm_val,
                            f"{role} should have {perm_key}={perm_val} at permlevel {permlevel}",
                        )

    def test_managers_can_read_write_and_create_project(self):
        for user in (SYSTEM_MANAGER_USER, DELIVERY_MANAGER_USER):
            for ptype in ("read", "write", "create"):
                with self.subTest(user=user, ptype=ptype):
                    self.assertTrue(
                        frappe.has_permission("Project", ptype, doc=self.project, user=user),
                        f"{user} should have {ptype} permission on Project",
                    )

    def test_other_user_cannot_write_project(self):
        self.assertFalse(
            frappe.has_permission("Project", "write", doc=self.project, user=OTHER_USER),
            "A user without the granted roles should not write Project",
        )

    def test_setup_is_idempotent(self):
        setup_project_permissions_for_managers()
        setup_project_permissions_for_managers()
        for role, permlevels in ROLE_PERMLEVELS:
            for permlevel in permlevels:
                rules = frappe.get_all(
                    "Custom DocPerm",
                    filters={"parent": "Project", "role": role, "permlevel": permlevel},
                )
                self.assertEqual(len(rules), 1, f"Expected one Custom DocPerm for {role} at permlevel {permlevel}")
