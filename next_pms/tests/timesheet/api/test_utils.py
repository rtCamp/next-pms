import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.utils import can_approve_project_timesheets, employee_has_higher_access

TIMESHEET_USER = "ts-utils-timesheet-user@example.com"
PLAIN_EMPLOYEE_USER = "ts-utils-plain-employee@example.com"
OTHER_EMPLOYEE_USER = "ts-utils-other-employee@example.com"
PROJECT_NAME = "Timesheet Utils Access Project"


class TestTimesheetUserGlobalAccess(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        make_employee(TIMESHEET_USER, company=company, leave_approver="Administrator")
        make_employee(PLAIN_EMPLOYEE_USER, company=company, leave_approver="Administrator")
        cls.other_employee = make_employee(OTHER_EMPLOYEE_USER, company=company, leave_approver="Administrator")
        frappe.get_doc("User", TIMESHEET_USER).add_roles("Timesheet User")

        cls.project = frappe.db.get_value("Project", {"project_name": PROJECT_NAME}) or (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": PROJECT_NAME,
                    "company": company,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_timesheet_user_can_write_time_for_an_employee_outside_their_reports(self):
        frappe.set_user(TIMESHEET_USER)
        self.assertTrue(employee_has_higher_access(self.other_employee, ptype="write"))

    def test_timesheet_user_can_approve_any_project_timesheet(self):
        frappe.set_user(TIMESHEET_USER)
        self.assertTrue(can_approve_project_timesheets(self.project, self.other_employee))

    def test_plain_employee_cannot_write_or_approve_another_employees_time(self):
        frappe.set_user(PLAIN_EMPLOYEE_USER)
        self.assertFalse(employee_has_higher_access(self.other_employee, ptype="write"))
        self.assertFalse(can_approve_project_timesheets(self.project, self.other_employee))
