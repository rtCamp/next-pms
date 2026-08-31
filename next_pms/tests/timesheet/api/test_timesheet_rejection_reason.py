from collections import defaultdict

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.install import (
    setup_timesheet_rejection_reason_field,
    setup_timesheet_weekly_rejection_reason_field,
)
from next_pms.tests.utils import make_employee, make_holiday_list
from next_pms.timesheet.api.team import _approve_or_reject_timesheet, get_team_timesheet_data
from next_pms.timesheet.api.timesheet import get_timesheet_data, submit_for_approval
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays

MANAGER_USER = "rejection-reason-test-manager@example.com"
EMPLOYEE_USER = "rejection-reason-test-employee@example.com"

CUSTOMER_NAME = "Rejection Reason Test Customer"
PROJECT_NAME = "Rejection Reason Test Project"
TASK_SUBJECT = "Rejection Reason Test Task"
HOLIDAY_LIST = "Rejection Reason Test Holiday List"

MON, TUE, WED, THU, FRI = "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"
WEEK_DATES = [MON, TUE, WED, THU, FRI]

TUE_REASON = "Please add a task breakdown before resubmitting Tuesday's entry."
THU_REASON = "Thursday's hours need the billable split corrected."
WEEK_REASON = "Please rework the entire week's entries before resubmitting."
DAY_REASONS = {
    MON: "Monday needs a clearer description.",
    TUE: TUE_REASON,
    WED: "Wednesday hours look duplicated.",
    THU: THU_REASON,
    FRI: "Friday is missing the client reference.",
}


class TestTimesheetRejectionReason(IntegrationTestCase):
    """Reject two days of a submitted week, resubmit, then approve the whole week."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        currency = frappe.get_cached_value("Company", cls.company, "default_currency")

        # Week start is read via frappe.db.get_default, not System Settings directly.
        frappe.db.set_default("first_day_of_the_week", "Monday")

        setup_timesheet_rejection_reason_field()
        setup_timesheet_weekly_rejection_reason_field()

        weekends = []
        date = getdate("2026-01-01")
        while date <= getdate("2026-12-31"):
            if date.weekday() >= 5:
                weekends.append(
                    {
                        "holiday_date": date,
                        "description": date.strftime("%A"),
                        "weekly_off": 1,
                    }
                )
            date = add_days(date, 1)

        # Sat/Sun weekly offs so a 5-day reject/approve can become a full-week status.
        holiday_list = make_holiday_list(
            HOLIDAY_LIST, from_date="2026-01-01", to_date="2026-12-31", holiday_dates=weekends
        )

        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER, company=cls.company, reports_to=cls.manager, leave_approver="Administrator"
        )

        if not frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": cls.employee, "from_date": "2026-01-01", "docstatus": 1},
        ):
            frappe.get_doc(
                {
                    "doctype": "Holiday List Assignment",
                    "applicable_for": "Employee",
                    "assigned_to": cls.employee,
                    "holiday_list": holiday_list.name,
                    "from_date": "2026-01-01",
                }
            ).insert(ignore_permissions=True).submit()

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
        get_holidays.clear_cache()

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
            fields=[
                "name",
                "start_date",
                "custom_approval_status",
                "custom_weekly_approval_status",
                "custom_weekly_rejection_reason",
                "docstatus",
            ],
        )
        by_date = {str(row.start_date): row for row in rows}
        self.assertEqual(len(by_date), 5, "expected exactly 5 daily timesheets for the test week")
        return by_date

    def assert_day_row_reasons(self, by_date, date, reason):
        """Every Timesheet Detail row of the day carries the same rejection reason."""
        rows = frappe.get_all(
            "Timesheet Detail",
            filters={"parent": by_date[date].name},
            pluck="custom_rejection_reason",
        )
        self.assertTrue(rows, f"expected at least one time entry for {date}")
        for value in rows:
            self.assertEqual(value or "", reason or "", f"unexpected row rejection reason on {date}")

    def assert_weekly_rejection_reason(self, by_date, expected_reasons):
        """Weekly reason is duplicated on every timesheet in the week."""
        expected = set(expected_reasons) if expected_reasons is not None else set()
        for date in WEEK_DATES:
            actual = {line for line in (by_date[date].custom_weekly_rejection_reason or "").split("\n") if line}
            self.assertEqual(actual, expected, f"unexpected weekly rejection reason on {date}")

    def assert_original_row_keeps_reason_and_new_row_does_not(self, rows, original_description, new_description):
        self.assertEqual(len(rows), 2, "expected the original row plus the post-reject row")
        by_description = {row["description"]: row["custom_rejection_reason"] or "" for row in rows}
        self.assertEqual(by_description[original_description], TUE_REASON)
        self.assertEqual(by_description[new_description], "")

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
            # The approval status comes from the parent Timesheet and the rejection
            # reason from each row; a day-level decision stamps every row alike, so
            # all entries under one Timesheet carry the same values.
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
            self.assert_day_row_reasons(by_date, date, None)
            self.assertEqual(by_date[date].docstatus, 0)

        # Step 2: reject Tuesday and Thursday, each with its own reason.
        self.decide_timesheets("Rejected", [TUE], note=TUE_REASON)
        self.decide_timesheets("Rejected", [THU], note=THU_REASON)

        by_date = self.get_timesheets_by_date()
        self.assertEqual(by_date[TUE].custom_approval_status, "Rejected")
        self.assert_day_row_reasons(by_date, TUE, TUE_REASON)
        self.assertEqual(by_date[THU].custom_approval_status, "Rejected")
        self.assert_day_row_reasons(by_date, THU, THU_REASON)
        for date in (MON, WED, FRI):
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assert_day_row_reasons(by_date, date, None)
        # Partial reject must not populate the weekly reason.
        self.assertEqual(by_date[MON].custom_weekly_approval_status, "Partially Rejected")
        self.assert_weekly_rejection_reason(by_date, None)

        # Step 3: employee fixes things and resubmits the whole week. Status resets
        # to pending, but the rejection reason is kept until the day is re-decided.
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assertEqual(by_date[date].docstatus, 0)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Approval Pending")
        self.assert_day_row_reasons(by_date, TUE, TUE_REASON)
        self.assert_day_row_reasons(by_date, THU, THU_REASON)
        self.assert_weekly_rejection_reason(by_date, None)

        # Step 4: manager approves the whole week; reasons are cleared on approval.
        self.decide_timesheets("Approved", WEEK_DATES)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approved")
            self.assertEqual(by_date[date].docstatus, 1)
            self.assert_day_row_reasons(by_date, date, None)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Approved")
        self.assert_weekly_rejection_reason(by_date, None)

    def test_full_week_reject_sets_shared_weekly_rejection_reason(self):
        self.decide_timesheets("Rejected", WEEK_DATES, note=WEEK_REASON)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Rejected")
            self.assert_day_row_reasons(by_date, date, WEEK_REASON)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Rejected")
        self.assert_weekly_rejection_reason(by_date, [WEEK_REASON])

    def test_distinct_day_reasons_combined_when_week_rejected(self):
        for date, reason in DAY_REASONS.items():
            self.decide_timesheets("Rejected", [date], note=reason)

        by_date = self.get_timesheets_by_date()
        for date, reason in DAY_REASONS.items():
            self.assertEqual(by_date[date].custom_approval_status, "Rejected")
            self.assert_day_row_reasons(by_date, date, reason)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Rejected")
        self.assert_weekly_rejection_reason(by_date, DAY_REASONS.values())

    def test_weekly_rejection_reason_cleared_when_leaving_rejected(self):
        self.decide_timesheets("Rejected", WEEK_DATES, note=WEEK_REASON)
        by_date = self.get_timesheets_by_date()
        self.assert_weekly_rejection_reason(by_date, [WEEK_REASON])

        # Resubmit moves the week off Rejected and clears the weekly reason, while
        # day-level reasons remain until each day is approved/rejected again.
        submit_for_approval(start_date=MON, employee=self.employee, approver=self.manager)

        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approval Pending")
            self.assert_day_row_reasons(by_date, date, WEEK_REASON)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Approval Pending")
        self.assert_weekly_rejection_reason(by_date, None)

        self.decide_timesheets("Approved", WEEK_DATES)
        by_date = self.get_timesheets_by_date()
        for date in WEEK_DATES:
            self.assertEqual(by_date[date].custom_approval_status, "Approved")
            self.assert_day_row_reasons(by_date, date, None)
            self.assertEqual(by_date[date].custom_weekly_approval_status, "Approved")
        self.assert_weekly_rejection_reason(by_date, None)

    def test_new_row_after_reject_does_not_inherit_rejection_reason(self):
        # setUp already logged one row per day and submitted the week.
        original_description = f"Work logged on {TUE}"
        new_description = "Follow-up work after rejection"

        self.decide_timesheets("Rejected", [TUE], note=TUE_REASON)
        by_date = self.get_timesheets_by_date()
        self.assertEqual(by_date[TUE].custom_approval_status, "Rejected")
        self.assert_day_row_reasons(by_date, TUE, TUE_REASON)

        save_timesheet(
            date=TUE,
            description=new_description,
            task=self.task,
            hours=1,
            employee=self.employee,
        )

        rows = frappe.get_all(
            "Timesheet Detail",
            filters={"parent": by_date[TUE].name},
            fields=["description", "custom_rejection_reason"],
        )
        self.assert_original_row_keeps_reason_and_new_row_does_not(rows, original_description, new_description)

        by_date = self.get_timesheets_by_date()
        self.assertEqual(by_date[TUE].custom_approval_status, "Rejected")

        personal = get_timesheet_data(employee=self.employee, start_date=MON, max_week=1)
        self.assert_original_row_keeps_reason_and_new_row_does_not(
            self.collect_entries_by_parent(personal["data"])[by_date[TUE].name],
            original_description,
            new_description,
        )

        team = get_team_timesheet_data(start_date=MON, reports_to=self.manager)
        member = next(m for m in team["members"] if m["employee"] == self.employee)
        self.assert_original_row_keeps_reason_and_new_row_does_not(
            self.collect_entries_by_parent({MON: {"tasks": member["tasks"]}})[by_date[TUE].name],
            original_description,
            new_description,
        )
