import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.api.team import get_team_timesheet_data
from next_pms.timesheet.api.timesheet import save as save_timesheet
from next_pms.timesheet.api.utils import get_holidays

# _get_team_timesheet_data derives its date window *backward* from the anchor
# via build_aggregate_dates (unlike the resource_management team-view
# endpoint, which goes forward). Anchoring on the Monday of W2 yields
# exactly [W1, W2] = [2026-06-15..2026-06-21, 2026-06-22..2026-06-28] for
# max_week=2, which is where all the fixture timesheets below are dated.
# This assumes a Monday-start week, which setUpClass forces explicitly
# (System Settings' "first_day_of_the_week" isn't Monday by default on a
# fresh site — a CI-only failure the previous version of this fixture hit).
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
    """Shared fixtures for characterizing next_pms.timesheet.api.team.get_team_timesheet_data.

    This is a regression net for a perf refactor (see plan_refactor_team_timesheet.md) —
    it must lock current behavior exactly before any change to
    `_get_team_timesheet_data` / `paginate_qualifying_employee_payloads`.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Timesheet Manager")

        # Every fixture date above is a literal calendar date chosen assuming a
        # Monday-start week (build_aggregate_dates walks backward in whole-week
        # steps from `date`, per next_pms.timesheet.api.utils.get_week_dates ->
        # frappe.utils.get_first_day_of_week). System Settings' first_day_of_the_week
        # isn't Monday by default on a fresh site (a CI-only failure a previous
        # version of this fixture hit, since this dev site has it set to Monday
        # already) — pin it explicitly so the literal dates above are always correct.
        frappe.db.set_single_value("System Settings", "first_day_of_the_week", "Monday")

        # HRMS's own leave-balance validation (validate_balance_leaves ->
        # get_holiday_list_for_employee(..., raise_exception=True)) requires
        # *some* holiday list to be resolvable for every employee/company —
        # via an employee-level assignment, or falling back to a company-level
        # one. A fresh site (e.g. CI) may have neither, so guarantee a
        # company-level fallback here rather than relying on ambient data.
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

        # R1: two entries in W1, no entries in W2. Default "Not Submitted" status
        # (uniform across both of R1's timesheets, so no ambiguity in weekly status).
        cls._save(cls.r1, W1_MON, cls.task_alpha, 2, "r1 mon")
        cls._save(cls.r1, W1_TUE, cls.task_alpha, 3, "r1 tue")

        # R2: single entry in W1, patched to "Approved" for the whole week.
        cls._save(cls.r2, W1_TUE, cls.task_alpha, 4, "r2 tue")
        cls._set_week_status(cls.r2, W1_TUE, cls.project_alpha, "Approved")

        # R3: no timesheets at all — exercises the "no data but still qualifies
        # under no filters" invariant, plus a holiday override with no timesheet.

        # E1: does not report to mgr. Single entry in W2 on task_beta, patched
        # to "Rejected".
        cls._save(cls.e1, W2_MON, cls.task_beta, 1, "e1 mon")
        cls._set_week_status(cls.e1, W2_MON, cls.project_beta, "Rejected")

        # E2: does not report to mgr, no timesheets at all.

        # Leave for R1 on W1_WED (LWP so no Leave Allocation/balance is needed).
        cls.leave_type = cls._make_lwp_leave_type(LEAVE_TYPE_NAME)
        cls._make_leave_application(cls.r1, cls.leave_type, W1_WED)

        # Holiday for R3 on W1_THU, non-weekly-off (hour override branch).
        holiday_list = make_holiday_list(
            HOLIDAY_LIST_NAME,
            from_date="2026-01-01",
            to_date="2026-12-31",
            holiday_dates=[{"holiday_date": W1_THU, "description": "Test Holiday", "weekly_off": 0}],
        )
        # HRMS overrides holiday-list resolution (hooks.py employee_holiday_list) to use
        # a submitted "Holiday List Assignment" doc rather than Employee.holiday_list —
        # the plain field is ignored, so a direct frappe.db.set_value has no effect.
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
                # The rtcamp Employee doc-event derives leave_approver from reports_to
                # when left blank and errors on a None reports_to; set it up front.
                "leave_approver": "Administrator",
                "reports_to": reports_to,
                # project_currency's Timesheet override requires a costing rate,
                # which requires a salary currency on the employee.
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
        # Guarded (not per-class-unique like the employee fixtures below): all
        # three test classes in this module share the same company, and a
        # duplicate (assigned_to, from_date) assignment is a hard validation
        # error, so this must be idempotent across setUpClass calls.
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
    """reports_to=<manager>, no filters — the already-fast path.

    Fully controlled pool ({mgr's direct reports}), so this locks the exact
    per-employee payload shape (daily hours, leave/holiday overrides, notes,
    timesheet_details weeks/tasks) that the refactor's "fast path" must
    reproduce byte-for-byte.
    """

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
        # R1 has no employee-specific Holiday List Assignment, so it inherits
        # whatever the company-level default resolves to on this DB — computed
        # independently here rather than hardcoded, since it's ambient site data.
        # (get_holidays doesn't select "parent"; the production code path does,
        # so compare on the fields the two queries share.)
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
        # No timesheets at all, but with no filters every week still qualifies.
        self.assertEqual(len(r3_data["timesheet_details"]), 2)
        self.assertEqual(r3_data["timesheet_details"][week1_key]["tasks"], {})

    def test_reports_to_ordering_matches_employee_name_asc(self):
        res = self._call(reports_to=self.mgr)
        # Alphabetical by employee_name: "Arjun Malhotra" (r3), "Naveen Bhatt" (r1),
        # "Sanya Kapoor" (r2) — not creation order.
        self.assertEqual(list(res["data"].keys()), [self.r3, self.r1, self.r2])


class TestTeamTimesheetDataAllEmployees(_TeamTimesheetDataBase):
    """reports_to=None ("All") — the slow path this refactor targets.

    total_count is computed independently (a direct Employee count with the
    same status filter `filter_employees` applies) rather than hardcoded, so
    the test is robust to the ambient employee pool on a shared/live test DB.
    """

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

        # page_length=total_count fetches every active employee in one call,
        # so fixture presence/content can be checked without depending on
        # where they happen to land alphabetically among the ambient pool.
        res = self._call(reports_to=None, page_length=total_count, start=0)
        self.assertEqual(res["total_count"], total_count)
        self.assertFalse(res["has_more"])
        self.assertEqual(len(res["data"]), total_count)

        for employee in (self.mgr, self.r1, self.r2, self.r3, self.e1, self.e2):
            self.assertIn(employee, res["data"])

        # Note: global ordering across the *entire* result set is not asserted
        # here. This DB has genuine duplicate employee_name values (e.g.
        # several employees all named "Aarav Sharma"), and the current
        # implementation paginates internally in chunks of 50 via repeated
        # LIMIT/OFFSET queries — MySQL does not guarantee a stable tie-break
        # for equal employee_name values across separate queries, so the
        # relative order of same-named employees can legitimately differ
        # across chunk boundaries. `test_pagination_mechanics_and_no_overlap`
        # covers the real guarantee: each single page is name-sorted.

        # E1 (not a report of mgr) still appears under "All" with its own
        # status and hours — proving reports_to=None doesn't scope the pool.
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
    """search / approval_status / composite `filters` — the has_filters=True path.

    Unlike the "All" pool, these are deterministic regardless of ambient DB
    state: candidate selection is driven by which employees have a matching
    Timesheet Detail row, and our fixture project/task names are unique, so
    no pre-existing data can match them.
    """

    def test_search_scoped_to_reports_to(self):
        res = self._call(reports_to=self.mgr, search=TASK_ALPHA_SUBJECT)
        self.assertEqual(sorted(res["data"].keys()), [self.r1, self.r2])
        self.assertEqual(res["total_count"], 2)
        r1_weeks = res["data"][self.r1]["timesheet_details"]
        self.assertIn(self.task_alpha, next(iter(r1_weeks.values()))["tasks"])

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
        # project_beta timesheets belong only to E1, who does not report to mgr —
        # candidate_employee_ids narrows to E1, but the reports_to existence
        # check then finds 0, so the whole call short-circuits to empty.
        res = self._call(
            reports_to=self.mgr,
            filters=json.dumps([["Task", "project", "=", self.project_beta]]),
        )
        self.assertEqual(res["data"], {})
        self.assertEqual(res["total_count"], 0)
        self.assertFalse(res["has_more"])

    def test_skip_empty_weeks_prunes_weeks_without_tasks(self):
        with_skip = self._call(reports_to=self.mgr, search=TASK_ALPHA_SUBJECT, skip_empty_weeks=True)
        without_skip = self._call(reports_to=self.mgr, search=TASK_ALPHA_SUBJECT, skip_empty_weeks=False)

        self.assertEqual(sorted(with_skip["data"].keys()), [self.r1, self.r2])
        self.assertEqual(sorted(without_skip["data"].keys()), [self.r1, self.r2])

        for emp in (self.r1, self.r2):
            self.assertEqual(len(with_skip["data"][emp]["timesheet_details"]), 1)
            self.assertEqual(len(without_skip["data"][emp]["timesheet_details"]), 2)
