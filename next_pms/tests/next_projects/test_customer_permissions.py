import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_customer_read_permissions

GRANTED_ROLES = ("Projects User", "Delivery Manager", "Timesheet Manager", "System Manager")
PROJECTS_USER = "test.customer.pu@example.com"
DELIVERY_USER = "test.customer.du@example.com"


class TestCustomerReadPermissions(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_customer_read_permissions()
        cls._make_user(PROJECTS_USER, ["Projects User"])
        cls._make_user(DELIVERY_USER, ["Delivery User"])
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
        frappe.get_doc("User", email).add_roles(*roles)

    def test_granted_roles_can_read_customer(self):
        for role in GRANTED_ROLES:
            with self.subTest(role=role):
                self.assertEqual(
                    frappe.db.get_value("Custom DocPerm", {"parent": "Customer", "role": role, "permlevel": 0}, "read"),
                    1,
                )

    def test_delivery_user_is_not_granted(self):
        self.assertFalse(frappe.db.exists("Custom DocPerm", {"parent": "Customer", "role": "Delivery User", "read": 1}))
        self.assertFalse(frappe.has_permission("Customer", "read", user=DELIVERY_USER))

    def test_projects_user_can_read_customer(self):
        self.assertTrue(frappe.has_permission("Customer", "read", user=PROJECTS_USER))

    def test_setup_is_idempotent(self):
        setup_customer_read_permissions()
        for role in GRANTED_ROLES:
            with self.subTest(role=role):
                rules = frappe.get_all("Custom DocPerm", filters={"parent": "Customer", "role": role, "permlevel": 0})
                self.assertEqual(len(rules), 1)
