import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import getdate

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.api.project import (
    get_project_timesheet_data,
    get_project_timesheet_member_week,
    get_project_timesheet_weeks,
)
from next_pms.timesheet.api.timesheet import save as save_timesheet

# Same week-anchoring convention as test_team_timesheet_data.py: anchoring on
# the Monday of W2 yields exactly [W1, W2] = [06-15..06-21, 06-22..06-28] for
# max_week=2. Assumes Monday-start weeks; setUpClass pins that explicitly.
DATE = "2026-06-22"
W1_MON = "2026-06-15"
W1_TUE = "2026-06-16"
W2_MON = "2026-06-22"

WRITE_USER = "project.timesheet.write@example.com"

CUSTOMER_NAME = "Meridian Client Co"
PROJECT_ALPHA_NAME = "Atlas Platform Revamp"
PROJECT_BETA_NAME = "Nimbus Mobile Launch"
PROJECT_GAMMA_NAME = "Zephyr Data Pipeline"
TASK_ALPHA_SUBJECT = "Build onboarding flow"
TASK_BETA_SUBJECT = "Configure push service"
TASK_GAMMA_SUBJECT = "Draft pipeline spec"

EMP1_NAME = "Rohit Verma"
EMP2_NAME = "Sneha Iyer"
EMP3_NAME = "Kabir Chawla"

COMPANY_HOLIDAY_LIST_NAME = "Ptd Company Wide Holidays"


class _ProjectTimesheetDataBase(IntegrationTestCase):
    """Shared fixtures for the project timesheet endpoints.

    Alpha: emp1 logs 2 entries in W1 only (5h), week marked Approved.
    Beta: emp3 logs 1 entry in W1 (1h); emp2 logs 1 entry in W2 (4h), week marked Rejected.
    Gamma: has a task but no timesheet entries anywhere — must never qualify,
    including when searched by name (a matching project name alone isn't enough;
    it must also have timesheet entries in the window).
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Timesheet Manager")

        # Week start is a global default — capture the prior value so
        # tearDownClass can restore it instead of leaking into other test modules.
        cls._prior_first_day_of_week = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")
        cls._ensure_company_holiday_list_assignment()

        cls.customer = cls._make_customer(CUSTOMER_NAME)
        cls.project_alpha = cls._make_project(PROJECT_ALPHA_NAME, cls.customer)
        cls.project_beta = cls._make_project(PROJECT_BETA_NAME, cls.customer)
        cls.project_gamma = cls._make_project(PROJECT_GAMMA_NAME, cls.customer)
        cls.task_alpha = cls._make_task(TASK_ALPHA_SUBJECT, cls.project_alpha)
        cls.task_beta = cls._make_task(TASK_BETA_SUBJECT, cls.project_beta)
        cls.task_gamma = cls._make_task(TASK_GAMMA_SUBJECT, cls.project_gamma)

        cls.emp1 = cls._make_employee(EMP1_NAME)
        cls.emp2 = cls._make_employee(EMP2_NAME)
        cls.emp3 = cls._make_employee(EMP3_NAME)

        frappe.set_user("Administrator")

        cls._save(cls.emp1, W1_MON, cls.task_alpha, 2, "emp1 mon")
        cls._save(cls.emp1, W1_TUE, cls.task_alpha, 3, "emp1 tue")
        # save() creates one Timesheet doc per day — both of emp1's W1 entries
        # must be marked, or week_status_map's per-(employee, week) overwrite
        # can leave the aggregate week status at the other day's default.
        cls._set_week_status(cls.emp1, W1_MON, cls.project_alpha, "Approved")
        cls._set_week_status(cls.emp1, W1_TUE, cls.project_alpha, "Approved")

        cls._save(cls.emp3, W1_MON, cls.task_beta, 1, "emp3 mon")
        cls._save(cls.emp2, W2_MON, cls.task_beta, 4, "emp2 mon")
        cls._set_week_status(cls.emp2, W2_MON, cls.project_beta, "Rejected")

        frappe.clear_cache()

    @classmethod
    def tearDownClass(cls):
        if cls._prior_first_day_of_week:
            frappe.db.set_default("first_day_of_the_week", cls._prior_first_day_of_week)
        else:
            frappe.defaults.clear_default("first_day_of_the_week")
        super().tearDownClass()

    # -- fixture factories (mirrors test_team_timesheet_data.py) -------------

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
    def _make_employee(cls, employee_name):
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
    def _ensure_company_holiday_list_assignment(cls):
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

    # -- call + response helpers ---------------------------------------------

    def tearDown(self):
        frappe.set_user("Administrator")

    def _weeks(self, user=WRITE_USER, date=DATE, **kwargs):
        frappe.set_user(user)
        return get_project_timesheet_weeks(date=date, **kwargs)

    def _data(self, start_date=W2_MON, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        return get_project_timesheet_data(start_date=start_date, **kwargs)

    def _member_week(self, employee, start_date, user=WRITE_USER):
        frappe.set_user(user)
        return get_project_timesheet_member_week(employee=employee, start_date=start_date)

    def _scope_to_fixtures_filter(self):
        # This endpoint has no reports_to-style scoping — it's org-wide, and this DB
        # carries ambient seed timesheets on unrelated projects. Scope every
        # non-search assertion to just our fixture projects so ambient data can't
        # leak into count / pagination checks.
        return json.dumps([["Task", "project", "in", [self.project_alpha, self.project_beta]]])

    def _project_ids(self, res):
        return {project["project"] for project in res["projects"]}

    def _project_entry(self, res, project_id):
        for project in res["projects"]:
            if project["project"] == project_id:
                return project
        return None

    def _member(self, project_entry, employee_id):
        for member in project_entry["members"]:
            if member["employee"] == employee_id:
                return member
        return None

    def _week(self, res, start_date):
        for week in res["weeks"]:
            if str(week["start_date"]) == start_date:
                return week
        return None


class TestProjectTimesheetWeeks(_ProjectTimesheetDataBase):
    """API 1 — week structure and per-week counts, carrying no project payloads."""

    def test_week_structure_and_counts(self):
        res = self._weeks(max_week=2, filters=self._scope_to_fixtures_filter())

        # Alpha (emp1) and Beta (emp3) both have W1 entries; only Beta has W2.
        w1 = self._week(res, W1_MON)
        w2 = self._week(res, W2_MON)
        self.assertIsNotNone(w1)
        self.assertIsNotNone(w2)
        self.assertEqual(w1["project_count"], 2)
        self.assertEqual(w2["project_count"], 1)

    def test_week_payload_carries_no_projects_or_members(self):
        res = self._weeks(max_week=2, filters=self._scope_to_fixtures_filter())
        for week in res["weeks"]:
            self.assertNotIn("projects", week)
            self.assertNotIn("members", week)
            self.assertEqual(
                sorted(week.keys()),
                ["dates", "end_date", "has_more_projects", "key", "label", "project_count", "start_date"],
            )

    def test_has_more_projects_reflects_page_length(self):
        res = self._weeks(max_week=2, filters=self._scope_to_fixtures_filter())
        # 2 projects in W1 is under the default page length, so there is no second page.
        self.assertFalse(self._week(res, W1_MON)["has_more_projects"])

    def test_empty_weeks_dropped_when_filtered(self):
        # A filter is active, so weeks holding no qualifying project are dropped
        # rather than returned empty.
        res = self._weeks(max_week=2, filters=self._scope_to_fixtures_filter())
        self.assertEqual({str(week["start_date"]) for week in res["weeks"]}, {W1_MON, W2_MON})

    def test_no_match_returns_no_weeks(self):
        res = self._weeks(max_week=2, search="zzz-no-project-matches-this")
        self.assertEqual(res["weeks"], [])

    def test_next_date_precedes_earliest_week(self):
        res = self._weeks(max_week=2, filters=self._scope_to_fixtures_filter())
        if res["has_more_weeks"]:
            self.assertIsNotNone(res["next_date"])
            self.assertLess(getdate(res["next_date"]), getdate(res["weeks"][0]["start_date"]))
        else:
            self.assertIsNone(res["next_date"])


class TestProjectTimesheetData(_ProjectTimesheetDataBase):
    """API 2 — one week's projects, paginated."""

    def test_single_week_payload_shape(self):
        res = self._data(start_date=W1_MON, page_length=10, filters=self._scope_to_fixtures_filter())

        self.assertEqual(str(res["start_date"]), W1_MON)
        self.assertEqual(sorted(res.keys()), ["dates", "end_date", "has_more", "projects", "start_date", "total_count"])
        self.assertEqual(self._project_ids(res), {self.project_alpha, self.project_beta})
        # Gamma has a task but no timesheet entries — it must never qualify.
        self.assertNotIn(self.project_gamma, self._project_ids(res))

        alpha = self._project_entry(res, self.project_alpha)
        self.assertEqual(alpha["project_name"], PROJECT_ALPHA_NAME)
        emp1 = self._member(alpha, self.emp1)
        self.assertIsNotNone(emp1)
        self.assertEqual(emp1["label"], EMP1_NAME)
        self.assertEqual(emp1["status"], "Approved")
        self.assertEqual(len(emp1["tasks"][self.task_alpha]["data"]), 2)

    def test_total_count_is_per_week_not_window(self):
        w1 = self._data(start_date=W1_MON, page_length=10, filters=self._scope_to_fixtures_filter())
        w2 = self._data(start_date=W2_MON, page_length=10, filters=self._scope_to_fixtures_filter())
        self.assertEqual(w1["total_count"], 2)
        self.assertEqual(w2["total_count"], 1)

    def test_projects_ordered_by_project_name(self):
        res = self._data(start_date=W1_MON, page_length=10, filters=self._scope_to_fixtures_filter())
        names = [project["project_name"] for project in res["projects"]]
        self.assertEqual(names, sorted(names))

    def test_pagination_splits_without_overlap_or_gaps(self):
        page1 = self._data(start_date=W1_MON, page_length=1, start=0, filters=self._scope_to_fixtures_filter())
        page2 = self._data(start_date=W1_MON, page_length=1, start=1, filters=self._scope_to_fixtures_filter())

        self.assertTrue(page1["has_more"])
        self.assertFalse(page2["has_more"])
        self.assertEqual(page1["total_count"], 2)
        self.assertEqual(page2["total_count"], 2)
        # Display order, and the two pages partition the week's projects.
        self.assertEqual(self._project_ids(page1), {self.project_alpha})
        self.assertEqual(self._project_ids(page2), {self.project_beta})
        self.assertEqual(self._project_ids(page1) & self._project_ids(page2), set())

    def test_start_beyond_total_count_returns_empty_page(self):
        res = self._data(start_date=W1_MON, page_length=4, start=99, filters=self._scope_to_fixtures_filter())
        self.assertEqual(res["projects"], [])
        self.assertEqual(res["total_count"], 2)
        self.assertFalse(res["has_more"])

    def test_zero_page_length_returns_count_without_rows(self):
        res = self._data(start_date=W1_MON, page_length=0, filters=self._scope_to_fixtures_filter())
        self.assertEqual(res["projects"], [])
        self.assertEqual(res["total_count"], 2)
        self.assertFalse(res["has_more"])

    def test_page_length_is_clamped(self):
        # Above the server-side ceiling; must not raise and must not over-fetch.
        res = self._data(start_date=W1_MON, page_length=10_000, filters=self._scope_to_fixtures_filter())
        self.assertEqual(len(res["projects"]), 2)

    def test_approval_status_filter_scopes_to_matching_week(self):
        res = self._data(
            start_date=W1_MON,
            page_length=10,
            approval_status=json.dumps(["Approved"]),
            filters=self._scope_to_fixtures_filter(),
        )
        self.assertEqual(self._project_ids(res), {self.project_alpha})

    def test_search_matches_project_name(self):
        res = self._data(
            start_date=W1_MON, page_length=10, search=PROJECT_ALPHA_NAME, filters=self._scope_to_fixtures_filter()
        )
        self.assertEqual(self._project_ids(res), {self.project_alpha})

    def test_inactive_member_still_fills_the_slot_their_project_occupies(self):
        """Participation is resolved from Timesheet rows, which carry no employee-status
        condition, so a departed employee's project counts toward `total_count`. The member
        lookup has to use the same population or that project renders as a hole in the page."""
        frappe.set_user("Administrator")
        frappe.db.set_value("Employee", self.emp3, "status", "Inactive")
        try:
            res = self._data(start_date=W1_MON, filters=self._scope_to_fixtures_filter())

            beta = self._project_entry(res, self.project_beta)
            self.assertIsNotNone(beta)
            self.assertIsNotNone(self._member(beta, self.emp3))
            self.assertEqual(len(res["projects"]), res["total_count"])
        finally:
            frappe.set_user("Administrator")
            frappe.db.set_value("Employee", self.emp3, "status", "Active")

    def test_search_matching_name_without_entries_excludes_project(self):
        res = self._data(start_date=W1_MON, page_length=10, search=PROJECT_GAMMA_NAME)
        self.assertEqual(self._project_ids(res), set())
        self.assertEqual(res["total_count"], 0)


class TestProjectTimesheetConsistency(_ProjectTimesheetDataBase):
    """The invariant that makes the split safe: API 1's count must equal what API 2 pages."""

    def _walk_all_pages(self, start_date, **kwargs):
        seen = []
        start = 0
        while True:
            page = self._data(start_date=start_date, page_length=1, start=start, **kwargs)
            seen.extend(project["project"] for project in page["projects"])
            if not page["has_more"]:
                return seen
            start += 1
            if start > 50:
                self.fail("pagination did not terminate")

    def test_week_count_equals_union_of_data_pages(self):
        scoped = {"filters": self._scope_to_fixtures_filter()}
        weeks = self._weeks(max_week=2, **scoped)

        for week in weeks["weeks"]:
            walked = self._walk_all_pages(str(week["start_date"]), **scoped)
            self.assertEqual(
                len(walked),
                week["project_count"],
                f"week {week['start_date']}: API 1 said {week['project_count']}, API 2 paged {len(walked)}",
            )
            self.assertEqual(len(walked), len(set(walked)), "a project appeared on two pages")

    def test_counts_agree_under_each_filter(self):
        cases = [
            {"filters": self._scope_to_fixtures_filter()},
            {"filters": self._scope_to_fixtures_filter(), "approval_status": json.dumps(["Approved"])},
            {"filters": self._scope_to_fixtures_filter(), "search": PROJECT_ALPHA_NAME},
            {"filters": json.dumps([["Task", "project", "=", self.project_beta]])},
        ]
        for case in cases:
            with self.subTest(case=case):
                weeks = self._weeks(max_week=2, **case)
                for week in weeks["weeks"]:
                    data = self._data(start_date=str(week["start_date"]), page_length=100, **case)
                    self.assertEqual(week["project_count"], data["total_count"])
                    self.assertEqual(week["project_count"], len(data["projects"]))


class TestProjectTimesheetMemberWeek(_ProjectTimesheetDataBase):
    """API 3 — one employee's week keyed by project; the realtime unit."""

    def test_returns_employee_week_grouped_by_project(self):
        res = self._member_week(self.emp1, W1_MON)

        self.assertEqual(res["employee"], self.emp1)
        self.assertEqual(str(res["start_date"]), W1_MON)
        self.assertIn(self.project_alpha, res["projects"])

        entry = res["projects"][self.project_alpha]
        self.assertEqual(entry["project_name"], PROJECT_ALPHA_NAME)
        self.assertEqual(entry["member"]["employee"], self.emp1)
        self.assertEqual(entry["member"]["status"], "Approved")

    def test_member_matches_the_row_api_2_renders(self):
        # The realtime payload must be swappable into API 2's output as-is.
        data = self._data(start_date=W1_MON, page_length=10, filters=self._scope_to_fixtures_filter())
        rendered = self._member(self._project_entry(data, self.project_alpha), self.emp1)
        published = self._member_week(self.emp1, W1_MON)["projects"][self.project_alpha]["member"]
        self.assertEqual(published, rendered)

    def test_project_absent_when_employee_has_no_entry_there(self):
        # emp1 never logged to Beta — Beta must not appear, which is what lets a
        # listener remove a row rather than only replace one.
        res = self._member_week(self.emp1, W1_MON)
        self.assertNotIn(self.project_beta, res["projects"])

    def test_week_without_entries_returns_no_projects(self):
        res = self._member_week(self.emp1, W2_MON)
        self.assertEqual(res["projects"], {})

    def test_unknown_employee_returns_empty_payload(self):
        res = self._member_week("EMP-does-not-exist", W1_MON)
        self.assertEqual(res["projects"], {})


class TestProjectTimesheetPublisher(_ProjectTimesheetDataBase):
    """Regression guard for the realtime contract.

    The team page's equivalent bug existed precisely because nothing asserted that
    the published payload was the shape the listener keys on.
    """

    def _capture(self, employee, date):
        from next_pms.timesheet.doc_events.timesheet import publish_timesheet_update

        captured = []
        original = frappe.publish_realtime

        def spy(event=None, message=None, *args, **kwargs):
            captured.append((event, message, kwargs))

        frappe.publish_realtime = spy
        try:
            publish_timesheet_update(employee, date)
        finally:
            frappe.publish_realtime = original
        return captured

    def _project_events(self, employee, date):
        return [entry for entry in self._capture(employee, date) if entry[0] == "project_timesheet_info"]

    def test_publishes_project_timesheet_info(self):
        events = {event for event, _, _ in self._capture(self.emp1, W1_MON)}
        self.assertIn("project_timesheet_info", events)

    def test_site_room_publish_carries_no_member_detail(self):
        """The site room holds every logged-in client, including ones that cannot read this
        employee's week, so it may only be told *that* the week changed."""
        broadcast = next(
            message for _, message, kwargs in self._project_events(self.emp1, W1_MON) if kwargs.get("room")
        )

        self.assertEqual(sorted(broadcast.keys()), ["employee", "start_date"])
        self.assertEqual(broadcast["employee"], self.emp1)
        self.assertEqual(str(broadcast["start_date"]), W1_MON)

    def test_published_payload_matches_api_3(self):
        payload = next(message for _, message, kwargs in self._project_events(self.emp1, W1_MON) if kwargs.get("user"))

        self.assertEqual(sorted(payload.keys()), ["employee", "message", "start_date"])
        self.assertEqual(payload["employee"], self.emp1)
        self.assertEqual(str(payload["start_date"]), W1_MON)

        frappe.set_user("Administrator")
        expected = get_project_timesheet_member_week(employee=self.emp1, start_date=W1_MON, by_pass_access_check=True)
        self.assertEqual(payload["message"], expected)
