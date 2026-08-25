from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, formatdate, get_first_day_of_week, getdate, nowdate

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.team import (
    _approve_or_reject_timesheet,
    approve_or_reject_timesheet,
)
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.timesheet import submit_for_approval
from next_pms.timesheet.api.utils import get_holidays
from next_pms.timesheet.doc_events.timesheet import (
    get_backdate_restriction_boundary,
    get_date_restriction_message,
)

MANAGER_USER = "backdated-guard-test-manager@example.com"
EMPLOYEE_USER = "backdated-guard-test-employee@example.com"

PROJECT_NAME = "Backdated Guard Test Project"
TASK_SUBJECT = "Backdated Guard Test Task"

MANAGER_ROLES = ["Projects Manager", "Timesheet Manager"]
EXEMPT_ROLE = "Backdated Guard Test Exempt Role"
BACKDATED_DAYS_ALLOWED = 5


class TestBackdatedApprovalGuard(IntegrationTestCase):
    """A week older than the backdated-entry limit must be refused up front.

    Before the guard, `approve_or_reject_timesheet` parked every selected day in
    "Processing Timesheet", committed, and only then enqueued the job that saves each
    document - where `validate_dates` threw. The commit survived the job's rollback, so the
    week was stuck in a status the UI treats as read-only, with nothing left to act on it.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        cls.previous_first_day = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")

        cls.previous_settings = {
            field: frappe.db.get_single_value("Timesheet Settings", field)
            for field in ("allow_backdated_entries", "allow_backdated_entries_till_manager", "allow_future_entries")
        }

        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER, company=cls.company, reports_to=cls.manager, leave_approver="Administrator"
        )
        manager_user = frappe.get_doc("User", MANAGER_USER)
        manager_user.add_roles(*MANAGER_ROLES)

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

        cls.restricted_week = get_first_day_of_week(add_days(getdate(nowdate()), -63))
        cls.restricted_dates = [str(add_days(cls.restricted_week, offset)) for offset in range(3)]
        cls.current_week = get_first_day_of_week(nowdate())

        # The exemption test needs a role in Timesheet Settings' Ignored Role table. It uses a
        # role of its own rather than one of the manager's real ones, so cleanup can target it
        # exactly and never touch whatever exemptions the site legitimately configures.
        if not frappe.db.exists("Role", EXEMPT_ROLE):
            frappe.get_doc({"doctype": "Role", "role_name": EXEMPT_ROLE}).insert(ignore_permissions=True)
        manager_user.add_roles(EXEMPT_ROLE)

        frappe.clear_cache()
        get_holidays.clear_cache()

    @classmethod
    def tearDownClass(cls):
        cls.drop_added_ignored_roles()
        for field, value in cls.previous_settings.items():
            frappe.db.set_single_value("Timesheet Settings", field, value)
        # These tests exercise paths that commit, so a site-wide default set here would
        # otherwise outlive the run and follow every later test.
        frappe.db.set_default("first_day_of_the_week", cls.previous_first_day)
        frappe.db.commit()  # nosemgrep settings live outside the per-test transaction
        super().tearDownClass()

    @classmethod
    def drop_added_ignored_roles(cls):
        """Timesheet Settings is a Single and the approval job commits, so the exemption one
        test adds can outlive its rollback and silently exempt every later test."""
        if frappe.db.exists("Timesheet Role", {"role": EXEMPT_ROLE}):
            frappe.db.delete("Timesheet Role", {"role": EXEMPT_ROLE})
            frappe.clear_document_cache("Timesheet Settings", "Timesheet Settings")

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        # Written per test, not in setUpClass: the per-test rollback would otherwise undo them.
        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries", 1)
        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries_till_manager", BACKDATED_DAYS_ALLOWED)
        frappe.db.set_single_value("Timesheet Settings", "allow_future_entries", 1)
        self.drop_added_ignored_roles()
        self.delete_test_timesheets()

    def tearDown(self):
        self.delete_test_timesheets()
        frappe.set_user("Administrator")
        super().tearDown()

    def delete_test_timesheets(self):
        # The approval API and its job both commit, so a previous run's rows can survive a
        # rollback. Start every test from a clean slate.
        for name in frappe.get_all("Timesheet", filters={"employee": self.employee}, pluck="name"):
            doc = frappe.get_doc("Timesheet", name)
            if doc.docstatus == 1:
                doc.cancel()
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True)

    def make_pending_week(self, dates):
        """Log a day per date and put the week in front of the reviewer.

        Runs as Administrator, who is exempt from the backdate check - the same way a week
        that was legitimately filled while the limit was wider ends up on record.
        """
        for date in dates:
            save_timesheet(
                date=date,
                description=f"Work logged on {date}",
                task=self.task,
                hours=2,
                employee=self.employee,
            )
        submit_for_approval(start_date=dates[0], employee=self.employee, approver=self.manager)

    def statuses_by_date(self):
        rows = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "docstatus": ["<", 2]},
            fields=["name", "start_date", "custom_approval_status", "custom_weekly_approval_status"],
        )
        return {str(row.start_date): row for row in rows}

    def test_restricted_week_is_refused_with_nothing_written(self):
        self.make_pending_week(self.restricted_dates)
        before = self.statuses_by_date()

        frappe.set_user(MANAGER_USER)
        with self.assertRaises(frappe.ValidationError):
            approve_or_reject_timesheet(
                employee=self.employee, status="Rejected", dates=self.restricted_dates, note="too old"
            )
        frappe.set_user("Administrator")

        after = self.statuses_by_date()
        self.assertEqual(len(after), len(self.restricted_dates))
        for date, row in after.items():
            self.assertNotEqual(row.custom_approval_status, "Processing Timesheet")
            self.assertNotEqual(row.custom_weekly_approval_status, "Processing Timesheet")
            self.assertEqual(row.custom_approval_status, before[date].custom_approval_status)
            self.assertEqual(row.custom_weekly_approval_status, before[date].custom_weekly_approval_status)

    def test_refusal_message_names_the_earliest_allowed_date(self):
        """A bare "not allowed" leaves the reviewer with no idea what to change."""
        frappe.set_user(MANAGER_USER)
        boundary = getdate(get_backdate_restriction_boundary(self.employee))
        message = get_date_restriction_message(self.employee, self.restricted_dates)
        frappe.set_user("Administrator")

        # The exact boundary depends on the employee's holidays and leave; what matters is
        # that it sits between the week being refused and today, and that it is spelled out.
        self.assertGreater(boundary, getdate(self.restricted_dates[-1]))
        self.assertLessEqual(boundary, getdate(nowdate()))
        self.assertIsNotNone(message)
        self.assertIn(formatdate(boundary), message)

    def test_week_inside_the_limit_is_still_accepted(self):
        dates = [str(add_days(self.current_week, offset)) for offset in range(2)]
        self.make_pending_week(dates)

        frappe.set_user(MANAGER_USER)
        approve_or_reject_timesheet(employee=self.employee, status="Rejected", dates=dates, note="fix these")
        frappe.set_user("Administrator")

        for date, row in self.statuses_by_date().items():
            self.assertEqual(row.custom_approval_status, "Processing Timesheet", f"{date} was not queued")

    def test_exempt_role_is_not_blocked(self):
        settings = frappe.get_single("Timesheet Settings")
        settings.append("ignored_role", {"role": EXEMPT_ROLE})
        settings.save()

        frappe.set_user(MANAGER_USER)
        message = get_date_restriction_message(self.employee, self.restricted_dates)
        frappe.set_user("Administrator")

        self.assertIsNone(message)

    def run_failing_job(self, payload):
        """Drive the job down its failure path - the week is older than the limit, so every
        save throws. The mail it sends on the way out needs a built assets.json the CI runner
        has no reason to produce, and it is not what these tests are about.
        """
        frappe.set_user(MANAGER_USER)
        with patch("next_pms.timesheet.api.team.sendmail"):
            _approve_or_reject_timesheet(
                timesheets=payload,
                status="Rejected",
                employee=self.employee,
                dates=self.restricted_dates,
                note="too old",
            )
        frappe.set_user("Administrator")

    def park(self, names):
        for name in names:
            frappe.db.set_value(
                "Timesheet",
                name,
                {
                    "custom_approval_status": "Processing Timesheet",
                    "custom_weekly_approval_status": "Processing Timesheet",
                },
            )
        # The API commits the parking write before enqueueing; the job starts its own
        # transaction, which only works from a clean one.
        frappe.db.commit()  # nosemgrep mirrors the commit the API makes before enqueueing

    def draft_payload(self):
        return frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "docstatus": 0},
            fields=["name", "start_date", "employee", "custom_approval_status"],
            order_by="start_date",
        )

    def test_restore_leaves_a_concurrent_runs_result_alone(self):
        """Two requests can park the same day. If the other one finishes first, its result is
        newer than anything this job captured - re-parking or reverting it would be the very
        dead-end this whole fix is about."""
        self.make_pending_week(self.restricted_dates)
        payload = self.draft_payload()
        self.park([row.name for row in payload])

        # The concurrent run finished this one day while this job was still in flight.
        decided = payload[0]
        frappe.db.set_value("Timesheet", decided.name, "custom_approval_status", "Rejected")
        frappe.db.commit()  # nosemgrep the concurrent run would have committed its own result

        self.run_failing_job(payload)

        rows = {row.name: row for row in self.statuses_by_date().values()}
        self.assertEqual(rows[decided.name].custom_approval_status, "Rejected")
        for row in payload[1:]:
            self.assertEqual(rows[row.name].custom_approval_status, "Approval Pending")

    def test_a_captured_processing_status_is_not_written_back(self):
        """A row parked twice captures "Processing Timesheet" as its own prior status. Writing
        that back would leave the week parked forever."""
        self.make_pending_week(self.restricted_dates)
        payload = self.draft_payload()
        self.park([row.name for row in payload])
        # Re-read after parking: this is the payload a second request would capture.
        stale_payload = self.draft_payload()
        self.assertEqual({row.custom_approval_status for row in stale_payload}, {"Processing Timesheet"})

        self.run_failing_job(stale_payload)

        for date, row in self.statuses_by_date().items():
            self.assertEqual(row.custom_approval_status, "Approval Pending", f"{date} stayed parked")

    def test_failed_job_restores_the_status_it_parked(self):
        self.make_pending_week(self.restricted_dates)
        before = self.statuses_by_date()

        # Park the rows the way the API does, then let the job fail on the backdate check.
        payload = self.draft_payload()
        self.park([row.name for row in payload])

        self.run_failing_job(payload)

        for date, row in self.statuses_by_date().items():
            self.assertEqual(row.custom_approval_status, before[date].custom_approval_status)
            self.assertNotEqual(row.custom_weekly_approval_status, "Processing Timesheet")
