import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_timesheet_rejected_hours_field
from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.team import _approve_or_reject_timesheet
from next_pms.timesheet.api.timesheet import delete as delete_time_entry
from next_pms.timesheet.api.timesheet import get_timesheet_data, submit_for_approval, update_timesheet_detail
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays
from next_pms.timesheet.utils.constant import ALLOWED_TIMESHET_DETAIL_FIELDS

MANAGER_USER = "rejected-hours-test-manager@example.com"
EMPLOYEE_USER = "rejected-hours-test-employee@example.com"
PROJECT_NAME = "Rejected Hours Test Project"
TASK_SUBJECT = "Rejected Hours Test Task"

MON, TUE = "2026-08-24", "2026-08-25"
MON_HOURS = (2, 3)
TUE_HOURS = 4
REASON = "Monday needs to be logged again with the correct task."
SECOND_REASON = "The re-logged Monday entry still points at the wrong task."
PARENT_ONLY_FIELDS = {"custom_approval_status", "custom_weekly_rejection_reason"}


class TestRejectedTimesheetHours(IntegrationTestCase):
    """Rejecting a day moves each row's hours into rejected_hours and locks the row, so the rejected work
    stays on record without counting anywhere and the employee logs the corrected work as a new entry."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_timesheet_rejected_hours_field()
        company = get_default_company()

        cls.previous_first_day = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")

        cls.manager = make_employee(MANAGER_USER, company=company, leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER, company=company, reports_to=cls.manager, leave_approver="Administrator"
        )

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

        frappe.clear_cache()
        get_holidays.clear_cache()

    @classmethod
    def tearDownClass(cls):
        frappe.db.set_default("first_day_of_the_week", cls.previous_first_day)
        frappe.db.commit()  # nosemgrep the default lives outside the per-test transaction
        super().tearDownClass()

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        self.delete_test_timesheets()

        for index, hours in enumerate(MON_HOURS, start=1):
            self.log(MON, hours, f"Monday entry {index}")
        self.log(TUE, TUE_HOURS, "Tuesday entry")
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)
        self.decide("Rejected", MON, REASON)

    def tearDown(self):
        self.delete_test_timesheets()
        frappe.set_user("Administrator")
        super().tearDown()

    def delete_test_timesheets(self):
        # The rejection job commits, so rows from an earlier run can outlive the rollback.
        names = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "start_date": [">=", MON], "end_date": ["<=", TUE]},
            pluck="name",
        )
        for name in names:
            doc = frappe.get_doc("Timesheet", name)
            if doc.docstatus == 1:
                doc.cancel()
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True, ignore_on_trash=True)

    def log(self, date, hours, description):
        save_timesheet(date=date, description=description, task=self.task, hours=hours, employee=self.employee)

    def decide(self, status, date, note=""):
        drafts = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "start_date": [">=", MON], "end_date": ["<=", TUE], "docstatus": 0},
            fields=["name", "start_date", "employee"],
        )
        _approve_or_reject_timesheet(timesheets=drafts, status=status, employee=self.employee, dates=[date], note=note)

    def parent(self, date):
        return frappe.db.get_value(
            "Timesheet",
            {"employee": self.employee, "start_date": date, "docstatus": ["!=", 2]},
            ["name", "custom_approval_status", "total_hours", "docstatus"],
            as_dict=True,
        )

    def rows(self, parent_name):
        return frappe.get_all(
            "Timesheet Detail",
            filters={"parent": parent_name},
            fields=["name", "hours", "rejected_hours", "description", "custom_rejection_reason"],
            order_by="idx",
        )

    def week_payload(self):
        weeks = get_timesheet_data(employee=self.employee, start_date=MON, max_week=1)["data"]
        return next(iter(weeks.values()))

    def entries(self, payload):
        return [entry for task in payload["tasks"].values() for entry in task["data"]]

    def assert_rows(self, rows, expected):
        """Compare (hours, rejected_hours, custom_rejection_reason) per row against expected."""
        self.assertEqual([(row.hours, row.rejected_hours, row.custom_rejection_reason) for row in rows], expected)

    def test_rejection_moves_hours_into_rejected_hours(self):
        parent = self.parent(MON)
        self.assertEqual(parent.custom_approval_status, "Rejected")
        self.assertEqual(parent.total_hours, 0)
        self.assert_rows(self.rows(parent.name), [(0, hours, REASON) for hours in MON_HOURS])

    def test_unrejected_day_is_untouched(self):
        parent = self.parent(TUE)
        self.assertEqual(parent.total_hours, TUE_HOURS)
        self.assert_rows(self.rows(parent.name), [(TUE_HOURS, 0, None)])

    def test_rejected_hours_do_not_count_toward_the_week_total(self):
        self.assertEqual(self.week_payload()["total_hours"], TUE_HOURS)

    def test_rejected_hours_do_not_count_toward_task_actual_time(self):
        task = frappe.get_doc("Task", self.task)
        task.update_time_and_costing()
        self.assertEqual(task.actual_time, TUE_HOURS)

    def test_entry_payload_exposes_rejected_hours(self):
        by_description = {entry["description"]: entry for entry in self.entries(self.week_payload())}
        self.assertEqual(by_description["Monday entry 1"]["rejected_hours"], MON_HOURS[0])
        self.assertEqual(by_description["Monday entry 1"]["hours"], 0)
        self.assertEqual(by_description["Tuesday entry"]["rejected_hours"], 0)
        for entry in by_description.values():
            self.assertEqual(set(entry), set(ALLOWED_TIMESHET_DETAIL_FIELDS) | PARENT_ONLY_FIELDS)

    def test_entry_logged_after_rejection_keeps_its_hours_and_joins_the_rejected_parent(self):
        parent = self.parent(MON)
        self.log(MON, 1, "Logged after rejection")

        self.assertEqual(self.parent(MON).name, parent.name)
        self.assertEqual(self.parent(MON).total_hours, 1)
        self.assert_rows(self.rows(parent.name), [(0, MON_HOURS[0], REASON), (0, MON_HOURS[1], REASON), (1, 0, None)])
        self.assertEqual(self.week_payload()["total_hours"], TUE_HOURS + 1)

    def test_rejecting_again_only_moves_the_new_hours_and_keeps_earlier_reasons(self):
        parent = self.parent(MON)
        self.log(MON, 1, "Logged after rejection")
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

        self.decide("Rejected", MON, SECOND_REASON)

        self.assertEqual(self.parent(MON).total_hours, 0)
        self.assert_rows(
            self.rows(parent.name),
            [(0, MON_HOURS[0], REASON), (0, MON_HOURS[1], REASON), (0, 1, SECOND_REASON)],
        )

    def test_approving_a_resubmitted_day_keeps_the_rejected_rows_on_record(self):
        parent = self.parent(MON)
        self.log(MON, 1, "Logged after rejection")
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

        self.decide("Approved", MON)

        approved = self.parent(MON)
        self.assertEqual(approved.custom_approval_status, "Approved")
        self.assertEqual(approved.docstatus, 1)
        self.assertEqual(approved.total_hours, 1)
        self.assert_rows(self.rows(parent.name), [(0, MON_HOURS[0], REASON), (0, MON_HOURS[1], REASON), (1, 0, None)])

    def test_rejected_row_cannot_be_edited(self):
        parent = self.parent(MON)
        row = self.rows(parent.name)[0]

        with self.assertRaisesRegex(frappe.ValidationError, "Rejected time entries cannot be changed or removed"):
            update_timesheet_detail(
                name=row.name,
                parent=parent.name,
                hours=1,
                description="Edited after rejection",
                task=self.task,
                date=MON,
            )

        self.assert_rows(self.rows(parent.name), [(0, hours, REASON) for hours in MON_HOURS])

    def test_rejected_row_cannot_be_deleted_while_other_rows_remain(self):
        parent = self.parent(MON)
        first = self.rows(parent.name)[0]

        with self.assertRaisesRegex(frappe.ValidationError, "Rejected time entries cannot be changed or removed"):
            delete_time_entry(parent=parent.name, name=first.name)

        self.assert_rows(self.rows(parent.name), [(0, hours, REASON) for hours in MON_HOURS])

    def test_last_rejected_row_cannot_be_deleted_with_its_parent(self):
        self.decide("Rejected", TUE, REASON)
        parent = self.parent(TUE)
        (only_row,) = self.rows(parent.name)

        with self.assertRaisesRegex(frappe.ValidationError, "Rejected time entries cannot be changed or removed"):
            delete_time_entry(parent=parent.name, name=only_row.name)

        self.assertTrue(frappe.db.exists("Timesheet", parent.name))
        self.assert_rows(self.rows(parent.name), [(0, TUE_HOURS, REASON)])
