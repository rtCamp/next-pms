import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.api.team import get_resource_management_team_view_data

EMPLOYEE_TAGS = {
    "Aarav Sharma": ["python", "react"],
    "Diya Sharma": ["python"],
    "Kabir Sharma": ["python"],
    "Meera Sharma": ["react"],
}

WRITE_USER = "neha.kapoor@example.com"
READ_ONLY_USER = "rohan.verma@example.com"


class TestTeamViewTagFilter(IntegrationTestCase):
    """Tag filtering for get_resource_management_team_view_data.

    Mirrors get_resource_management_project_view_data: a dedicated multi-select `tag`
    param (IN / union) and composite `filters` tag conditions (=, !=, like, not like),
    both resolved against the Tag Link doctype and gated on write permission.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        # Projects User grants write permission, so the tag filters take effect.
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Projects User")

        cls.employees = {name: cls._make_employee(name, tags) for name, tags in EMPLOYEE_TAGS.items()}

        # The read-only user only passes the endpoint's role gate via the Employee role,
        # which ERPNext grants by linking a User to an Employee. This employee is untagged
        # and has a different surname, so it never appears in the tag/name assertions below.
        cls.read_only_user = cls._make_user(READ_ONLY_USER)
        cls._make_employee("Rohan Verma", [], user_id=cls.read_only_user)

        frappe.clear_cache()

    @classmethod
    def _make_user(cls, email):
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
        return email

    @classmethod
    def _make_employee(cls, employee_name, tags, user_id=None):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": employee_name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                # The rtcamp Employee doc-event derives leave_approver from reports_to
                # when leave_approver is empty, calling a str-typed helper that rejects a
                # None reports_to. Setting it up front skips that branch.
                "leave_approver": "Administrator",
                "user_id": user_id,
            }
        )
        employee.insert(ignore_permissions=True)
        for tag in tags:
            employee.add_tag(tag)
        return employee.name

    def tearDown(self):
        frappe.set_user("Administrator")

    def _team_view_employee_names(self, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        result = get_resource_management_team_view_data(date="2026-06-14", **kwargs)
        names = sorted(employee["employee_name"] for employee in result["employees"])
        return names, result["total_count"], result["permissions"]

    def test_dedicated_tag_param_returns_employees_with_that_tag(self):
        names, total_count, _permissions = self._team_view_employee_names(tag=json.dumps(["python"]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma"])
        self.assertEqual(total_count, 3)

    def test_dedicated_tag_param_with_multiple_tags_unions_membership(self):
        names, total_count, _permissions = self._team_view_employee_names(tag=json.dumps(["python", "react"]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 4)

    def test_composite_filter_tag_equals(self):
        names, total_count, _permissions = self._team_view_employee_names(filters=json.dumps([["tag", "=", "python"]]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma"])
        self.assertEqual(total_count, 3)

    def test_composite_filter_tag_conditions_are_anded(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "=", "python"], ["tag", "=", "react"]])
        )
        self.assertEqual(names, ["Aarav Sharma"])
        self.assertEqual(total_count, 1)

    def test_composite_filter_tag_with_employee_name(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "=", "python"], ["employee_name", "like", "Diya"]])
        )
        self.assertEqual(names, ["Diya Sharma"])
        self.assertEqual(total_count, 1)

    def test_composite_filter_tag_like(self):
        names, total_count, _permissions = self._team_view_employee_names(filters=json.dumps([["tag", "like", "reac"]]))
        self.assertEqual(names, ["Aarav Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 2)

    def test_composite_filter_tag_not_equals_excludes_tagged(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "!=", "python"], ["employee_name", "like", "Sharma"]])
        )
        self.assertEqual(names, ["Meera Sharma"])
        self.assertEqual(total_count, 1)

    def test_dedicated_param_and_composite_filter_stack(self):
        names, total_count, _permissions = self._team_view_employee_names(
            tag=json.dumps(["python"]),
            filters=json.dumps([["tag", "=", "react"]]),
        )
        self.assertEqual(names, ["Aarav Sharma"])
        self.assertEqual(total_count, 1)

    def test_tag_filter_ignored_without_write_permission(self):
        names, total_count, permissions = self._team_view_employee_names(
            user=READ_ONLY_USER,
            tag=json.dumps(["python"]),
            filters=json.dumps([["employee_name", "like", "Sharma"]]),
        )
        self.assertFalse(permissions["write"])
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 4)
