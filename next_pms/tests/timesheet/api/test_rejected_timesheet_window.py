import json
from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, get_first_day_of_week, getdate, today

from next_pms.setup import install_custom_fields
from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.project import get_project_timesheet_data
from next_pms.timesheet.api.team import (
    _approve_or_reject_timesheet,
    approve_or_reject_timesheet,
    get_team_timesheet_data,
)
from next_pms.timesheet.api.timesheet import delete as delete_time_entry
from next_pms.timesheet.api.timesheet import get_timesheet_data, submit_for_approval, update_timesheet_detail
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays
from next_pms.timesheet.doc_events.timesheet import get_date_access, get_date_restriction_message

MANAGER_USER = "rejected-window-test-manager@example.com"
EMPLOYEE_USER = "rejected-window-test-employee@example.com"
OTHER_EMPLOYEE_USER = "rejected-window-test-other@example.com"
MANAGER_ROLES = ["Projects Manager", "Timesheet Manager"]

PROJECT_A = "Rejected Window Test Project A"
PROJECT_B = "Rejected Window Test Project B"
TASK_A1 = "Rejected Window Test Task A1"
TASK_A2 = "Rejected Window Test Task A2"
TASK_B1 = "Rejected Window Test Task B1"

EMPLOYEE_DAYS = 2
MANAGER_DAYS = 5
WINDOW_DAYS = 3

SETTINGS = (
    "allow_backdated_entries",
    "allow_backdated_entries_till_employee",
    "allow_backdated_entries_till_manager",
    "allow_future_entries",
    "allow_rejected_timesheet_edit_till",
)


class TestRejectedTimesheetWindow(IntegrationTestCase):
    """A rejected day stays correctable - by the employee, and reviewable by the reviewer - for
    allow_rejected_timesheet_edit_till working days after the rejection, even when the day is
    older than the backdated-entry limit (#2057). Everything else keeps the normal limits.

    The calendar is pinned to "no holidays" so the working-day maths is exact whatever weekday
    the suite runs on; tests that need a holiday or leave patch one in.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        install_custom_fields()
        company = get_default_company()

        cls.previous_first_day = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")
        cls.previous_settings = {field: frappe.db.get_single_value("Timesheet Settings", field) for field in SETTINGS}

        cls.manager = make_employee(MANAGER_USER, company=company, leave_approver="Administrator")
        frappe.get_doc("User", MANAGER_USER).add_roles(*MANAGER_ROLES)
        cls.employee = make_employee(
            EMPLOYEE_USER, company=company, reports_to=cls.manager, leave_approver="Administrator"
        )
        cls.other_employee = make_employee(
            OTHER_EMPLOYEE_USER, company=company, reports_to=cls.manager, leave_approver="Administrator"
        )

        cls.project_a = cls.make_project(PROJECT_A, company)
        cls.project_b = cls.make_project(PROJECT_B, company)
        cls.task_a1 = cls.make_task(TASK_A1, cls.project_a)
        cls.task_a2 = cls.make_task(TASK_A2, cls.project_a)
        cls.task_b1 = cls.make_task(TASK_B1, cls.project_b)

        cls.today = getdate(today())
        # Two days of one week well past both limits, so a single submission covers them.
        week_start = getdate(get_first_day_of_week(add_days(cls.today, -14)))
        cls.old_day = str(add_days(week_start, 1))
        cls.other_old_day = str(add_days(week_start, 2))

        frappe.clear_cache()
        get_holidays.clear_cache()

    @classmethod
    def tearDownClass(cls):
        for field, value in cls.previous_settings.items():
            frappe.db.set_single_value("Timesheet Settings", field, value)
        frappe.db.set_default("first_day_of_the_week", cls.previous_first_day)
        frappe.db.commit()  # nosemgrep the approval job commits, so settings outlive the rollback
        super().tearDownClass()

    @classmethod
    def make_project(cls, name, company):
        if not frappe.db.exists("Project", {"project_name": name}):
            frappe.get_doc(
                {"doctype": "Project", "project_name": name, "company": company, "custom_billing_type": "Non-Billable"}
            ).insert(ignore_permissions=True)
        return frappe.db.get_value("Project", {"project_name": name})

    @classmethod
    def make_task(cls, subject, project):
        if not frappe.db.exists("Task", {"subject": subject}):
            frappe.get_doc({"doctype": "Task", "subject": subject, "project": project}).insert(ignore_permissions=True)
        return frappe.db.get_value("Task", {"subject": subject})

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        self.set_settings(
            allow_backdated_entries=1,
            allow_backdated_entries_till_employee=EMPLOYEE_DAYS,
            allow_backdated_entries_till_manager=MANAGER_DAYS,
            allow_future_entries=0,
            allow_rejected_timesheet_edit_till=WINDOW_DAYS,
        )
        self.pin_calendar()
        self.delete_test_timesheets()

        # An old day the reviewer sent back today, and an old day that was never rejected.
        self.log(self.old_day, self.task_a1, 2, "Logged against the wrong task")
        self.log(self.other_old_day, self.task_a1, 3, "Never rejected")
        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)
        self.reject(self.old_day)

    def tearDown(self):
        frappe.set_user("Administrator")
        self.delete_test_timesheets()
        super().tearDown()

    # -- helpers -----------------------------------------------------------

    def set_settings(self, **values):
        for field, value in values.items():
            frappe.db.set_single_value("Timesheet Settings", field, value)

    def pin_calendar(self):
        """No holidays or leave unless a test adds them to self.holidays / self.leaves."""
        self.holidays = {}
        self.leaves = []
        for patcher in (
            patch(
                "next_pms.timesheet.api.utils.get_holiday_dates_by_employee",
                side_effect=lambda employees, *_args, **_kwargs: {e: self.holidays.get(e, []) for e in employees},
            ),
            patch(
                "next_pms.resource_management.api.utils.query.get_employee_leaves",
                side_effect=lambda *_args, **_kwargs: list(self.leaves),
            ),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    def delete_test_timesheets(self):
        # The approval job commits, so rows from an earlier test can outlive the rollback.
        for name in frappe.get_all(
            "Timesheet", filters={"employee": ["in", [self.employee, self.other_employee]]}, pluck="name"
        ):
            doc = frappe.get_doc("Timesheet", name)
            if doc.docstatus == 1:
                doc.cancel()
            frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True, ignore_on_trash=True)

    def log(self, date, task, hours, description, employee=None):
        save_timesheet(
            date=str(date), description=description, task=task, hours=hours, employee=employee or self.employee
        )

    def log_as_employee(self, date, task, hours=1, description="Correction"):
        frappe.set_user(EMPLOYEE_USER)
        try:
            save_timesheet(date=str(date), description=description, task=task, hours=hours)
        finally:
            frappe.set_user("Administrator")

    def reject(self, date, project=None):
        """Reject a day as Administrator, through the same doc events the approval job runs."""
        doc = frappe.get_doc("Timesheet", self.parent(date, project or self.project_a).name)
        doc.custom_approval_status = "Rejected"
        doc.save()

    def parent(self, date, project=None):
        return frappe.db.get_value(
            "Timesheet",
            {
                "employee": self.employee,
                "start_date": str(date),
                "parent_project": project or self.project_a,
                "docstatus": ["!=", 2],
            },
            ["name", "docstatus", "custom_approval_status", "custom_rejected_on"],
            as_dict=True,
        )

    def rejected_on(self, date, days_ago):
        frappe.db.set_value("Timesheet", self.parent(date).name, "custom_rejected_on", add_days(self.today, -days_ago))

    def correction_row(self, date):
        return frappe.db.get_value(
            "Timesheet Detail",
            {"parent": self.parent(date).name, "description": "Correction"},
            ["name", "parent", "task", "hours"],
            as_dict=True,
        )

    def review(self, status, dates):
        """Run the reviewer's request and the job it queues, as the manager."""
        frappe.set_user(MANAGER_USER)
        try:
            with patch("next_pms.timesheet.api.team.enqueue"):
                approve_or_reject_timesheet(
                    employee=self.employee, status=status, dates=[str(d) for d in dates], note="review"
                )
            self.run_job(status, dates)
        finally:
            frappe.set_user("Administrator")

    def run_job(self, status, dates):
        drafts = frappe.get_all(
            "Timesheet",
            filters={"employee": self.employee, "docstatus": 0},
            fields=["name", "start_date", "employee", "custom_approval_status"],
        )
        # The API commits before enqueueing; the job opens its own transaction from a clean one.
        frappe.db.commit()  # nosemgrep mirrors the commit the API makes before enqueueing
        with patch("next_pms.timesheet.api.team.sendmail"), patch("next_pms.timesheet.api.team.enqueue"):
            _approve_or_reject_timesheet(
                timesheets=drafts, status=status, employee=self.employee, dates=[str(d) for d in dates], note="review"
            )

    def personal_week(self):
        weeks = get_timesheet_data(employee=self.employee, start_date=str(self.old_day), max_week=1)["data"]
        return next(iter(weeks.values()))

    # -- the rejection opens the window --------------------------------------

    def test_rejection_stamps_the_rejection_date(self):
        self.assertEqual(self.parent(self.old_day).custom_rejected_on, self.today)

    def test_rejecting_again_restarts_the_window(self):
        self.rejected_on(self.old_day, 20)
        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)
        self.reject(self.old_day)
        self.assertEqual(self.parent(self.old_day).custom_rejected_on, self.today)

    def test_a_rejection_date_sent_with_a_save_is_ignored(self):
        recent_day = add_days(self.today, -1)
        self.log(recent_day, self.task_a1, 1, "Inside the limit")
        forged = add_days(self.today, 365)

        frappe.set_user(EMPLOYEE_USER)
        try:
            for day in (recent_day, self.old_day):
                doc = frappe.get_doc("Timesheet", self.parent(day).name)
                doc.custom_rejected_on = forged
                doc.save(ignore_permissions=True)
        finally:
            frappe.set_user("Administrator")

        self.assertIsNone(self.parent(recent_day).custom_rejected_on)
        self.assertEqual(self.parent(self.old_day).custom_rejected_on, self.today)

    # -- employee corrections -------------------------------------------------

    def test_employee_can_log_a_correction_on_a_rejected_day_past_the_limit(self):
        self.log_as_employee(self.old_day, self.task_a2)
        self.assertIsNotNone(self.correction_row(self.old_day))

    def test_employee_can_log_the_correction_on_another_project(self):
        self.log_as_employee(self.old_day, self.task_b1)
        self.assertIsNotNone(self.parent(self.old_day, self.project_b))

    def test_employee_can_edit_and_delete_the_correction(self):
        self.log_as_employee(self.old_day, self.task_a2)
        row = self.correction_row(self.old_day)

        frappe.set_user(EMPLOYEE_USER)
        update_timesheet_detail(
            name=row.name, parent=row.parent, hours=4, description="Correction", task=row.task, date=str(self.old_day)
        )
        self.assertEqual(self.correction_row(self.old_day).hours, 4)
        delete_time_entry(parent=row.parent, name=row.name)
        frappe.set_user("Administrator")

        self.assertIsNone(self.correction_row(self.old_day))

    def test_rejected_rows_stay_locked_inside_the_window(self):
        self.log_as_employee(self.old_day, self.task_a2)
        rejected = frappe.db.get_value(
            "Timesheet Detail", {"parent": self.parent(self.old_day).name, "rejected_hours": [">", 0]}, "name"
        )

        frappe.set_user(EMPLOYEE_USER)
        with self.assertRaisesRegex(frappe.ValidationError, "Rejected time entries cannot be changed"):
            update_timesheet_detail(
                name=rejected,
                parent=self.parent(self.old_day).name,
                hours=8,
                description="Rewritten",
                task=self.task_a1,
                date=str(self.old_day),
            )

    def test_other_old_days_stay_locked(self):
        self.log_as_employee(self.old_day, self.task_a2)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            self.log_as_employee(self.other_old_day, self.task_a2)

    def test_window_counts_working_days_and_then_closes(self):
        self.rejected_on(self.old_day, WINDOW_DAYS)
        self.log_as_employee(self.old_day, self.task_a2)

        self.rejected_on(self.old_day, WINDOW_DAYS + 1)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            self.log_as_employee(self.old_day, self.task_b1)

    def test_holidays_inside_the_window_are_not_counted(self):
        self.holidays[self.employee] = [str(add_days(self.today, -1))]
        self.rejected_on(self.old_day, WINDOW_DAYS + 1)
        self.log_as_employee(self.old_day, self.task_a2)

    def test_leave_inside_the_window_is_not_counted(self):
        self.leaves.append(
            frappe._dict(employee=self.employee, from_date=add_days(self.today, -2), to_date=add_days(self.today, -1))
        )
        self.rejected_on(self.old_day, WINDOW_DAYS + 2)
        self.log_as_employee(self.old_day, self.task_a2)

    def test_rejecting_on_a_holiday_adds_no_day(self):
        self.holidays[self.employee] = [str(add_days(self.today, -(WINDOW_DAYS + 1)))]
        self.rejected_on(self.old_day, WINDOW_DAYS + 1)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            self.log_as_employee(self.old_day, self.task_a2)

    def test_zero_turns_the_window_off(self):
        self.set_settings(allow_rejected_timesheet_edit_till=0)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            self.log_as_employee(self.old_day, self.task_a2)

        self.set_settings(allow_rejected_timesheet_edit_till=WINDOW_DAYS)
        self.log_as_employee(self.old_day, self.task_a2)

    def test_window_holds_when_backdated_entries_are_disabled(self):
        self.set_settings(allow_backdated_entries=0)
        self.log_as_employee(self.old_day, self.task_a2)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            self.log_as_employee(self.other_old_day, self.task_a2)

    def test_closed_window_never_locks_a_day_inside_the_limit(self):
        recent_day = add_days(self.today, -1)
        self.log(recent_day, self.task_a1, 1, "Inside the limit")
        self.reject(recent_day)
        frappe.db.set_value("Timesheet", self.parent(recent_day).name, "custom_rejected_on", add_days(self.today, -30))

        self.log_as_employee(recent_day, self.task_a2)
        self.log_as_employee(self.old_day, self.task_a2)

    # -- reviewer decisions -----------------------------------------------------

    def test_reviewer_can_approve_a_resubmitted_rejected_day_past_their_limit(self):
        self.log_as_employee(self.old_day, self.task_a2)
        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)

        self.review("Approved", [self.old_day])

        self.assertEqual(self.parent(self.old_day).docstatus, 1)

    def test_reviewer_can_approve_the_correction_logged_on_another_project(self):
        self.log_as_employee(self.old_day, self.task_b1)
        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)

        self.review("Approved", [self.old_day])

        self.assertEqual(self.parent(self.old_day, self.project_a).docstatus, 1)
        self.assertEqual(self.parent(self.old_day, self.project_b).docstatus, 1)

    def test_reviewer_is_still_refused_for_other_old_days(self):
        frappe.set_user(MANAGER_USER)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            approve_or_reject_timesheet(
                employee=self.employee, status="Approved", dates=[str(self.other_old_day)], note=""
            )
        frappe.set_user("Administrator")
        self.assertEqual(self.parent(self.other_old_day).custom_approval_status, "Approval Pending")

        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)
        self.review("Approved", [self.old_day])
        self.assertEqual(self.parent(self.old_day).docstatus, 1)

    def test_reviewer_is_refused_once_the_window_has_closed(self):
        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)
        self.rejected_on(self.old_day, WINDOW_DAYS + 1)

        frappe.set_user(MANAGER_USER)
        with self.assertRaisesRegex(frappe.ValidationError, "Backdated time entries are not allowed"):
            approve_or_reject_timesheet(employee=self.employee, status="Approved", dates=[str(self.old_day)], note="")
        frappe.set_user("Administrator")
        self.assertEqual(self.parent(self.old_day).custom_approval_status, "Approval Pending")

        self.rejected_on(self.old_day, WINDOW_DAYS)
        self.review("Approved", [self.old_day])
        self.assertEqual(self.parent(self.old_day).docstatus, 1)

    def test_a_rejection_cannot_unlock_the_day_it_rejects(self):
        """The job stamps rejected_on before validating, so the check must read the stored value -
        otherwise a reviewer could reject a day outside their own limit."""
        frappe.set_user(MANAGER_USER)
        self.run_job("Rejected", [self.other_old_day])
        frappe.set_user("Administrator")

        never_rejected = self.parent(self.other_old_day)
        self.assertEqual(never_rejected.custom_approval_status, "Approval Pending")
        self.assertIsNone(never_rejected.custom_rejected_on)

        submit_for_approval(start_date=self.old_day, employee=self.employee, approver=self.manager)
        self.review("Rejected", [self.old_day])
        self.assertEqual(self.parent(self.old_day).custom_approval_status, "Rejected")

    # -- what the pages read --------------------------------------------------

    def test_personal_week_lists_unlocked_days_outside_the_cache(self):
        frappe.set_user(EMPLOYEE_USER)
        week = self.personal_week()
        self.assertEqual(week["rejection_unlocked_dates"], [str(self.old_day)])

        # Closing the window writes nothing that would flush the cached week.
        frappe.set_user("Administrator")
        self.rejected_on(self.old_day, WINDOW_DAYS + 1)
        frappe.set_user(EMPLOYEE_USER)
        week = self.personal_week()
        frappe.set_user("Administrator")
        self.assertEqual(week["rejection_unlocked_dates"], [])

    def test_team_member_lists_unlocked_days(self):
        frappe.set_user(MANAGER_USER)
        res = get_team_timesheet_data(start_date=str(self.old_day), reports_to=self.manager)
        frappe.set_user("Administrator")
        members = {member["employee"]: member for member in res["members"]}

        self.assertEqual(members[self.employee]["rejection_unlocked_dates"], [str(self.old_day)])

    def test_unlocked_days_do_not_depend_on_the_viewer(self):
        """Pages built while the reviewer saves are broadcast to the employee, so a writer who is
        exempt, or whose own limit still covers the day, must still send the employee's unlock."""
        recent_day = add_days(self.today, -(EMPLOYEE_DAYS + 2))
        self.log(recent_day, self.task_a1, 1, "Past the employee's limit only")
        self.reject(recent_day)

        weeks = get_timesheet_data(employee=self.employee, start_date=str(recent_day), max_week=1)["data"]
        frappe.set_user(MANAGER_USER)
        try:
            res = get_team_timesheet_data(start_date=str(recent_day), reports_to=self.manager)
        finally:
            frappe.set_user("Administrator")
        member = next(member for member in res["members"] if member["employee"] == self.employee)

        self.assertIn(str(recent_day), next(iter(weeks.values()))["rejection_unlocked_dates"])
        self.assertIn(str(recent_day), member["rejection_unlocked_dates"])

    def test_project_member_lists_unlocked_days(self):
        frappe.set_user(MANAGER_USER)
        res = get_project_timesheet_data(
            start_date=str(self.old_day), filters=json.dumps([["Task", "project", "in", [self.project_a]]])
        )
        frappe.set_user("Administrator")
        members = [
            member
            for project in res["projects"]
            for member in project["members"]
            if member["employee"] == self.employee
        ]

        self.assertTrue(members, "the fixture employee is missing from the project page")
        for member in members:
            self.assertEqual(member["rejection_unlocked_dates"], [str(self.old_day)])

    def test_rejection_lookup_is_one_query_and_only_past_the_limit(self):
        self.log(self.old_day, self.task_a1, 1, "Other employee", employee=self.other_employee)
        frappe.set_user(MANAGER_USER)
        with patch.object(frappe, "get_all", wraps=frappe.get_all) as get_all:
            self.assertIsNone(get_date_restriction_message(self.employee, [add_days(self.today, -1)]))
            inside_limit = [call for call in get_all.call_args_list if call.args[:1] == ("Timesheet",)]

            access = get_date_access([self.employee, self.other_employee], self.old_day, self.today)
            batched = [call for call in get_all.call_args_list if call.args[:1] == ("Timesheet",)]
        frappe.set_user("Administrator")

        self.assertEqual(inside_limit, [])
        self.assertEqual(len(batched), 1)
        self.assertEqual(access[self.employee][1], [str(self.old_day)])
        self.assertEqual(access[self.other_employee][1], [])
