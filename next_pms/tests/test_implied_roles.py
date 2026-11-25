import frappe
from frappe.tests import IntegrationTestCase

PM_ONLY_USER = "implied-roles-pm@example.com"
PL_ONLY_USER = "implied-roles-pl@example.com"
PU_ONLY_USER = "implied-roles-pu@example.com"
NEW_PM_USER = "implied-roles-new-pm@example.com"


def _make_user(email: str, *roles: str):
    frappe.delete_doc("User", email, force=True, ignore_permissions=True)
    return frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": email.split("@")[0],
            "send_welcome_email": 0,
            "roles": [{"role": role} for role in roles],
        }
    ).insert(ignore_permissions=True)


def _roles(email: str) -> set[str]:
    return {row.role for row in frappe.get_doc("User", email).roles}


class TestImpliedRoles(IntegrationTestCase):
    def test_projects_manager_gains_projects_user(self):
        _make_user(PM_ONLY_USER, "Projects Manager")
        self.assertLessEqual({"Projects Manager", "Projects User"}, _roles(PM_ONLY_USER))

    def test_pms_leadership_gains_projects_manager_and_projects_user(self):
        _make_user(PL_ONLY_USER, "PMS Leadership")
        self.assertLessEqual({"PMS Leadership", "Projects Manager", "Projects User"}, _roles(PL_ONLY_USER))

    def test_role_added_later_pulls_in_the_roles_below_it(self):
        _make_user(NEW_PM_USER, "Accounts User")
        frappe.get_doc("User", NEW_PM_USER).add_roles("Projects Manager")
        self.assertLessEqual({"Accounts User", "Projects Manager", "Projects User"}, _roles(NEW_PM_USER))

    def test_projects_user_gains_nothing(self):
        _make_user(PU_ONLY_USER, "Projects User")
        self.assertFalse({"Projects Manager", "PMS Leadership"} & _roles(PU_ONLY_USER))

    def test_saving_again_does_not_duplicate_roles(self):
        _make_user(PL_ONLY_USER, "PMS Leadership")
        frappe.get_doc("User", PL_ONLY_USER).save(ignore_permissions=True)
        roles = [row.role for row in frappe.get_doc("User", PL_ONLY_USER).roles]
        self.assertEqual(len(roles), len(set(roles)))
