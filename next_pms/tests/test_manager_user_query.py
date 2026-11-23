import frappe
from frappe.tests import IntegrationTestCase

from next_pms.permissions.queries import manager_user_query

PREFIX = "manager-query-"
PU_USER = f"{PREFIX}pu@example.com"
SM_USER = f"{PREFIX}sm@example.com"
EMPLOYEE_USER = f"{PREFIX}emp@example.com"
DISABLED_PU_USER = f"{PREFIX}disabled@example.com"


def _make_user(email: str, *roles: str, enabled: int = 1, first_name: str = "Manager Query"):
    frappe.delete_doc("User", email, force=True, ignore_permissions=True)
    frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": first_name,
            "enabled": enabled,
            "send_welcome_email": 0,
            "roles": [{"role": role} for role in roles],
        }
    ).insert(ignore_permissions=True)


def _search(fieldname: str, txt: str = PREFIX) -> set[str]:
    return {name for name, _full_name in manager_user_query("User", txt, "name", 0, 50, {"fieldname": fieldname})}


class TestManagerUserQuery(IntegrationTestCase):
    def setUp(self):
        _make_user(PU_USER, "Projects User")
        _make_user(SM_USER, "System Manager", first_name="Quillfeather")
        _make_user(EMPLOYEE_USER, "Employee")
        _make_user(DISABLED_PU_USER, "Projects User", enabled=0)

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_lists_only_enabled_projects_users_and_system_managers(self):
        for fieldname in ("custom_project_manager", "custom_engineering_manager", "custom_account_manager_"):
            self.assertEqual(_search(fieldname), {PU_USER, SM_USER}, fieldname)

    def test_works_for_a_projects_user_without_role_read_access(self):
        frappe.set_user(PU_USER)
        self.assertEqual(_search("custom_project_manager"), {PU_USER, SM_USER})

    def test_matches_full_name(self):
        self.assertEqual(_search("custom_project_manager", txt="Quillfeather"), {SM_USER})

    def test_rejects_other_fields(self):
        with self.assertRaises(frappe.ValidationError):
            _search("owner")
