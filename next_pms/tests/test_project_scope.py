import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.permissions.project import get_accessible_project_names
from next_pms.resource_management.api.project import (
    _get_resource_management_project_view_data,
    get_resource_management_project_view_data,
)
from next_pms.tests.utils import make_employee
from next_pms.timesheet.api import get_count

PREFIX = "Project Scope Test"
EMPLOYEE_USER = "project-scope-employee@example.com"
OTHER_EMPLOYEE_USER = "project-scope-other-employee@example.com"
ACCOUNTS_USER = "project-scope-accounts@example.com"
PROJECTS_USER = "project-scope-projects-user@example.com"
CONTRACTOR_USER = "project-scope-contractor@example.com"


def _make_project(label: str) -> str:
    project_name = f"{PREFIX} {label}"
    existing = frappe.db.get_value("Project", {"project_name": project_name})
    if existing:
        return existing
    return (
        frappe.get_doc({"doctype": "Project", "project_name": project_name, "company": get_default_company()})
        .insert(ignore_permissions=True)
        .name
    )


def _share(project: str, user: str | None = None, everyone: int = 0):
    frappe.share.add_docshare(
        "Project", project, user, read=1, everyone=everyone, flags={"ignore_share_permission": True}
    )


class TestProjectScope(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        for user in (EMPLOYEE_USER, OTHER_EMPLOYEE_USER, ACCOUNTS_USER, PROJECTS_USER, CONTRACTOR_USER):
            make_employee(user, company=company, leave_approver="Administrator")
        frappe.get_doc("User", ACCOUNTS_USER).add_roles("Accounts User")
        frappe.get_doc("User", PROJECTS_USER).add_roles("Projects User")
        if not frappe.db.exists("Role", "Contractor"):
            frappe.get_doc({"doctype": "Role", "role_name": "Contractor", "desk_access": 1}).insert()
        frappe.get_doc("User", CONTRACTOR_USER).add_roles("Contractor")

        cls.shared = _make_project("Shared")
        cls.everyone = _make_project("Everyone")
        cls.owned = _make_project("Owned")
        cls.hidden = _make_project("Hidden")
        _share(cls.shared, EMPLOYEE_USER)
        _share(cls.shared, CONTRACTOR_USER)
        _share(cls.everyone, everyone=1)
        frappe.db.set_value("Project", cls.owned, "owner", EMPLOYEE_USER)
        cls.hidden_task = frappe.get_doc(
            {"doctype": "Task", "subject": f"{PREFIX} hidden task", "project": cls.hidden}
        ).insert(ignore_permissions=True)
        cls.ours = {cls.shared, cls.everyone, cls.owned, cls.hidden}

    def tearDown(self):
        frappe.set_user("Administrator")

    def _listed(self, user: str) -> set[str]:
        frappe.set_user(user)
        return set(frappe.get_list("Project", filters={"name": ["in", list(self.ours)]}, pluck="name"))

    def test_employee_lists_projects_shared_with_them_or_everyone(self):
        self.assertEqual(self._listed(EMPLOYEE_USER), {self.shared, self.everyone})

    def test_employee_cannot_open_an_unshared_project_even_one_they_own(self):
        frappe.set_user(EMPLOYEE_USER)
        for ptype in ("select", "read"):
            self.assertTrue(frappe.has_permission("Project", ptype, self.shared))
            self.assertFalse(frappe.has_permission("Project", ptype, self.owned))
            self.assertFalse(frappe.has_permission("Project", ptype, self.hidden))

    def test_employee_count_matches_the_list(self):
        frappe.set_user(EMPLOYEE_USER)
        self.assertEqual(get_count("Project", filters={"name": ["in", list(self.ours)]}), 2)

    def test_employee_keeps_tasks_of_unshared_projects(self):
        frappe.set_user(EMPLOYEE_USER)
        self.assertTrue(frappe.has_permission("Task", "read", self.hidden_task.name))
        self.assertTrue(frappe.has_permission("Task", "write", self.hidden_task.name))

    def test_task_picker_rule_drops_owned_projects(self):
        projects = set(get_accessible_project_names(EMPLOYEE_USER))
        self.assertEqual(projects & self.ours, {self.shared, self.everyone})

    def test_other_roles_that_read_projects_are_not_limited(self):
        self.assertEqual(self._listed(ACCOUNTS_USER), self.ours)
        self.assertEqual(self._listed(PROJECTS_USER), self.ours)
        self.assertEqual(self._listed("Administrator"), self.ours)

    def test_contractor_lists_shares_but_picks_tasks_from_individual_shares_only(self):
        self.assertEqual(self._listed(CONTRACTOR_USER), {self.shared, self.everyone})
        self.assertEqual(set(get_accessible_project_names(CONTRACTOR_USER)) & self.ours, {self.shared})

    def test_allocation_project_view_is_scoped_and_cached_per_employee(self):
        _get_resource_management_project_view_data.clear_cache()

        def view_projects(user: str) -> set[str]:
            frappe.set_user(user)
            res = get_resource_management_project_view_data(date="2026-11-23", project_name=PREFIX, page_length=20)
            return {row["name"] for row in res["data"]}

        self.assertEqual(view_projects(EMPLOYEE_USER), {self.shared, self.everyone})
        self.assertEqual(view_projects(OTHER_EMPLOYEE_USER), {self.everyone})
        self.assertEqual(view_projects(PROJECTS_USER), self.ours)
