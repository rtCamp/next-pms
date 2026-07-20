import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.api.team import get_team_timesheet_data
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays, sanitize_employee_conditions

# build_aggregate_dates walks backward from `date`, so anchoring on the
# Monday of W2 yields exactly [W1, W2] = [06-15..06-21, 06-22..06-28] for
# max_week=2. Assumes Monday-start weeks; setUpClass pins that explicitly.
DATE = "2026-06-22"
W1_MON = "2026-06-15"
W1_TUE = "2026-06-16"
W1_WED = "2026-06-17"
W1_THU = "2026-06-18"
W2_MON = "2026-06-22"

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
            }
        )
        doc.insert(ignore_permissions=True)
        doc.submit()
        return doc.name

    # -- call helper ---------------------------------------------------------

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call(self, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        return get_team_timesheet_data(date=DATE, **kwargs)


class TestTeamTimesheetDataReportsToScoped(_TeamTimesheetDataBase):
    """reports_to=<manager>, no filters — locks the full per-employee payload shape."""

    def test_reports_to_scoped_full_payload(self):
        res = self._call(reports_to=self.mgr, max_week=2)

        self.assertEqual(sorted(res["data"].keys()), [self.r1, self.r2, self.r3])
        self.assertEqual(res["total_count"], 3)
        self.assertFalse(res["has_more"])
        self.assertEqual(len(res["dates"]), 2)
        self.assertEqual(res["dates"][0]["start_date"], frappe.utils.getdate(W1_MON))
        self.assertEqual(res["dates"][1]["start_date"], frappe.utils.getdate(W2_MON))

        r1_data = res["data"][self.r1]
        r1_by_date = {row["date"]: row for row in r1_data["data"]}
        self.assertEqual(r1_by_date[frappe.utils.getdate(W1_MON)]["hour"], 2)
        self.assertEqual(r1_by_date[frappe.utils.getdate(W1_MON)]["note"], "r1 mon\n")
        self.assertFalse(r1_by_date[frappe.utils.getdate(W1_MON)]["is_leave"])
        self.assertEqual(r1_by_date[frappe.utils.getdate(W1_TUE)]["hour"], 3)
        self.assertEqual(r1_by_date[frappe.utils.getdate(W1_WED)]["hour"], self.default_daily_hours)
        self.assertTrue(r1_by_date[frappe.utils.getdate(W1_WED)]["is_leave"])
        self.assertEqual(r1_by_date[frappe.utils.getdate(W1_THU)]["hour"], 0)
        self.assertEqual(len(r1_data["leaves"]), 1)
        self.assertEqual(r1_data["leaves"][0]["from_date"], frappe.utils.getdate(W1_WED))
        # R1 has no explicit holiday list; compare against the live company default.
        expected_r1_holidays = get_holidays(self.r1, res["dates"][0]["start_date"], res["dates"][-1]["end_date"])
        actual_r1_holidays = [
            {k: holiday[k] for k in ("holiday_date", "description", "weekly_off")} for holiday in r1_data["holidays"]
        ]
        self.assertEqual(actual_r1_holidays, list(expected_r1_holidays))
        self.assertEqual(r1_data["status"], "Not Submitted")
        self.assertEqual(len(r1_data["timesheet_details"]), 2)
        week1_key = res["dates"][0]["key"]
        week2_key = res["dates"][1]["key"]
        self.assertEqual(r1_data["timesheet_details"][week1_key]["total_hours"], 5)
        self.assertEqual(list(r1_data["timesheet_details"][week1_key]["tasks"].keys()), [self.task_alpha])
        self.assertEqual(len(r1_data["timesheet_details"][week1_key]["tasks"][self.task_alpha]["data"]), 2)
        self.assertEqual(r1_data["timesheet_details"][week2_key]["total_hours"], 0)
        self.assertEqual(r1_data["timesheet_details"][week2_key]["tasks"], {})

        r2_data = res["data"][self.r2]
        r2_by_date = {row["date"]: row for row in r2_data["data"]}
        self.assertEqual(r2_by_date[frappe.utils.getdate(W1_TUE)]["hour"], 4)
        self.assertEqual(r2_data["status"], "Approved")
        self.assertEqual(r2_data["timesheet_details"][week1_key]["status"], "Approved")
        self.assertEqual(r2_data["timesheet_details"][week1_key]["total_hours"], 4)

        r3_data = res["data"][self.r3]
        r3_by_date = {row["date"]: row for row in r3_data["data"]}
        self.assertEqual(r3_by_date[frappe.utils.getdate(W1_THU)]["hour"], self.default_daily_hours)
        self.assertFalse(r3_by_date[frappe.utils.getdate(W1_THU)]["is_leave"])
        self.assertEqual(len(r3_data["holidays"]), 1)
        self.assertEqual(r3_data["leaves"], [])
        self.assertEqual(r3_data["status"], "Not Submitted")
        # No timesheets, but every week still qualifies with no filters.
        self.assertEqual(len(r3_data["timesheet_details"]), 2)
        self.assertEqual(r3_data["timesheet_details"][week1_key]["tasks"], {})

    def test_reports_to_ordering_matches_employee_name_asc(self):
        res = self._call(reports_to=self.mgr)
        # Alphabetical by employee_name (r3, r1, r2), not creation order.
        self.assertEqual(list(res["data"].keys()), [self.r3, self.r1, self.r2])


class TestTeamTimesheetDataAllEmployees(_TeamTimesheetDataBase):
    """reports_to=None ("All") — the pagination path this refactor targets."""

    def _golden_total_count(self):
        return frappe.db.count("Employee", {"status": "Active"})

    def test_pagination_mechanics_and_no_overlap(self):
        total_count = self._golden_total_count()

        page1 = self._call(reports_to=None, page_length=3, start=0)
        self.assertEqual(page1["total_count"], total_count)
        self.assertEqual(len(page1["data"]), 3)
        self.assertTrue(page1["has_more"])
        names1 = list(page1["data"].keys())
        self.assertEqual(names1, sorted(names1, key=lambda n: page1["data"][n]["employee_name"]))

        page2 = self._call(reports_to=None, page_length=3, start=3)
        self.assertEqual(page2["total_count"], total_count)
        self.assertEqual(len(page2["data"]), 3)
        self.assertFalse(set(page1["data"].keys()) & set(page2["data"].keys()))

    def test_all_fixtures_present_with_correct_content(self):
        total_count = self._golden_total_count()

        # Fetch every active employee in one call, so fixture presence/content
        # can be checked without depending on ambient sort position.
        res = self._call(reports_to=None, page_length=total_count, start=0)
        self.assertEqual(res["total_count"], total_count)
        self.assertFalse(res["has_more"])
        self.assertEqual(len(res["data"]), total_count)

        for employee in (self.mgr, self.r1, self.r2, self.r3, self.e1, self.e2):
            self.assertIn(employee, res["data"])

        # Global ordering isn't asserted: duplicate employee_name values in this
        # DB make cross-chunk tie order non-deterministic. See
        # test_pagination_mechanics_and_no_overlap for the real guarantee.

        # E1 doesn't report to mgr, so this also proves "All" isn't scoped.
        e1_data = res["data"][self.e1]
        e1_by_date = {row["date"]: row for row in e1_data["data"]}
        self.assertEqual(e1_by_date[frappe.utils.getdate(W2_MON)]["hour"], 1)
        self.assertEqual(e1_data["status"], "Rejected")

        e2_data = res["data"][self.e2]
        self.assertTrue(all(row["hour"] == 0 for row in e2_data["data"]))
        self.assertEqual(e2_data["status"], "Not Submitted")

    def test_start_beyond_total_count_returns_empty_page(self):
        total_count = self._golden_total_count()
        res = self._call(reports_to=None, page_length=5, start=total_count + 5)
        self.assertEqual(res["data"], {})
        self.assertEqual(res["total_count"], total_count)
        self.assertFalse(res["has_more"])


class TestTeamTimesheetDataFilters(_TeamTimesheetDataBase):
    """search / approval_status / composite `filters` — the has_filters=True path."""

    def test_search_matches_employee_name_scoped_to_reports_to(self):
        # Partial, lowercase substring against Naveen Bhatt's employee_name —
        # search now matches the Employee, not Task text.
        res = self._call(reports_to=self.mgr, search="naveen")
        self.assertEqual(list(res["data"].keys()), [self.r1])
        self.assertEqual(res["total_count"], 1)

        # A name match doesn't narrow which of the employee's tasks are shown —
        # the full week detail (all tasks/hours) still renders, same as the
        # no-filter payload in TestTeamTimesheetDataReportsToScoped.
        # R1 only has entries in W1 (W2 is empty, since search doesn't prune
        # weeks) — select the populated week explicitly rather than relying on
        # dict insertion order.
        r1_weeks = res["data"][self.r1]["timesheet_details"]
        week1 = next(week for week in r1_weeks.values() if week["tasks"])
        self.assertEqual(week1["total_hours"], 5)
        self.assertIn(self.task_alpha, week1["tasks"])
        self.assertEqual(len(week1["tasks"][self.task_alpha]["data"]), 2)

    def test_search_by_task_text_no_longer_matches_anyone(self):
        res = self._call(reports_to=self.mgr, search=TASK_ALPHA_SUBJECT)
        self.assertEqual(res["data"], {})
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_approval_status_filter_scoped_to_reports_to(self):
        res = self._call(reports_to=self.mgr, status_filter=["Approved"])
        self.assertEqual(list(res["data"].keys()), [self.r2])
        self.assertEqual(res["total_count"], 1)
        r2_weeks = res["data"][self.r2]["timesheet_details"]
        # Only the Approved week survives; the other week (Not Submitted) is pruned.
        self.assertEqual(len(r2_weeks), 1)
        self.assertEqual(next(iter(r2_weeks.values()))["status"], "Approved")

    def test_composite_filter_task_project_positive(self):
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_alpha]]),
        )
        self.assertEqual(sorted(res["data"].keys()), [self.r1, self.r2])
        self.assertEqual(res["total_count"], 2)

    def test_composite_filter_task_project_no_reports_to_is_isolated(self):
        res = self._call(
            reports_to=None,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
        )
        self.assertEqual(list(res["data"].keys()), [self.e1])
        self.assertEqual(res["total_count"], 1)

    def test_composite_filter_combined_with_reports_to_short_circuits_empty(self):
        # project_beta only has E1's timesheets, and E1 doesn't report to mgr.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
        )
        self.assertEqual(res["data"], {})
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_skip_empty_weeks_prunes_weeks_without_tasks(self):
        # R1 (matched via name search) only has entries in W1 — W2 is empty and
        # should be pruned when skip_empty_weeks=True.
        with_skip = self._call(reports_to=self.mgr, search="naveen", skip_empty_weeks=True)
        without_skip = self._call(reports_to=self.mgr, search="naveen", skip_empty_weeks=False)

        self.assertEqual(list(with_skip["data"].keys()), [self.r1])
        self.assertEqual(list(without_skip["data"].keys()), [self.r1])

        self.assertEqual(len(with_skip["data"][self.r1]["timesheet_details"]), 1)
        self.assertEqual(len(without_skip["data"][self.r1]["timesheet_details"]), 2)


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
        )
        self.assertEqual(list(res["data"].keys()), [self.left_emp])
        self.assertEqual(res["total_count"], 1)

    def test_status_not_equals_operator_preserved(self):
        # Under the old IN coercion this returned the Active employees instead.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "status", "!=", "Active"]]),
        )
        self.assertEqual(list(res["data"].keys()), [self.left_emp])
        self.assertEqual(res["total_count"], 1)

    def test_status_filter_without_match_returns_empty(self):
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "status", "=", "Suspended"]]),
        )
        self.assertEqual(res["data"], {})
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_business_unit_like_matches_wildcard(self):
        self._skip_without_business_unit()
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "custom_business_unit", "like", "%BU Alph%"]]),
        )
        self.assertEqual(list(res["data"].keys()), [self.r1])
        self.assertEqual(res["total_count"], 1)

    def test_business_unit_not_like_excludes_match(self):
        self._skip_without_business_unit()
        # Only r2 qualifies: r1's BU matches the pattern, left_emp fails the
        # default Active-only filter, r3 has no timesheets in the window.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Employee", "custom_business_unit", "not like", "%BU Alph%"]]),
        )
        self.assertEqual(list(res["data"].keys()), [self.r2])
        self.assertEqual(res["total_count"], 1)

    def test_sanitize_drops_conditions_on_missing_meta_fields(self):
        conditions = sanitize_employee_conditions([["status", "=", "Active"], ["field_missing_from_meta", "=", "x"]])
        self.assertEqual(conditions, [["status", "=", "Active"]])
