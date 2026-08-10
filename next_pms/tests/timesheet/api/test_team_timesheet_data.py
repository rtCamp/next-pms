import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.api.team import (
    get_team_timesheet_data,
    get_team_timesheet_member_week,
    get_team_timesheet_weeks,
)
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays, sanitize_employee_conditions
from next_pms.timesheet.doc_events.timesheet import publish_timesheet_update
from next_pms.timesheet.utils.constant import MAX_TEAM_TIMESHEET_PAGE_LENGTH

# build_aggregate_dates walks backward from `date`, so anchoring on the
# Monday of W2 yields exactly [W1, W2] = [06-15..06-21, 06-22..06-28] for
# max_week=2. Assumes Monday-start weeks; setUpClass pins that explicitly.
DATE = "2026-06-22"
W1_MON = "2026-06-15"
W1_TUE = "2026-06-16"
W1_WED = "2026-06-17"
W1_THU = "2026-06-18"
W2_MON = "2026-06-22"
# A week older than the [W1, W2] window, for the "are there more weeks" probe.
OLDER_MON = "2026-06-08"

WRITE_USER = "team.timesheet.write@example.com"

CUSTOMER_NAME = "Northwind Traders"
PROJECT_ALPHA_NAME = "Website Revamp"
PROJECT_BETA_NAME = "Mobile App Launch"
TASK_ALPHA_SUBJECT = "Implement login page"
TASK_BETA_SUBJECT = "Setup push notifications"
LEAVE_TYPE_NAME = "Unpaid Leave"
HOLIDAY_LIST_NAME = "Regional Holidays"
COMPANY_HOLIDAY_LIST_NAME = "Company Wide Holidays"

MANAGER_NAME = "Devika Rao"
R1_NAME = "Naveen Bhatt"
R2_NAME = "Sanya Kapoor"
R3_NAME = "Arjun Malhotra"
E1_NAME = "Farah Sheikh"
E2_NAME = "Ritu Bansal"


class _TeamTimesheetDataBase(IntegrationTestCase):
    """Shared fixtures for get_team_timesheet_data — regression net for the pagination refactor."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Timesheet Manager")

        # Week start is read via frappe.db.get_default, not System Settings
        # directly (frappe.db.set_single_value wouldn't take effect here).
        frappe.db.set_default("first_day_of_the_week", "Monday")

        # HRMS's leave-balance validation needs a holiday list resolvable for
        # every employee (employee-level or company fallback); a fresh site
        # has neither, so don't rely on ambient data.
        cls._ensure_company_holiday_list_assignment()

        cls.customer = cls._make_customer(CUSTOMER_NAME)
        cls.project_alpha = cls._make_project(PROJECT_ALPHA_NAME, cls.customer)
        cls.project_beta = cls._make_project(PROJECT_BETA_NAME, cls.customer)
        cls.task_alpha = cls._make_task(TASK_ALPHA_SUBJECT, cls.project_alpha)
        cls.task_beta = cls._make_task(TASK_BETA_SUBJECT, cls.project_beta)

        cls.mgr = cls._make_employee(MANAGER_NAME)
        cls.r1 = cls._make_employee(R1_NAME, reports_to=cls.mgr)
        cls.r2 = cls._make_employee(R2_NAME, reports_to=cls.mgr)
        cls.r3 = cls._make_employee(R3_NAME, reports_to=cls.mgr)
        cls.e1 = cls._make_employee(E1_NAME)
        cls.e2 = cls._make_employee(E2_NAME)

        frappe.set_user("Administrator")

        # R1: two entries in W1, no entries in W2, default "Not Submitted" status.
        cls._save(cls.r1, W1_MON, cls.task_alpha, 2, "r1 mon")
        cls._save(cls.r1, W1_TUE, cls.task_alpha, 3, "r1 tue")

        # R2: single entry in W1, patched to "Approved".
        cls._save(cls.r2, W1_TUE, cls.task_alpha, 4, "r2 tue")
        cls._set_week_status(cls.r2, W1_TUE, cls.project_alpha, "Approved")

        # R3: no timesheets — should still qualify with no filters, plus a holiday override.

        # E1: does not report to mgr, single entry in W2, patched to "Rejected".
        cls._save(cls.e1, W2_MON, cls.task_beta, 1, "e1 mon")
        cls._set_week_status(cls.e1, W2_MON, cls.project_beta, "Rejected")

        # E2: does not report to mgr, no timesheets.

        # LWP leave for R1 (LWP skips the leave-balance/allocation check).
        cls.leave_type = cls._make_lwp_leave_type(LEAVE_TYPE_NAME)
        cls._make_leave_application(cls.r1, cls.leave_type, W1_WED)

        # Non-weekly-off holiday for R3.
        holiday_list = make_holiday_list(
            HOLIDAY_LIST_NAME,
            from_date="2026-01-01",
            to_date="2026-12-31",
            holiday_dates=[{"holiday_date": W1_THU, "description": "Test Holiday", "weekly_off": 0}],
        )
        # Employee.holiday_list is ignored; HRMS resolves via Holiday List Assignment.
        cls._assign_holiday_list(cls.r3, holiday_list.name)

        cls.default_daily_hours = frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8

        frappe.clear_cache()

    # -- fixture factories -------------------------------------------------

    @classmethod
    def _make_user(cls, email):
        if not frappe.db.exists("User", email):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "first_name": email.split("@")[0],
                    "user_type": "System User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)
        return email

    @classmethod
    def _make_employee(cls, employee_name, reports_to=None):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": employee_name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                # rtcamp's Employee hook needs this set when reports_to is None.
                "leave_approver": "Administrator",
                "reports_to": reports_to,
                # Needed for project_currency's Timesheet costing-rate check.
                "ctc": 100000,
                "salary_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_customer(cls, customer_name):
        existing = frappe.db.get_value("Customer", {"customer_name": customer_name})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": customer_name,
                    "customer_type": "Company",
                    "default_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls, project_name, customer):
        if frappe.db.exists("Project", {"project_name": project_name}):
            return frappe.db.get_value("Project", {"project_name": project_name}, "name")
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": project_name,
                    "company": cls.company,
                    "customer": customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_task(cls, subject, project):
        if frappe.db.exists("Task", {"subject": subject}):
            return frappe.db.get_value("Task", {"subject": subject}, "name")
        return (
            frappe.get_doc({"doctype": "Task", "subject": subject, "project": project})
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _save(cls, employee, date, task, hours, description):
        save_timesheet(date=date, description=description, task=task, hours=hours, employee=employee)

    @classmethod
    def _set_week_status(cls, employee, date, project, status):
        ts_name = frappe.db.get_value(
            "Timesheet",
            {
                "employee": employee,
                "start_date": [">=", date],
                "end_date": ["<=", date],
                "parent_project": project,
                "docstatus": ["!=", 2],
            },
            "name",
        )
        frappe.db.set_value(
            "Timesheet",
            ts_name,
            {"custom_approval_status": status, "custom_weekly_approval_status": status},
        )
        return ts_name

    @classmethod
    def _assign_holiday_list(cls, employee, holiday_list_name):
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Employee",
                "assigned_to": employee,
                "holiday_list": holiday_list_name,
                "from_date": "2026-01-01",
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _ensure_company_holiday_list_assignment(cls):
        # Shared company across all 3 classes; guard against duplicate-assignment errors.
        if frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": cls.company, "from_date": "2026-01-01", "docstatus": 1},
        ):
            return
        holiday_list = make_holiday_list(
            COMPANY_HOLIDAY_LIST_NAME, from_date="2026-01-01", to_date="2026-12-31", holiday_dates=[]
        )
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Company",
                "assigned_to": cls.company,
                "holiday_list": holiday_list.name,
                "from_date": "2026-01-01",
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _make_lwp_leave_type(cls, leave_type_name):
        if frappe.db.exists("Leave Type", leave_type_name):
            return leave_type_name
        return (
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": leave_type_name, "is_lwp": 1})
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_leave_application(cls, employee, leave_type, date):
        doc = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "leave_type": leave_type,
                "company": cls.company,
                "from_date": date,
                "to_date": date,
                "description": "Test LWP leave",
                "posting_date": date,
                "status": "Approved",
                "leave_approver": "Administrator",
            }
        )
        doc.insert(ignore_permissions=True)
        doc.submit()
        return doc.name

    # -- call helper ---------------------------------------------------------

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call(self, user=WRITE_USER, start_date=W2_MON, **kwargs):
        """One week of members. `get_team_timesheet_data` is single-week now, so tests
        that used to span `max_week` weeks assert per week instead."""
        frappe.set_user(user)
        return get_team_timesheet_data(start_date=start_date, **kwargs)

    def _weeks(self, user=WRITE_USER, start_date=DATE, **kwargs):
        frappe.set_user(user)
        return get_team_timesheet_weeks(date=start_date, **kwargs)

    @staticmethod
    def _members_by_employee(response):
        return {member["employee"]: member for member in response["members"]}


class TestTeamTimesheetDataReportsToScoped(_TeamTimesheetDataBase):
    """reports_to=<manager>, no filters — locks the per-member payload shape."""

    def test_reports_to_scoped_full_payload(self):
        res = self._call(reports_to=self.mgr, start_date=W1_MON)

        members = self._members_by_employee(res)
        self.assertEqual(sorted(members), [self.r1, self.r2, self.r3])
        self.assertEqual(res["total_count"], 3)
        self.assertFalse(res["has_more"])
        self.assertEqual(res["start_date"], frappe.utils.getdate(W1_MON))

        r1 = members[self.r1]
        self.assertEqual(r1["total_hours"], 5)
        self.assertEqual(list(r1["tasks"].keys()), [self.task_alpha])
        self.assertEqual(len(r1["tasks"][self.task_alpha]["data"]), 2)
        self.assertEqual(r1["status"], "Not Submitted")
        self.assertEqual(len(r1["leaves"]), 1)
        self.assertEqual(r1["leaves"][0]["from_date"], frappe.utils.getdate(W1_WED))
        # R1 has no explicit holiday list; compare against the live company default.
        expected_r1_holidays = get_holidays(self.r1, res["start_date"], res["end_date"])
        actual_r1_holidays = [
            {k: holiday[k] for k in ("holiday_date", "description", "weekly_off")} for holiday in r1["holidays"]
        ]
        self.assertEqual(actual_r1_holidays, list(expected_r1_holidays))

        r2 = members[self.r2]
        self.assertEqual(r2["status"], "Approved")
        self.assertEqual(r2["total_hours"], 4)

        r3 = members[self.r3]
        self.assertEqual(len(r3["holidays"]), 1)
        self.assertEqual(r3["leaves"], [])
        self.assertEqual(r3["status"], "Not Submitted")
        # No timesheets, but with no filters every member still appears.
        self.assertEqual(r3["tasks"], {})
        self.assertEqual(r3["total_hours"], 0)

    def test_week_without_timesheets_still_lists_members(self):
        """W2 has no entries for the manager's reports; unfiltered, they still appear."""
        res = self._call(reports_to=self.mgr, start_date=W2_MON)
        self.assertEqual(sorted(self._members_by_employee(res)), [self.r1, self.r2, self.r3])
        self.assertEqual(res["total_count"], 3)

    def test_reports_to_ordering_matches_employee_name_asc(self):
        res = self._call(reports_to=self.mgr, start_date=W1_MON)
        # Alphabetical by employee_name (r3, r1, r2), not creation order.
        self.assertEqual([member["employee"] for member in res["members"]], [self.r3, self.r1, self.r2])


class TestTeamTimesheetDataAllEmployees(_TeamTimesheetDataBase):
    """reports_to=None ("All") — the pagination path this refactor targets."""

    def _golden_total_count(self):
        return frappe.db.count("Employee", {"status": "Active"})

    def test_pagination_mechanics_and_no_overlap(self):
        total_count = self._golden_total_count()

        page1 = self._call(reports_to=None, page_length=3, start=0)
        self.assertEqual(page1["total_count"], total_count)
        self.assertEqual(len(page1["members"]), 3)
        self.assertTrue(page1["has_more"])
        names1 = [member["employee_name"] for member in page1["members"]]
        self.assertEqual(names1, sorted(names1))

        page2 = self._call(reports_to=None, page_length=3, start=3)
        self.assertEqual(page2["total_count"], total_count)
        self.assertEqual(len(page2["members"]), 3)
        ids1 = {member["employee"] for member in page1["members"]}
        ids2 = {member["employee"] for member in page2["members"]}
        self.assertFalse(ids1 & ids2)

    def test_all_fixtures_present_with_correct_content(self):
        total_count = self._golden_total_count()

        res = self._call(reports_to=None, page_length=MAX_TEAM_TIMESHEET_PAGE_LENGTH, start=0)
        self.assertEqual(res["total_count"], total_count)

        # Page size is clamped, so walk every page to check fixture presence without
        # depending on ambient sort position.
        members = {}
        start = 0
        while True:
            page = self._call(reports_to=None, page_length=MAX_TEAM_TIMESHEET_PAGE_LENGTH, start=start)
            members.update(self._members_by_employee(page))
            if not page["has_more"]:
                break
            start += MAX_TEAM_TIMESHEET_PAGE_LENGTH

        self.assertEqual(len(members), total_count)
        for employee in (self.mgr, self.r1, self.r2, self.r3, self.e1, self.e2):
            self.assertIn(employee, members)

        # E1 doesn't report to mgr, so this also proves "All" isn't scoped.
        self.assertEqual(members[self.e1]["status"], "Rejected")
        self.assertEqual(members[self.e2]["status"], "Not Submitted")
        self.assertEqual(members[self.e2]["tasks"], {})

    def test_start_beyond_total_count_returns_empty_page(self):
        total_count = self._golden_total_count()
        res = self._call(reports_to=None, page_length=5, start=total_count + 5)
        self.assertEqual(res["members"], [])
        self.assertEqual(res["total_count"], total_count)
        self.assertFalse(res["has_more"])

    def test_start_equal_to_total_count_returns_empty_page(self):
        total_count = self._golden_total_count()
        res = self._call(reports_to=None, page_length=5, start=total_count)
        self.assertEqual(res["members"], [])
        self.assertFalse(res["has_more"])

    def test_page_length_zero_returns_no_members_but_real_total(self):
        res = self._call(reports_to=None, page_length=0)
        self.assertEqual(res["members"], [])
        self.assertEqual(res["total_count"], self._golden_total_count())

    def test_page_length_is_clamped(self):
        res = self._call(reports_to=None, page_length=10_000)
        self.assertLessEqual(len(res["members"]), MAX_TEAM_TIMESHEET_PAGE_LENGTH)


class TestTeamTimesheetDataFilters(_TeamTimesheetDataBase):
    """search / approval_status / composite `filters` — the has_filters=True path."""

    def test_search_matches_member_name_scoped_to_reports_to(self):
        res = self._call(reports_to=self.mgr, search=R1_NAME.split()[0], start_date=W1_MON)
        members = self._members_by_employee(res)
        self.assertEqual(list(members), [self.r1])
        self.assertEqual(res["total_count"], 1)

    def test_search_does_not_match_task_subject(self):
        """Search is a member search: task text must not produce results."""
        res = self._call(reports_to=self.mgr, search=TASK_ALPHA_SUBJECT, start_date=W1_MON)
        self.assertEqual(res["members"], [])
        self.assertEqual(res["total_count"], 0)

    def test_search_keeps_weeks_the_member_logged_nothing_in(self):
        """Empty weeks are dropped for work filters, not for a member search - the
        point of searching a person is to see their empty weeks too."""
        res = self._call(reports_to=self.mgr, search=R1_NAME.split()[0], start_date=W2_MON)
        self.assertEqual(list(self._members_by_employee(res)), [self.r1])
        self.assertEqual(res["total_count"], 1)

    def test_approval_status_filter_scoped_to_reports_to(self):
        res = self._call(reports_to=self.mgr, status_filter=["Approved"], start_date=W1_MON)
        members = self._members_by_employee(res)
        self.assertEqual(list(members), [self.r2])
        self.assertEqual(res["total_count"], 1)
        self.assertEqual(members[self.r2]["status"], "Approved")

    def test_not_submitted_filter_returns_members_without_a_timesheet(self):
        """ "Not Submitted" is the absence of a Timesheet, so it cannot be answered by
        querying them: r3 logged nothing that week and r1's week status was never set.
        Both render as Not Submitted, so both have to come back."""
        res = self._call(reports_to=self.mgr, status_filter=["Not Submitted"], start_date=W1_MON)
        members = self._members_by_employee(res)

        self.assertEqual(sorted(members), sorted([self.r1, self.r3]))
        self.assertEqual(res["total_count"], 2)
        for employee in (self.r1, self.r3):
            self.assertEqual(members[employee]["status"], "Not Submitted")

    def test_not_submitted_filter_excludes_a_decided_week(self):
        res = self._call(reports_to=self.mgr, status_filter=["Not Submitted"], start_date=W1_MON)
        self.assertNotIn(self.r2, self._members_by_employee(res))

    def test_not_submitted_unions_with_a_stored_status(self):
        res = self._call(reports_to=self.mgr, status_filter=["Approved", "Not Submitted"], start_date=W1_MON)
        self.assertEqual(sorted(self._members_by_employee(res)), sorted([self.r1, self.r2, self.r3]))
        self.assertEqual(res["total_count"], 3)

    def test_not_submitted_week_count_matches_the_member_page(self):
        """The badge and the rows beneath it read from the same resolver - if the no-row
        population is only added on one side they drift."""
        weeks = self._weeks(start_date=W1_MON, max_week=1, reports_to=self.mgr, status_filter=["Not Submitted"])
        week = next(w for w in weeks["weeks"] if str(w["start_date"]) == W1_MON)
        page = self._call(reports_to=self.mgr, status_filter=["Not Submitted"], start_date=W1_MON)

        self.assertEqual(week["member_count"], page["total_count"])

    def test_composite_filter_task_project_positive(self):
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_alpha]]),
            start_date=W1_MON,
        )
        self.assertEqual(sorted(self._members_by_employee(res)), [self.r1, self.r2])
        self.assertEqual(res["total_count"], 2)

    def test_composite_filter_task_project_no_reports_to_is_isolated(self):
        res = self._call(
            reports_to=None,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
            start_date=W2_MON,
        )
        self.assertEqual(list(self._members_by_employee(res)), [self.e1])
        self.assertEqual(res["total_count"], 1)

    def test_composite_filter_combined_with_reports_to_short_circuits_empty(self):
        # project_beta only has E1's timesheets, and E1 doesn't report to mgr.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
            start_date=W2_MON,
        )
        self.assertEqual(res["members"], [])
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_filtered_week_excludes_members_without_matching_entries(self):
        """R3 has no timesheets, so a task filter must drop them from the week."""
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_alpha]]),
            start_date=W1_MON,
        )
        self.assertNotIn(self.r3, self._members_by_employee(res))


LEFT_EMP_NAME = "Meera Joshi"
BU_ALPHA_NAME = "Ttf BU Alpha"
BU_BETA_NAME = "Ttf BU Beta"


class TestTeamTimesheetDataEmployeeFilters(_TeamTimesheetDataBase):
    """Employee-doctype composite filters — operators must survive to SQL instead of
    being coerced into IN (status) or exact-match (business unit)."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        frappe.set_user("Administrator")

        # Timesheet saved while Active, then flipped via db.set_value to skip
        # HRMS's relieving-date validation.
        cls.left_emp = cls._make_employee(LEFT_EMP_NAME, reports_to=cls.mgr)
        cls._save(cls.left_emp, W1_MON, cls.task_alpha, 2, "left mon")
        frappe.db.set_value("Employee", cls.left_emp, "status", "Left")

        cls.has_business_unit = bool(frappe.db.exists("DocType", "Business Unit")) and frappe.get_meta(
            "Employee"
        ).has_field("custom_business_unit")
        if cls.has_business_unit:
            cls.bu_alpha = cls._make_business_unit(BU_ALPHA_NAME)
            cls.bu_beta = cls._make_business_unit(BU_BETA_NAME)
            frappe.db.set_value("Employee", cls.r1, "custom_business_unit", cls.bu_alpha)
            frappe.db.set_value("Employee", cls.r2, "custom_business_unit", cls.bu_beta)

        frappe.clear_cache()

    @classmethod
    def _make_business_unit(cls, business_unit_name):
        existing = frappe.db.get_value("Business Unit", {"business_unit_name": business_unit_name})
        if existing:
            return existing
        return (
            frappe.get_doc({"doctype": "Business Unit", "business_unit_name": business_unit_name})
            .insert(ignore_permissions=True)
            .name
        )

    def _skip_without_business_unit(self):
        if not self.has_business_unit:
            self.skipTest("Business Unit doctype / custom_business_unit field not installed")

    def test_status_equals_overrides_default_active_filter(self):
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "status", "=", "Left"]]),
            start_date=W1_MON,
        )
        self.assertEqual(list(self._members_by_employee(res)), [self.left_emp])
        self.assertEqual(res["total_count"], 1)

    def test_status_not_equals_operator_preserved(self):
        # Under the old IN coercion this returned the Active employees instead.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "status", "!=", "Active"]]),
            start_date=W1_MON,
        )
        self.assertEqual(list(self._members_by_employee(res)), [self.left_emp])
        self.assertEqual(res["total_count"], 1)

    def test_status_filter_without_match_returns_empty(self):
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "status", "=", "Suspended"]]),
            start_date=W1_MON,
        )
        self.assertEqual(res["members"], [])
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_business_unit_like_matches_wildcard(self):
        self._skip_without_business_unit()
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "custom_business_unit", "like", "%BU Alph%"]]),
            start_date=W1_MON,
        )
        self.assertEqual(list(self._members_by_employee(res)), [self.r1])
        self.assertEqual(res["total_count"], 1)

    def test_business_unit_not_like_excludes_match(self):
        self._skip_without_business_unit()
        # Only r2 qualifies: r1's BU matches the pattern, left_emp fails the
        # default Active-only filter, r3 has no timesheets in the window.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "custom_business_unit", "not like", "%BU Alph%"]]),
            start_date=W1_MON,
        )
        self.assertEqual(list(self._members_by_employee(res)), [self.r2])
        self.assertEqual(res["total_count"], 1)

    def test_sanitize_drops_conditions_on_missing_meta_fields(self):
        conditions = sanitize_employee_conditions([["status", "=", "Active"], ["field_missing_from_meta", "=", "x"]])
        self.assertEqual(conditions, [["status", "=", "Active"]])


class TestTeamTimesheetWeeks(_TeamTimesheetDataBase):
    """get_team_timesheet_weeks — structure, counts, and the empty-week rule."""

    def test_week_structure_and_shape(self):
        res = self._weeks(reports_to=self.mgr, max_week=2)

        self.assertEqual(len(res["weeks"]), 2)
        self.assertEqual(
            [week["start_date"] for week in res["weeks"]],
            [frappe.utils.getdate(W1_MON), frappe.utils.getdate(W2_MON)],
        )
        for week in res["weeks"]:
            self.assertEqual(
                sorted(week),
                [
                    "approval_pending_count",
                    "dates",
                    "end_date",
                    "has_more_members",
                    "key",
                    "label",
                    "member_count",
                    "start_date",
                ],
            )

    def test_member_count_is_constant_across_weeks_when_unfiltered(self):
        res = self._weeks(reports_to=self.mgr, max_week=2)
        counts = {week["member_count"] for week in res["weeks"]}
        self.assertEqual(counts, {3})

    def test_member_count_is_per_week_when_filtered(self):
        res = self._weeks(
            reports_to=self.mgr,
            max_week=2,
            filters=json.dumps([["Task", "project", "=", self.project_alpha]]),
        )
        by_start = {week["start_date"]: week for week in res["weeks"]}
        # Alpha work exists only in W1, so W2 must not report the same membership.
        self.assertEqual(by_start[frappe.utils.getdate(W1_MON)]["member_count"], 2)
        self.assertNotIn(frappe.utils.getdate(W2_MON), by_start)

    def test_approval_pending_count_counts_distinct_members(self):
        res = self._weeks(reports_to=self.mgr, max_week=2)
        by_start = {week["start_date"]: week for week in res["weeks"]}
        # R2's W1 week is Approved and nobody in this fixture is pending.
        self.assertEqual(by_start[frappe.utils.getdate(W1_MON)]["approval_pending_count"], 0)

    def test_empty_weeks_kept_when_unfiltered(self):
        res = self._weeks(reports_to=self.mgr, max_week=2)
        # W2 has no entries for these members but is still a real week.
        self.assertIn(frappe.utils.getdate(W2_MON), [week["start_date"] for week in res["weeks"]])

    def test_no_match_returns_no_weeks(self):
        res = self._weeks(
            reports_to=self.mgr,
            max_week=2,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
        )
        self.assertEqual(res["weeks"], [])
        self.assertFalse(res["has_more_weeks"])

    def test_has_more_weeks_ignores_timesheets_outside_the_scope(self):
        # E1 is outside the manager's team; their older week must not keep the frontend
        # paging backwards through weeks that can never produce a row.
        self._save(self.e1, OLDER_MON, self.task_alpha, 3, "e1 older")

        res = self._weeks(reports_to=self.mgr, max_week=2, status_filter=["Approved"])

        self.assertEqual([week["start_date"] for week in res["weeks"]], [frappe.utils.getdate(W1_MON)])
        self.assertFalse(res["has_more_weeks"])
        self.assertIsNone(res["next_date"])

    def test_has_more_weeks_when_a_scoped_member_has_an_older_week(self):
        self._save(self.r2, OLDER_MON, self.task_alpha, 3, "r2 older")
        self._set_week_status(self.r2, OLDER_MON, self.project_alpha, "Approved")

        res = self._weeks(reports_to=self.mgr, max_week=2, status_filter=["Approved"])

        self.assertTrue(res["has_more_weeks"])
        self.assertEqual(res["next_date"], frappe.utils.getdate("2026-06-14"))


class TestTeamTimesheetConsistency(_TeamTimesheetDataBase):
    """Plan 5.7 — the week endpoint's counts must equal the data endpoint's pages.

    Drift here is invisible from the frontend: the badge would simply disagree with the
    rows underneath it.
    """

    def _assert_consistent(self, **kwargs):
        weeks = self._weeks(reports_to=self.mgr, max_week=2, **kwargs)
        for week in weeks["weeks"]:
            start_date = str(week["start_date"])
            seen = []
            start = 0
            while True:
                page = self._call(reports_to=self.mgr, start_date=start_date, page_length=2, start=start, **kwargs)
                seen.extend(member["employee"] for member in page["members"])
                self.assertEqual(page["total_count"], week["member_count"])
                if not page["has_more"]:
                    break
                start += 2

            self.assertEqual(len(seen), len(set(seen)), "pages overlapped")
            self.assertEqual(len(seen), week["member_count"])

    def test_consistent_without_filters(self):
        self._assert_consistent()

    def test_consistent_with_approval_status_filter(self):
        self._assert_consistent(status_filter=["Approved"])

    def test_consistent_with_task_project_filter(self):
        self._assert_consistent(filters=json.dumps([["Task", "project", "=", self.project_alpha]]))


class TestTeamTimesheetMemberWeek(_TeamTimesheetDataBase):
    """get_team_timesheet_member_week — the unit the realtime publisher swaps in."""

    def test_matches_the_element_the_page_endpoint_returns(self):
        page = self._call(reports_to=self.mgr, start_date=W1_MON)
        expected = self._members_by_employee(page)[self.r1]

        frappe.set_user(WRITE_USER)
        single = get_team_timesheet_member_week(employee=self.r1, start_date=W1_MON)
        self.assertEqual(single, expected)

    def test_returns_none_for_unknown_employee(self):
        frappe.set_user(WRITE_USER)
        self.assertIsNone(get_team_timesheet_member_week(employee="EMP-does-not-exist", start_date=W1_MON))

    def test_publisher_payload_carries_member_employee_and_start_date(self):
        """Regression guard for D2: the published shape was never asserted, and the
        page silently discarded every realtime update for it."""
        published = []

        def capture(event, message, **kwargs):
            published.append((event, message))

        frappe.set_user(WRITE_USER)
        original = frappe.publish_realtime
        frappe.publish_realtime = capture
        try:
            from next_pms.timesheet.doc_events import timesheet as timesheet_events

            original_module = timesheet_events.frappe.publish_realtime
            timesheet_events.frappe.publish_realtime = capture
            try:
                publish_timesheet_update(employee=self.r1, start_date=W1_MON)
            finally:
                timesheet_events.frappe.publish_realtime = original_module
        finally:
            frappe.publish_realtime = original

        info = [message for event, message in published if event == "timesheet_info"]
        self.assertTrue(info, "no timesheet_info event published")
        for payload in info:
            self.assertEqual(sorted(payload), ["employee", "message", "start_date"])
            self.assertEqual(payload["employee"], self.r1)
            self.assertIn("tasks", payload["message"])
            self.assertIn("status", payload["message"])
