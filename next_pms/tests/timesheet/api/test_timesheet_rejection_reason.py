from collections import defaultdict

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.team import _approve_or_reject_timesheet, get_team_timesheet_data
from next_pms.timesheet.api.timesheet import get_timesheet_data, submit_for_approval
from next_pms.timesheet.api.timesheet import save as save_timesheet

MANAGER_USER = "rejection-reason-test-manager@example.com"
EMPLOYEE_USER = "rejection-reason-test-employee@example.com"

CUSTOMER_NAME = "Rejection Reason Test Customer"
PROJECT_NAME = "Rejection Reason Test Project"
TASK_SUBJECT = "Rejection Reason Test Task"

MON, TUE, WED, THU, FRI = "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"
WEEK_DATES = [MON, TUE, WED, THU, FRI]

TUE_REASON = "Please add a task breakdown before resubmitting Tuesday's entry."
THU_REASON = "Thursday's hours need the billable split corrected."


class TestTimesheetRejectionReason(IntegrationTestCase):
    """Reject two days of a submitted week, resubmit, then approve the whole week."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        currency = frappe.get_cached_value("Company", cls.company, "default_currency")

        # Week start is read via frappe.db.get_default, not System Settings directly.
        frappe.db.set_default("first_day_of_the_week", "Monday")

        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER, company=cls.company, reports_to=cls.manager, leave_approver="Administrator"
        )

        if not frappe.db.exists("Customer", {"customer_name": CUSTOMER_NAME}):
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": CUSTOMER_NAME,
                    "customer_type": "Company",
                    "default_currency": currency,
                }
            ).insert(ignore_permissions=True)
        cls.customer = frappe.db.get_value("Customer", {"customer_name": CUSTOMER_NAME})

        if not frappe.db.exists("Project", {"project_name": PROJECT_NAME}):
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": PROJECT_NAME,
                    "company": cls.company,
                    "customer": cls.customer,
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

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        self.delete_test_week_timesheets()

        # Create 5 daily draft timesheets and submit the whole week for approval.
        for date in WEEK_DATES:
            save_timesheet(
                date=date,
                description=f"Work logged on {date}",
                task=self.task,
                hours=2,
                employee=self.employee,
            )
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

    def tearDown(self):
        self.delete_test_week_timesheets()
        frappe.set_user("Administrator")
        super().tearDown()

    def delete_test_week_timesheets(self):
        # _approve_or_reject_timesheet commits internally, so a previous run's data
        # can survive a rollback. Start every test from a clean slate.
        names = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "start_date": [">=", MON], "end_date": ["<=", FRI]},
            pluck="name",
        )
        for name in names:
            doc = frappe.get_doc("Timesheet", name)
            if doc.docstatus == 1:
                doc.cancel()
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True)

    def get_timesheets_by_date(self):
        rows = frappe.get_all(
            "Timesheet",
            filters={
                "employee": self.employee,
                "start_date": [">=", MON],
                "end_date": ["<=", FRI],
                "docstatus": ["!=", 2],
            },
            fields=["name", "start_date", "custom_approval_status", "custom_rejection_reason", "docstatus"],
        )
        by_date = {str(row.start_date): row for row in rows}
        self.assertEqual(len(by_date), 5, "expected exactly 5 daily timesheets for the test week")
        return by_date

    def decide_timesheets(self, status, dates, note=""):
        drafts = frappe.get_all(
            "Timesheet",
            filters={
                "employee": self.employee,
                "start_date": [">=", MON],
                "end_date": ["<=", FRI],
                "docstatus": 0,
            },
            fields=["name", "start_date", "employee"],
        )
        _approve_or_reject_timesheet(timesheets=drafts, status=status, employee=self.employee, dates=dates, note=note)

    def collect_entries_by_parent(self, timesheet_details):
        """Both endpoints nest time entries the same way:
            timesheet_details[week]["tasks"][task]["data"] = [ {entry}, {entry}, ... ]
        Each entry's "parent" is its Timesheet name. A Timesheet can hold several
        entries, so group them into a list per parent rather than keeping only one."""
        entries_by_parent = defaultdict(list)
        for week in timesheet_details.values():
            for task in week["tasks"].values():
                for entry in task["data"]:
                    entries_by_parent[entry["parent"]].append(entry)
        return entries_by_parent

    def assert_entries_carry_fields(self, entries_by_parent, by_date):
        def assert_day(date, status, reason):
            # The approval fields come from the parent Timesheet, so every entry
            # under that Timesheet must carry the same values.
            entries = entries_by_parent[by_date[date].name]
            self.assertTrue(entries, f"expected at least one time entry for {date}")
            for entry in entries:
                self.assertEqual(entry["custom_approval_status"], status)
                self.assertEqual(entry["custom_rejection_reason"], reason)

        # A rejected timesheet surfaces its rejection reason.
        assert_day(TUE, "Rejected", TUE_REASON)
        # An approved timesheet has no rejection reason.
        assert_day(WED, "Approved", None)
        # A pending timesheet was never rejected, so it has no reason either.
        for date in (MON, THU, FRI):
            assert_day(date, "Approval Pending", None)

    def test_endpoints_expose_parent_approval_fields(self):
        # Reject Tuesday (with a reason) and approve Wednesday; the rest stay pending.
        self.decide_timesheets("Rejected", [TUE], note=TUE_REASON)
        self.decide_timesheets("Approved", [WED])
        # by_date maps each date -> its Timesheet row, so by_date[TUE].name is the
        # parent name we look each entry up by.
        by_date = self.get_timesheets_by_date()

        # get_timesheet_data returns data[week]["tasks"][task]["data"][...]
        personal = get_timesheet_data(employee=self.employee, start_date=MON, max_week=1)
        self.assert_entries_carry_fields(self.collect_entries_by_parent(personal["data"]), by_date)

        # get_team_timesheet_data is single-week now: the member row carries its tasks
        # directly, instead of a timesheet_details map keyed by week.
        team = get_team_timesheet_data(start_date=MON, reports_to=self.manager)
        member = next(m for m in team["members"] if m["employee"] == self.employee)
        self.assert_entries_carry_fields(self.collect_entries_by_parent({MON: {"tasks": member["tasks"]}}), by_date)

    def test_reject_resubmit_approve_lifecycle(self):
        # Step 1 (done in setUp): all 5 days pending, no rejection reason yet.
        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assertEqual(by_date[date].custom_rejection_reason or "", "")
            self.assertEqual(by_date[date].docstatus, 0)

        # Step 2: reject Tuesday and Thursday, each with its own reason.
        self.decide_timesheets("Rejected", [TUE], note=TUE_REASON)
        self.decide_timesheets("Rejected", [THU], note=THU_REASON)

        by_date = self.get_timesheets_by_date()
        self.assertEqual(by_date[TUE].custom_approval_status, "Rejected")
        self.assertEqual(by_date[TUE].custom_rejection_reason, TUE_REASON)
        self.assertEqual(by_date[THU].custom_approval_status, "Rejected")
        self.assertEqual(by_date[THU].custom_rejection_reason, THU_REASON)
        for date in (MON, WED, FRI):
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assertEqual(by_date[date].custom_rejection_reason or "", "")

        # Step 3: employee fixes things and resubmits the whole week. Status resets
        # to pending, but the rejection reason is kept until the day is re-decided.
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assertEqual(by_date[date].docstatus, 0)
        self.assertEqual(by_date[TUE].custom_rejection_reason, TUE_REASON)
        self.assertEqual(by_date[THU].custom_rejection_reason, THU_REASON)

        # Step 4: manager approves the whole week; reasons are cleared on approval.
        self.decide_timesheets("Approved", WEEK_DATES)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approved")
            self.assertEqual(by_date[date].docstatus, 1)
            self.assertEqual(by_date[date].custom_rejection_reason or "", "")
