import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.timesheet.api import filter_employees

SHARED_PROJECT_NAME = "Filter Employees Shared Project"
EMPTY_PROJECT_NAME = "Filter Employees Empty Project"
EVERYONE_PROJECT_NAME = "Filter Employees Everyone Project"

MEMBER_A_NAME = "FE Member Alpha"
MEMBER_B_NAME = "FE Member Beta"
MEMBER_A_USER = "fe.member.alpha@example.com"
MEMBER_B_USER = "fe.member.beta@example.com"


class TestFilterEmployeesMembership(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        cls.user_a = cls._make_user(MEMBER_A_USER)
        cls.user_b = cls._make_user(MEMBER_B_USER)
        cls.member_a = cls._make_employee(MEMBER_A_NAME, cls.user_a)
        cls.member_b = cls._make_employee(MEMBER_B_NAME, cls.user_b)

        # Shared project → member A only. Empty project → nobody. Everyone project → all active employees.
        cls.shared_project = cls._make_project(SHARED_PROJECT_NAME)
        cls.empty_project = cls._make_project(EMPTY_PROJECT_NAME)
        cls.everyone_project = cls._make_project(EVERYONE_PROJECT_NAME)
        frappe.share.add("Project", cls.shared_project, cls.user_a, read=1)
        frappe.share.add("Project", cls.everyone_project, everyone=1, read=1)

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
    def _make_employee(cls, employee_name, user_id):
        existing = frappe.db.get_value("Employee", {"employee_name": employee_name})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Employee",
                    "naming_series": "EMP-",
                    "first_name": employee_name,
                    "company": cls.company,
                    "gender": "Female",
                    "date_of_birth": "1990-05-08",
                    "date_of_joining": "2013-01-01",
                    "status": "Active",
                    "employment_type": "Intern",
                    "leave_approver": "Administrator",
                    "user_id": user_id,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls, project_name):
        existing = frappe.db.get_value("Project", {"project_name": project_name})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": project_name,
                    "company": cls.company,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def _names(self, employees):
        return {employee["name"] for employee in employees}

    def _active_count(self):
        return frappe.db.count("Employee", {"status": "Active"})

    def test_project_with_no_shares_returns_empty(self):
        employees, count = filter_employees(project=[self.empty_project], ignore_permissions=True)
        self.assertEqual(employees, [])
        self.assertEqual(count, 0)

    def test_project_with_shares_returns_only_shared_employees(self):
        employees, count = filter_employees(project=[self.shared_project], ignore_permissions=True)
        self.assertEqual(self._names(employees), {self.member_a})
        self.assertEqual(count, 1)

    def test_no_membership_filter_returns_all_active(self):
        employees, count = filter_employees(page_length=self._active_count(), ignore_permissions=True)
        self.assertEqual(count, self._active_count())
        self.assertIn(self.member_a, self._names(employees))
        self.assertIn(self.member_b, self._names(employees))

    def test_explicit_empty_ids_returns_empty(self):
        employees, count = filter_employees(ids=[], ignore_permissions=True)
        self.assertEqual(employees, [])
        self.assertEqual(count, 0)

    def test_ids_none_does_not_restrict(self):
        _, count = filter_employees(ids=None, page_length=self._active_count(), ignore_permissions=True)
        self.assertEqual(count, self._active_count())

    def test_project_and_ids_are_unioned(self):
        # shared_project → member A; ids → member B. Union = both.
        employees, count = filter_employees(project=[self.shared_project], ids=[self.member_b], ignore_permissions=True)
        self.assertEqual(self._names(employees), {self.member_a, self.member_b})
        self.assertEqual(count, 2)

    def test_project_shared_with_everyone_returns_all_active(self):
        employees, count = filter_employees(
            project=[self.everyone_project], page_length=self._active_count(), ignore_permissions=True
        )
        self.assertEqual(count, self._active_count())
        self.assertIn(self.member_a, self._names(employees))
        self.assertIn(self.member_b, self._names(employees))
