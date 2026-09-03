import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import flt

from next_pms.install import setup_timesheet_rejected_hours_field
from next_pms.project_currency.overrides.timesheet import TimesheetOverwrite
from next_pms.tests.utils import make_employee

EMPLOYEE_USER = "zero-hours-test-employee@example.com"
PROJECT_NAME = "Zero Hours Test Project"
TASK_SUBJECT = "Zero Hours Test Task"
DATE = "2026-08-24"

SAVE_GUARD_MESSAGE = "Hour should be greater than 0"
SUBMIT_GUARD_MESSAGE = "Hours value must be greater than zero"


class TestZeroHoursValidation(IntegrationTestCase):
    """A zero-hour Timesheet Detail row is refused on save and on submit, since a time entry
    that logs no work is modelled as no row at all. The one exception is a rejected row, whose
    hours were moved into rejected_hours to keep the rejection on record."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_timesheet_rejected_hours_field()
        company = get_default_company()
        cls.employee = make_employee(EMPLOYEE_USER, company=company, leave_approver="Administrator")

        if not frappe.db.exists("Project", {"project_name": PROJECT_NAME}):
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": PROJECT_NAME,
                    "company": company,
                    "custom_billing_type": "Non-Billable",
                }
            ).insert(ignore_permissions=True)
        cls.project = frappe.db.get_value("Project", {"project_name": PROJECT_NAME})

        if not frappe.db.exists("Task", {"subject": TASK_SUBJECT}):
            frappe.get_doc({"doctype": "Task", "subject": TASK_SUBJECT, "project": cls.project}).insert(
                ignore_permissions=True
            )
        cls.task = frappe.db.get_value("Task", {"subject": TASK_SUBJECT})

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        # The one-Timesheet-per-employee-day-project check runs before validate and would mask the guard.
        for name in frappe.get_all("Timesheet", filters={"employee": self.employee}, pluck="name"):
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True)

    def make_timesheet(self, *hours, rejected=()):
        """Return an unsaved Timesheet with one row per value in hours plus one zero-hour row per
        value in rejected, each holding that value as rejected_hours."""
        rows = [{"hours": value} for value in hours] + [{"hours": 0, "rejected_hours": value} for value in rejected]
        return frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": self.employee,
                "parent_project": self.project,
                "time_logs": [
                    {
                        "task": self.task,
                        "project": self.project,
                        "description": f"Row {index}",
                        "from_time": DATE,
                        "to_time": DATE,
                        **row,
                    }
                    for index, row in enumerate(rows, start=1)
                ],
            }
        )

    def test_timesheet_controller_is_the_next_pms_override(self):
        self.assertIsInstance(self.make_timesheet(2), TimesheetOverwrite)

    def test_save_refuses_a_zero_hour_row(self):
        with self.assertRaisesRegex(frappe.ValidationError, SAVE_GUARD_MESSAGE):
            self.make_timesheet(0).insert()

    def test_save_refuses_when_any_row_is_zero(self):
        with self.assertRaisesRegex(frappe.ValidationError, SAVE_GUARD_MESSAGE):
            self.make_timesheet(2, 0).insert()

    def test_save_accepts_positive_hours(self):
        doc = self.make_timesheet(2, 3).insert()
        self.assertEqual(doc.total_hours, 5)
        self.assertEqual([row.hours for row in doc.time_logs], [2, 3])

    def test_submit_guard_refuses_a_zero_hour_row(self):
        # The save guard fires first on a real save, so the submit-time guard is called directly.
        with self.assertRaisesRegex(frappe.ValidationError, SUBMIT_GUARD_MESSAGE):
            self.make_timesheet(0).validate_mandatory_fields()

    def test_submit_guard_refuses_when_any_row_is_zero(self):
        with self.assertRaisesRegex(frappe.ValidationError, SUBMIT_GUARD_MESSAGE):
            self.make_timesheet(2, 0).validate_mandatory_fields()

    def test_submit_guard_accepts_positive_hours(self):
        self.make_timesheet(2, 3).validate_mandatory_fields()

    def test_save_accepts_a_zero_hour_row_holding_rejected_hours(self):
        doc = self.make_timesheet(2, rejected=(3,)).insert()
        self.assertEqual(doc.total_hours, 2)
        self.assertEqual([(row.hours, flt(row.rejected_hours)) for row in doc.time_logs], [(2, 0), (0, 3)])

    def test_submit_guard_accepts_a_zero_hour_row_holding_rejected_hours(self):
        self.make_timesheet(rejected=(3,)).validate_mandatory_fields()
