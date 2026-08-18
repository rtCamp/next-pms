import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.api.project import get_project_timesheet_data
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
    """Shared fixtures for get_project_timesheet_data.

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

    def _call(self, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        return get_project_timesheet_data(date=DATE, **kwargs)

    def _all_project_ids(self, res):
        return {proj["project"] for week in res["week_groups"] for proj in week["projects"]}

    def _project_entry(self, res, week_key, project_id):
        """The project's entry within a specific week_group, or None if absent."""
        for week in res["week_groups"]:
            if week["key"] != week_key:
                continue
            for proj in week["projects"]:
                if proj["project"] == project_id:
                    return proj
        return None

    def _week_keys_for_project(self, res, project_id):
        return [week["key"] for week in res["week_groups"] if any(p["project"] == project_id for p in week["projects"])]

    def _member(self, project_entry, employee_id):
        for member in project_entry["members"]:
            if member["employee"] == employee_id:
                return member
        return None

    def _scope_to_fixtures_filter(self):
        # This endpoint has no reports_to-style scoping — it's org-wide, and
        # this DB carries ambient seed timesheets on unrelated projects. Scope
        # every non-search assertion to just our fixture projects so ambient
        # data can't leak into total_count / pagination checks.
        return json.dumps([["Task", "project", "in", [self.project_alpha, self.project_beta]]])


class TestProjectTimesheetDataNoFilters(_ProjectTimesheetDataBase):
    """Locks the baseline payload shape (project/member/task detail).

    This endpoint is org-wide with no reports_to-style scoping, and the DB
    carries ambient seed timesheets on unrelated projects — so every call
    here is scoped to just our fixtures via a composite Task.project filter
    (not itself the thing under test) to keep total_count/pagination
    assertions deterministic.
    """

    def test_qualifying_projects_and_payload_shape(self):
        res = self._call(max_week=2, page_length=10, filters=self._scope_to_fixtures_filter())

        self.assertEqual(res["total_count"], 2)
        self.assertFalse(res["has_more"])
        self.assertEqual(self._all_project_ids(res), {self.project_alpha, self.project_beta})
        # Gamma has a task but no timesheet entries in range — must never qualify.
        self.assertNotIn(self.project_gamma, self._all_project_ids(res))

        alpha_weeks = self._week_keys_for_project(res, self.project_alpha)
        self.assertEqual(len(alpha_weeks), 1)
        w1_key = alpha_weeks[0]

        alpha_w1 = self._project_entry(res, w1_key, self.project_alpha)
        self.assertEqual(alpha_w1["project_name"], PROJECT_ALPHA_NAME)
        emp1_member = self._member(alpha_w1, self.emp1)
        self.assertIsNotNone(emp1_member)
        self.assertEqual(emp1_member["label"], EMP1_NAME)
        self.assertEqual(emp1_member["status"], "Approved")
        self.assertIn(self.task_alpha, emp1_member["tasks"])
        self.assertEqual(len(emp1_member["tasks"][self.task_alpha]["data"]), 2)

        beta_w1 = self._project_entry(res, w1_key, self.project_beta)
        self.assertIsNotNone(beta_w1)
        emp3_member = self._member(beta_w1, self.emp3)
        self.assertIsNotNone(emp3_member)
        self.assertEqual(emp3_member["label"], EMP3_NAME)

        beta_weeks = self._week_keys_for_project(res, self.project_beta)
        self.assertEqual(len(beta_weeks), 2)
        w2_key = next(k for k in beta_weeks if k != w1_key)
        beta_w2 = self._project_entry(res, w2_key, self.project_beta)
        emp2_member = self._member(beta_w2, self.emp2)
        self.assertIsNotNone(emp2_member)
        self.assertEqual(emp2_member["status"], "Rejected")
        self.assertIn(self.task_beta, emp2_member["tasks"])

    def test_pagination_mechanics(self):
        scope = self._scope_to_fixtures_filter()
        page1 = self._call(max_week=2, page_length=1, start=0, filters=scope)
        self.assertEqual(page1["total_count"], 2)
        self.assertTrue(page1["has_more"])
        self.assertEqual(len(self._all_project_ids(page1)), 1)

        page2 = self._call(max_week=2, page_length=1, start=1, filters=scope)
        self.assertEqual(page2["total_count"], 2)
        self.assertFalse(page2["has_more"])
        self.assertEqual(len(self._all_project_ids(page2)), 1)

        self.assertFalse(self._all_project_ids(page1) & self._all_project_ids(page2))
        self.assertEqual(
            self._all_project_ids(page1) | self._all_project_ids(page2), {self.project_alpha, self.project_beta}
        )

    def test_start_beyond_total_count_returns_empty(self):
        res = self._call(max_week=2, page_length=5, start=10, filters=self._scope_to_fixtures_filter())
        self.assertEqual(self._all_project_ids(res), set())
        self.assertEqual(res["total_count"], 2)
        self.assertFalse(res["has_more"])


class TestProjectTimesheetDataSearch(_ProjectTimesheetDataBase):
    """search — matches Project name/id, not Task text (the behavioural change under test)."""

    def test_search_matches_full_project_name(self):
        # Scoped to fixtures: ambient seed projects could otherwise coincidentally
        # match the search term and make this non-deterministic.
        res = self._call(search=PROJECT_ALPHA_NAME, filters=self._scope_to_fixtures_filter())
        self.assertEqual(self._all_project_ids(res), {self.project_alpha})

    def test_search_matches_partial_case_insensitive_project_name(self):
        res = self._call(search="nimbus", filters=self._scope_to_fixtures_filter())
        self.assertEqual(self._all_project_ids(res), {self.project_beta})

    def test_search_matches_project_id_substring(self):
        res = self._call(search=self.project_alpha)
        self.assertEqual(self._all_project_ids(res), {self.project_alpha})

    def test_search_by_task_text_no_longer_matches_anyone(self):
        res = self._call(search=TASK_ALPHA_SUBJECT)
        self.assertEqual(self._all_project_ids(res), set())
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_search_matching_name_but_no_timesheet_entries_excludes_project(self):
        # Gamma's name matches the search term, but it has zero timesheet
        # entries in the window — a name match alone must not be enough.
        res = self._call(search=PROJECT_GAMMA_NAME)
        self.assertEqual(self._all_project_ids(res), set())
        self.assertEqual(res["total_count"], 0)

    def test_search_match_shows_full_task_detail_not_narrowed(self):
        # A project-name match doesn't narrow which tasks/employees show under
        # it — the full detail renders, same as the no-filter payload.
        res = self._call(search=PROJECT_ALPHA_NAME)
        w1_key = self._week_keys_for_project(res, self.project_alpha)[0]
        alpha_w1 = self._project_entry(res, w1_key, self.project_alpha)
        emp1_member = self._member(alpha_w1, self.emp1)
        self.assertEqual(len(emp1_member["tasks"][self.task_alpha]["data"]), 2)


class TestProjectTimesheetDataApprovalStatus(_ProjectTimesheetDataBase):
    def test_approval_status_scopes_to_matching_week(self):
        res = self._call(approval_status=json.dumps(["Approved"]), filters=self._scope_to_fixtures_filter())
        self.assertEqual(self._all_project_ids(res), {self.project_alpha})
        w1_key = self._week_keys_for_project(res, self.project_alpha)[0]
        alpha_w1 = self._project_entry(res, w1_key, self.project_alpha)
        self.assertEqual(self._member(alpha_w1, self.emp1)["status"], "Approved")

    def test_approval_status_without_match_returns_empty(self):
        res = self._call(approval_status=json.dumps(["Processing Timesheet"]), filters=self._scope_to_fixtures_filter())
        self.assertEqual(self._all_project_ids(res), set())
        self.assertEqual(res["total_count"], 0)


class TestProjectTimesheetDataCompositeFilters(_ProjectTimesheetDataBase):
    def test_composite_filter_task_project_positive(self):
        res = self._call(filters=json.dumps([["Task", "project", "=", self.project_beta]]))
        self.assertEqual(self._all_project_ids(res), {self.project_beta})

    def test_composite_filter_task_project_excludes_other_projects(self):
        res = self._call(filters=json.dumps([["Task", "project", "=", self.project_alpha]]))
        self.assertEqual(self._all_project_ids(res), {self.project_alpha})

    def test_search_combined_with_composite_filter(self):
        # Search narrows to alpha by name; composite filter narrows to beta's
        # task — the intersection is empty.
        res = self._call(
            search=PROJECT_ALPHA_NAME,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
        )
        self.assertEqual(self._all_project_ids(res), set())
        self.assertEqual(res["total_count"], 0)


class TestProjectTimesheetDataSkipEmptyWeeks(_ProjectTimesheetDataBase):
    def test_skip_empty_weeks_prunes_weeks_without_matching_project_tasks(self):
        # Alpha (matched via name search) only has entries in W1.
        with_skip = self._call(search=PROJECT_ALPHA_NAME, skip_empty_weeks=True)
        without_skip = self._call(search=PROJECT_ALPHA_NAME, skip_empty_weeks=False)

        with_skip_weeks = self._week_keys_for_project(with_skip, self.project_alpha)
        without_skip_weeks = self._week_keys_for_project(without_skip, self.project_alpha)

        self.assertEqual(len(with_skip_weeks), 1)
        self.assertGreaterEqual(len(without_skip_weeks), 1)


class TestProjectTimesheetDataBackdateRestriction(_ProjectTimesheetDataBase):
    """backdate_restricted_before on each member payload - confirms the field is
    threaded through from get_backdate_restriction_boundary."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries", 1)
        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries_till_employee", 3)
        frappe.clear_cache()

    def test_member_payload_carries_matching_boundary(self):
        from next_pms.timesheet.doc_events.timesheet import get_backdate_restriction_boundary

        res = self._call(filters=self._scope_to_fixtures_filter())

        frappe.set_user(WRITE_USER)
        seen_employees = set()
        for week in res["week_groups"]:
            for project in week["projects"]:
                for member in project["members"]:
                    seen_employees.add(member["employee"])
                    expected = get_backdate_restriction_boundary(member["employee"])
                    self.assertEqual(member["backdate_restricted_before"], expected)

        self.assertTrue(seen_employees, "fixtures produced no members to check")
