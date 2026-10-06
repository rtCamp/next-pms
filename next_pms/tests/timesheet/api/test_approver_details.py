import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api import get_approver_details

TIMESHEET_USER = "approver.timesheet.user@example.com"
PROJECTS_MANAGER_USER = "approver.projects.manager@example.com"
PLAIN_EMPLOYEE_USER = "approver.plain.employee@example.com"


class TestApproverDetails(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()

        cls.timesheet_user_employee = make_employee(TIMESHEET_USER, company=company, leave_approver="Administrator")
        frappe.get_doc("User", TIMESHEET_USER).add_roles("Timesheet User")

        cls.projects_manager_employee = make_employee(
            PROJECTS_MANAGER_USER, company=company, leave_approver="Administrator"
        )
        frappe.get_doc("User", PROJECTS_MANAGER_USER).add_roles("Projects Manager")

        cls.plain_employee_employee = make_employee(
            PLAIN_EMPLOYEE_USER, company=company, leave_approver="Administrator"
        )

        frappe.clear_cache()

    def _names(self, employees):
        return {employee["name"] for employee in employees}

    def test_timesheet_user_appears_in_approver_details(self):
        self.assertIn(self.timesheet_user_employee, self._names(get_approver_details()))

    def test_projects_manager_appears_in_approver_details(self):
        self.assertIn(self.projects_manager_employee, self._names(get_approver_details()))

    def test_plain_employee_is_not_listed_as_approver(self):
        self.assertNotIn(self.plain_employee_employee, self._names(get_approver_details()))
