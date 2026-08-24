import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, get_first_day_of_week, getdate, nowdate

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.timesheet import submit_for_approval
from next_pms.timesheet.patches.restore_stuck_processing_timesheets import execute

MANAGER_USER = "restore-patch-test-manager@example.com"
EMPLOYEE_USER = "restore-patch-test-employee@example.com"

PROJECT_NAME = "Restore Patch Test Project"
TASK_SUBJECT = "Restore Patch Test Task"

REJECTION_REASON = "Please split the hours by task before resubmitting."


class TestRestoreStuckProcessingTimesheets(IntegrationTestCase):
    """The patch has to leave every shape of half-finished approval in a consistent state.

    A failed approval job could park a whole week or just part of one, and a partially parked
    week ends up with its rows disagreeing about the weekly status - some reading the real
    status, the parked ones reading "Processing Timesheet".
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        frappe.db.set_default("first_day_of_the_week", "Monday")

        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER, company=cls.company, reports_to=cls.manager, leave_approver="Administrator"
        )

        if not frappe.db.exists("Project", {"project_name": PROJECT_NAME}):
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": PROJECT_NAME,
                    "company": cls.company,
                    "custom_billing_type": "Non-Billable",
                }
            ).insert(ignore_permissions=True)
        cls.project = frappe.db.get_value("Project", {"project_name": PROJECT_NAME})

        if not frappe.db.exists("Task", {"subject": TASK_SUBJECT}):
            frappe.get_doc({"doctype": "Task", "subject": TASK_SUBJECT, "project": cls.project}).insert(
                ignore_permissions=True
            )
        cls.task = frappe.db.get_value("Task", {"subject": TASK_SUBJECT})

        cls.week = get_first_day_of_week(add_days(getdate(nowdate()), -21))
        cls.dates = [str(add_days(cls.week, offset)) for offset in range(5)]

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        self.delete_test_timesheets()
        for date in self.dates:
            save_timesheet(
                date=date,
                description=f"Work logged on {date}",
                task=self.task,
                hours=2,
                employee=self.employee,
            )
        submit_for_approval(start_date=self.dates[0], employee=self.employee, approver=self.manager)

    def tearDown(self):
        self.delete_test_timesheets()
        frappe.set_user("Administrator")
        super().tearDown()

    def delete_test_timesheets(self):
        for name in frappe.get_all("Timesheet", filters={"employee": self.employee}, pluck="name"):
            doc = frappe.get_doc("Timesheet", name)
            if doc.docstatus == 1:
                doc.cancel()
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True)

    def rows_by_date(self):
        rows = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "docstatus": ["<", 2]},
            fields=[
                "name",
                "start_date",
                "custom_approval_status",
                "custom_weekly_approval_status",
                "custom_rejection_reason",
                "total_hours",
            ],
        )
        return {str(row.start_date): row for row in rows}

    def park(self, dates):
        """Reproduce what the old approval API committed before handing off to the job."""
        for date in dates:
            frappe.db.set_value(
                "Timesheet",
                self.rows_by_date()[date].name,
                {
                    "custom_approval_status": "Processing Timesheet",
                    "custom_weekly_approval_status": "Processing Timesheet",
                    "custom_weekly_rejection_reason": None,
                },
            )

    def reject(self, dates):
        for date in dates:
            frappe.db.set_value(
                "Timesheet",
                self.rows_by_date()[date].name,
                {"custom_approval_status": "Rejected", "custom_rejection_reason": REJECTION_REASON},
            )

    def assert_nothing_is_parked(self):
        for date, row in self.rows_by_date().items():
            self.assertNotEqual(row.custom_approval_status, "Processing Timesheet", f"{date} still parked")
            self.assertNotEqual(row.custom_weekly_approval_status, "Processing Timesheet", f"{date} still parked")

    def assert_weekly_status_agrees(self, expected):
        statuses = {row.custom_weekly_approval_status for row in self.rows_by_date().values()}
        self.assertEqual(statuses, {expected})

    def test_whole_week_parked_goes_back_to_approval_pending(self):
        self.park(self.dates)

        execute()

        self.assert_nothing_is_parked()
        for date, row in self.rows_by_date().items():
            self.assertEqual(row.custom_approval_status, "Approval Pending", f"{date} was not restored")
        self.assert_weekly_status_agrees("Approval Pending")

    def test_partly_parked_week_stops_disagreeing_about_the_weekly_status(self):
        self.reject(self.dates[:2])
        self.park(self.dates[2:])
        # The parked rows read "Processing Timesheet" while the rejected ones still read the
        # weekly status from before - the inconsistency the patch has to resolve.
        self.assertGreater(len({row.custom_weekly_approval_status for row in self.rows_by_date().values()}), 1)

        execute()

        self.assert_nothing_is_parked()
        rows = self.rows_by_date()
        for date in self.dates[:2]:
            self.assertEqual(rows[date].custom_approval_status, "Rejected")
        for date in self.dates[2:]:
            self.assertEqual(rows[date].custom_approval_status, "Approval Pending")
        self.assert_weekly_status_agrees("Partially Rejected")

    def test_parked_row_that_was_rejected_keeps_its_rejection(self):
        self.reject(self.dates)
        self.park(self.dates)

        execute()

        for date, row in self.rows_by_date().items():
            self.assertEqual(row.custom_approval_status, "Rejected", f"{date} lost its rejection")
            self.assertEqual(row.custom_rejection_reason, REJECTION_REASON)
        self.assert_weekly_status_agrees("Rejected")

    def test_only_status_fields_are_touched(self):
        self.park(self.dates)
        before = self.rows_by_date()

        execute()

        after = self.rows_by_date()
        self.assertEqual(set(before), set(after))
        for date, row in after.items():
            self.assertEqual(row.name, before[date].name)
            self.assertEqual(row.total_hours, before[date].total_hours)
            self.assertEqual(row.custom_rejection_reason, before[date].custom_rejection_reason)

    def test_running_twice_changes_nothing_further(self):
        self.reject(self.dates[:2])
        self.park(self.dates[2:])
        execute()
        after_first_run = self.rows_by_date()

        execute()

        for date, row in self.rows_by_date().items():
            self.assertEqual(row.custom_approval_status, after_first_run[date].custom_approval_status)
            self.assertEqual(row.custom_weekly_approval_status, after_first_run[date].custom_weekly_approval_status)
