import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api import get_approver_details

MANAGER_USER = "approver.manager@example.com"
REPORT_USER = "approver.report@example.com"
SYSTEM_MANAGER_USER = "approver.system.manager@example.com"


class TestApproverDetails(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()

        cls.manager = make_employee(MANAGER_USER, company=company, leave_approver="Administrator")
        cls.report = make_employee(REPORT_USER, company=company, leave_approver="Administrator")
        frappe.db.set_value("Employee", cls.report, "reports_to", cls.manager)

        cls.system_manager = make_employee(SYSTEM_MANAGER_USER, company=company, leave_approver="Administrator")
        frappe.get_doc("User", SYSTEM_MANAGER_USER).add_roles("System Manager")

    def _names(self):
        return {employee["name"] for employee in get_approver_details()}

    def test_lists_employees_someone_reports_to(self):
        self.assertIn(self.manager, self._names())

    def test_skips_approver_role_holders_nobody_reports_to(self):
        self.assertNotIn(self.system_manager, self._names())
        self.assertNotIn(self.report, self._names())
