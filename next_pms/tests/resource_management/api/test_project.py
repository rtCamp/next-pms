import json
from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.resource_management.api.project import (
    _get_employees_resrouce_data_for_given_project,
    _get_resource_management_project_view_data,
    get_employees_resrouce_data_for_given_project,
    get_resource_management_project_view_data,
)
from next_pms.resource_management.api.utils.leave_calendar import get_leave_calendars
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.tests.utils import assign_empty_holiday_list, make_employee

WRITE_USER = "priya.sharma@example.com"
READ_ONLY_USER = "arjun.mehta@example.com"
RATE_CURRENCY_USER = "rate.currency@example.com"

START_DATE = "2026-06-15"
END_DATE = "2026-06-19"

# Employee fields the endpoint only returns to write-permitted callers.
PRIVILEGED_FIELDS = ("ctc", "salary_currency")

# The leave fixtures below sit inside the first week of the same window, so the
# project view's two-week window runs [2026-06-15, 2026-06-26].
WORKING_DAY = "2026-06-16"
FULL_LEAVE = "2026-06-17"
HALF_LEAVE = "2026-06-18"
# Second week — the employee is away but holds no allocation.
PUBLIC_HOLIDAY = "2026-06-23"
LEAVE_VIEW_END = "2026-06-26"

LEAVE_HOLIDAY_LIST = "Project View Leave Holiday List"
LEAVE_TYPE = "Project View Leave LWP"
LEAVE_CUSTOMER = "Project View Leave Customer"
LEAVE_PROJECT = "Project View Leave Project"

DAILY_HOURS = 8.0


class TestEmployeeResourceDataCacheIsolation(IntegrationTestCase):
    """get_employees_resrouce_data_for_given_project must scope its redis cache per
    permission level.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.project = cls._make_project()

        # Projects User grants write permission.
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Projects User")

        # The read-only user clears the endpoint's role gate through the Employee role,
        # which ERPNext grants by linking a User to an Employee.
        cls.read_only_user = cls._make_user(READ_ONLY_USER)
        cls.employee = cls._make_employee("Arjun Mehta", user_id=cls.read_only_user)
        cls._make_allocation(cls.employee, cls.project, is_billable=0)

        # A second, billable allocation so the is_billable filter has something to
        # include/exclude.
        cls.billable_employee = cls._make_employee("Neha Kapoor")
        cls._make_allocation(cls.billable_employee, cls.project, is_billable=1)

        frappe.clear_cache()

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
    def _make_project(cls):
        # Reuse any existing customer; this bench enforces unique customer
        # abbreviations, so minting one risks colliding with seeded data.
        customer = frappe.db.get_value("Customer", {}, "name")
        if not customer:
            customer = (
                frappe.get_doc(
                    {
                        "doctype": "Customer",
                        "customer_name": "Acme Corporation",
                        "customer_type": "Company",
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Website Redesign",
                "company": cls.company,
                "customer": customer,
                "custom_billing_type": "Non-Billable",
            }
        ).insert(ignore_permissions=True)
        return project.name

    @classmethod
    def _make_employee(cls, employee_name, user_id=None):
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
                # These test employees have no manager (reports_to is None). An HRMS
                # Employee validate hook errors while auto-deriving an approver when the
                # field is left blank, so set it explicitly to skip that path.
                "leave_approver": "Administrator",
                "user_id": user_id,
                "ctc": 100000,
                "salary_currency": "INR",
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_allocation(cls, employee, project, is_billable=0):
        frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": employee,
                "project": project,
                "allocation_start_date": START_DATE,
                "allocation_end_date": END_DATE,
                "hours_allocated_per_day": 8,
                "status": "Confirmed",
                "is_billable": is_billable,
            }
        ).insert(ignore_permissions=True)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call_as(self, user, is_billable=-1):
        frappe.set_user(user)
        return get_employees_resrouce_data_for_given_project(
            project=self.project, start_date=START_DATE, end_date=END_DATE, is_billable=is_billable
        )

    def _employee_entry(self, result):
        return next(entry for entry in result["data"] if entry["name"] == self.employee)

    def _employee_ids(self, result):
        return {entry["name"] for entry in result["data"]}

    def test_write_user_receives_privileged_fields(self):
        result = self._call_as(WRITE_USER)
        self.assertTrue(result["permissions"]["write"])
        entry = self._employee_entry(result)
        for field in PRIVILEGED_FIELDS:
            self.assertIn(field, entry)

    def test_read_only_user_excluded_from_privileged_fields(self):
        result = self._call_as(READ_ONLY_USER)
        self.assertFalse(result["permissions"]["write"])
        entry = self._employee_entry(result)
        for field in PRIVILEGED_FIELDS:
            self.assertNotIn(field, entry)

    def test_write_payload_not_leaked_to_read_only_user_via_cache(self):
        # Warm the cache as the write user, then hit the same arguments as the
        # read-only user. Under the old stacked-decorator caching this returned the
        # write user's cached payload (write=True, ctc present) to the read-only user.
        write_result = self._call_as(WRITE_USER)
        self.assertTrue(write_result["permissions"]["write"])

        read_result = self._call_as(READ_ONLY_USER)
        self.assertFalse(read_result["permissions"]["write"])
        entry = self._employee_entry(read_result)
        for field in PRIVILEGED_FIELDS:
            self.assertNotIn(field, entry)

    def test_write_user_is_billable_filter_applied(self):
        # is_billable=1 restricts the write caller to the billable allocation.
        result = self._call_as(WRITE_USER, is_billable=1)
        self.assertTrue(result["permissions"]["write"])
        ids = self._employee_ids(result)
        self.assertIn(self.billable_employee, ids)
        self.assertNotIn(self.employee, ids)

    def test_read_only_user_is_billable_filter_ignored(self):
        # The endpoint resets is_billable to -1 for non-write callers, so the
        # passed is_billable=1 is ignored and the non-billable allocation still shows.
        result = self._call_as(READ_ONLY_USER, is_billable=1)
        self.assertFalse(result["permissions"]["write"])
        ids = self._employee_ids(result)
        self.assertIn(self.billable_employee, ids)
        self.assertIn(self.employee, ids)

    def test_read_only_payload_not_leaked_to_write_user_via_cache(self):
        # The reverse direction: warming as the read-only user must not strip the
        # write user's privileged fields on the subsequent identical call.
        read_result = self._call_as(READ_ONLY_USER)
        self.assertFalse(read_result["permissions"]["write"])

        write_result = self._call_as(WRITE_USER)
        self.assertTrue(write_result["permissions"]["write"])
        entry = self._employee_entry(write_result)
        for field in PRIVILEGED_FIELDS:
            self.assertIn(field, entry)


class TestProjectLeaveReporting(IntegrationTestCase):
    """The project view has to say which days its people are away.

    Leave already removes the hours (`leave_sync`), so without this the payload reports a
    day that dropped to zero with nothing to explain it.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.holiday_list = cls._make_holiday_list()
        cls._make_leave_type()

        cls.employee_away = cls._make_employee("Project View Away")
        cls._assign_holiday_list(cls.employee_away)

        cls.employee_present = cls._make_employee("Project View Present")
        assign_empty_holiday_list(cls.employee_present)

        cls.customer = cls._make_customer()
        cls.project = cls._make_project()

        # Leave first: an allocation derives its day overrides on save, so this is the order
        # that exercises the same path the UI does.
        cls._apply_leave(cls.employee_away, FULL_LEAVE, FULL_LEAVE)
        cls._apply_leave(cls.employee_away, HALF_LEAVE, HALF_LEAVE, half_day=True)

        for employee in (cls.employee_away, cls.employee_present):
            cls._allocate(employee)

        frappe.db.commit()
        cls._clear_caches()

    @classmethod
    def tearDownClass(cls):
        for doctype, filters in (
            ("Resource Allocation", {"project": cls.project}),
            ("Leave Application", {"employee": ["in", [cls.employee_away, cls.employee_present]]}),
        ):
            for name in frappe.get_all(doctype, filters=filters, pluck="name"):
                frappe.delete_doc(doctype, name, force=1, ignore_permissions=True)
        frappe.db.commit()
        cls._clear_caches()
        super().tearDownClass()

    @staticmethod
    def _clear_caches():
        get_employee_leaves.clear_cache()
        _get_resource_management_project_view_data.clear_cache()
        _get_employees_resrouce_data_for_given_project.clear_cache()

    # --- fixtures ---------------------------------------------------------

    @classmethod
    def _make_holiday_list(cls):
        frappe.delete_doc_if_exists("Holiday List", LEAVE_HOLIDAY_LIST, force=1)
        holidays = [{"holiday_date": PUBLIC_HOLIDAY, "description": "Company Day"}]

        date = getdate("2026-01-01")
        while date <= getdate("2026-12-31"):
            if date.weekday() >= 5:
                holidays.append({"holiday_date": date, "description": date.strftime("%A"), "weekly_off": 1})
            date = add_days(date, 1)

        return (
            frappe.get_doc(
                {
                    "doctype": "Holiday List",
                    "holiday_list_name": LEAVE_HOLIDAY_LIST,
                    "from_date": "2026-01-01",
                    "to_date": "2026-12-31",
                    "holidays": holidays,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_leave_type(cls):
        if frappe.db.exists("Leave Type", LEAVE_TYPE):
            return LEAVE_TYPE

        return (
            frappe.get_doc(
                {
                    "doctype": "Leave Type",
                    "leave_type_name": LEAVE_TYPE,
                    "is_lwp": 1,
                    "include_holiday": 1,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_employee(cls, first_name):
        existing = frappe.db.get_value("Employee", {"employee_name": first_name})
        if existing:
            return existing

        return (
            frappe.get_doc(
                {
                    "doctype": "Employee",
                    "naming_series": "EMP-",
                    "first_name": first_name,
                    "company": cls.company,
                    "gender": "Female",
                    "date_of_birth": "1990-05-08",
                    "date_of_joining": "2013-01-01",
                    "status": "Active",
                    "employment_type": "Intern",
                    "leave_approver": "Administrator",
                    "custom_working_hours": DAILY_HOURS,
                    "custom_work_schedule": "Per Day",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _assign_holiday_list(cls, employee):
        """HRMS resolves holidays through Holiday List Assignment; the `holiday_list` field
        on Employee alone leaves them on the company default."""
        frappe.db.set_value("Employee", employee, "holiday_list", cls.holiday_list)

        if frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": employee, "holiday_list": cls.holiday_list, "docstatus": 1},
        ):
            return

        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Employee",
                "assigned_to": employee,
                "holiday_list": cls.holiday_list,
                "from_date": "2026-01-01",
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _make_customer(cls):
        existing = frappe.db.get_value("Customer", {"customer_name": LEAVE_CUSTOMER}, "name")
        if existing:
            return existing

        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": LEAVE_CUSTOMER,
                    "customer_type": "Company",
                    "default_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls):
        existing = frappe.db.get_value("Project", {"project_name": LEAVE_PROJECT})
        if existing:
            return existing

        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": LEAVE_PROJECT,
                    "company": cls.company,
                    "customer": cls.customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _apply_leave(cls, employee, from_date, to_date, half_day=False):
        get_employee_leaves.clear_cache()
        frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "leave_type": LEAVE_TYPE,
                "from_date": from_date,
                "to_date": to_date,
                "half_day": 1 if half_day else 0,
                "half_day_date": from_date if half_day else None,
                "description": "project view leave test",
                "leave_approver": "Administrator",
                "status": "Approved",
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _allocate(cls, employee):
        return (
            frappe.get_doc(
                {
                    "doctype": "Resource Allocation",
                    "employee": employee,
                    "project": cls.project,
                    "customer": cls.customer,
                    "allocation_start_date": START_DATE,
                    "allocation_end_date": END_DATE,
                    "hours_allocated_per_day": DAILY_HOURS,
                    "include_weekends": 0,
                    "status": "Confirmed",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    # --- callers ----------------------------------------------------------

    def _project_view(self):
        frappe.set_user("Administrator")
        return get_resource_management_project_view_data(
            date=START_DATE, max_week=2, project_id=json.dumps([self.project])
        )

    def _employee_view(self):
        frappe.set_user("Administrator")
        return get_employees_resrouce_data_for_given_project(
            project=self.project, start_date=START_DATE, end_date=LEAVE_VIEW_END
        )

    def _leave_days(self, employee):
        return self._project_view()["employee_leaves"].get(employee, {})

    def _allocation_entries(self, date):
        entry = next(row for row in self._project_view()["data"] if row["name"] == self.project)
        return entry["all_dates_data"][date]["project_resource_allocation_for_given_date"]

    def _employee_row(self, employee):
        return next(row for row in self._employee_view()["data"] if row["name"] == employee)

    # --- the project view --------------------------------------------------

    def test_full_day_leave_is_reported(self):
        self.assertEqual(
            self._leave_days(self.employee_away)[FULL_LEAVE],
            {"is_on_leave": True, "is_holiday": False, "total_leave_hours": DAILY_HOURS},
        )

    def test_half_day_leave_reports_half_the_day(self):
        self.assertEqual(
            self._leave_days(self.employee_away)[HALF_LEAVE],
            {"is_on_leave": True, "is_holiday": False, "total_leave_hours": DAILY_HOURS / 2},
        )

    def test_public_holiday_is_reported_without_a_leave_application(self):
        self.assertEqual(
            self._leave_days(self.employee_away)[PUBLIC_HOLIDAY],
            {
                "is_on_leave": True,
                "is_holiday": True,
                "total_leave_hours": DAILY_HOURS,
                "holiday_name": "Company Day",
            },
        )

    def test_only_the_days_off_are_reported(self):
        self.assertEqual(set(self._leave_days(self.employee_away)), {FULL_LEAVE, HALF_LEAVE, PUBLIC_HOLIDAY})

    def test_employee_without_leave_is_absent(self):
        self.assertNotIn(self.employee_present, self._project_view()["employee_leaves"])

    def test_leave_explains_the_hours_it_removed(self):
        entry = next(row for row in self._project_view()["data"] if row["name"] == self.project)

        # Only the present employee's 8 hours survive the full day of leave.
        self.assertEqual(entry["all_dates_data"][FULL_LEAVE]["total_allocated_hours"], DAILY_HOURS)
        self.assertEqual(entry["all_dates_data"][HALF_LEAVE]["total_allocated_hours"], DAILY_HOURS * 1.5)
        self.assertEqual(entry["all_dates_data"][WORKING_DAY]["total_allocated_hours"], DAILY_HOURS * 2)

    def test_allocation_of_the_day_carries_the_leave_flag(self):
        by_employee = {
            frappe.db.get_value("Resource Allocation", row["name"], "employee"): row
            for row in self._allocation_entries(FULL_LEAVE)
        }

        self.assertTrue(by_employee[self.employee_away]["is_on_leave"])
        self.assertFalse(by_employee[self.employee_present]["is_on_leave"])

    def test_day_off_outside_every_allocation_is_still_reported(self):
        """The holiday falls in week two, where nobody is allocated — the per-date breakdown
        has nothing to hang it on, so the leave payload is the only place it can surface."""
        entry = next(row for row in self._project_view()["data"] if row["name"] == self.project)

        self.assertNotIn(PUBLIC_HOLIDAY, entry["all_dates_data"])
        self.assertIn(PUBLIC_HOLIDAY, self._leave_days(self.employee_away))

    # --- the per-project employee view -------------------------------------

    def test_employee_view_reports_hours_away_per_day(self):
        self.assertEqual(
            self._employee_row(self.employee_away)["all_leave_data"],
            {FULL_LEAVE: DAILY_HOURS, HALF_LEAVE: DAILY_HOURS / 2, PUBLIC_HOLIDAY: DAILY_HOURS},
        )
        self.assertEqual(self._employee_row(self.employee_present)["all_leave_data"], {})

    def test_employee_view_flags_the_day(self):
        dates = self._employee_row(self.employee_away)["all_dates_data"]

        self.assertTrue(dates[FULL_LEAVE]["is_on_leave"])
        self.assertEqual(dates[FULL_LEAVE]["total_leave_hours"], DAILY_HOURS)
        self.assertEqual(dates[FULL_LEAVE]["total_allocated_hours"], 0)

        self.assertFalse(dates[WORKING_DAY]["is_on_leave"])
        self.assertEqual(dates[WORKING_DAY]["total_leave_hours"], 0.0)

    def test_employee_view_keeps_a_day_that_holds_nothing_but_leave(self):
        holiday = self._employee_row(self.employee_away)["all_dates_data"][PUBLIC_HOLIDAY]

        self.assertTrue(holiday["is_on_leave"])
        self.assertEqual(holiday["total_allocated_hours"], 0)
        self.assertEqual(holiday["employee_resource_allocation_for_given_date"], [])

    def test_employee_view_reports_the_daily_norm_the_leave_hours_are_measured_against(self):
        self.assertEqual(self._employee_row(self.employee_away)["employee_daily_working_hours"], DAILY_HOURS)

    # --- cost --------------------------------------------------------------

    def test_leave_calendar_cost_does_not_grow_with_the_page(self):
        """One leave query, one holiday-list-assignment query, one holiday query — whether the
        page holds two employees or fifty."""
        employees = frappe.get_all("Employee", filters={"status": "Active"}, fields=["name", "company"], limit=50)
        self.assertGreater(len(employees), 2, "need more than a couple of employees for this to mean anything")

        # Warm the doctype metas so the assertion below counts the work, not the first touch.
        get_leave_calendars([{"name": self.employee_away, "company": self.company}], START_DATE, LEAVE_VIEW_END)

        get_employee_leaves.clear_cache()
        with self.assertQueryCount(3):
            get_leave_calendars(employees, START_DATE, LEAVE_VIEW_END)


class TestProjectViewRateCurrency(IntegrationTestCase):
    """Both project endpoints restate CTC in the configured display currency.

    The allocation hover cards derive an hourly rate from the ctc/salary_currency the payload
    carries, so an endpoint that skips the conversion reports rates in whichever currency the
    employee happens to be paid in and the cards stop being comparable.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = frappe.db.get_value("Customer", {}, "name")
        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Rate Currency Project",
                "company": cls.company,
                "customer": cls.customer,
                "custom_billing_type": "Non-Billable",
            }
        ).insert(ignore_permissions=True)
        cls.employee = make_employee(RATE_CURRENCY_USER, cls.company, ctc=100000, salary_currency="INR")
        assign_empty_holiday_list(cls.employee)

        frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": cls.employee,
                "project": cls.project.name,
                "allocation_start_date": START_DATE,
                "allocation_end_date": END_DATE,
                "hours_allocated_per_day": 8,
                "status": "Confirmed",
                "is_billable": 0,
            }
        ).insert(ignore_permissions=True)

    def setUp(self):
        self.original_currency = frappe.db.get_single_value("Timesheet Settings", "default_currency")
        frappe.db.set_single_value("Timesheet Settings", "default_currency", "USD")
        self._clear_caches()

    def tearDown(self):
        frappe.db.set_single_value("Timesheet Settings", "default_currency", self.original_currency)
        self._clear_caches()

    @staticmethod
    def _clear_caches():
        _get_resource_management_project_view_data.clear_cache()
        _get_employees_resrouce_data_for_given_project.clear_cache()

    def test_project_view_reports_the_display_currency(self):
        with patch("erpnext.setup.utils.get_exchange_rate", return_value=0.012):
            result = get_resource_management_project_view_data(
                date=END_DATE, project_id=json.dumps([self.project.name])
            )

        employee = result["employees"][self.employee]
        self.assertEqual(employee["salary_currency"], "USD")
        self.assertAlmostEqual(employee["ctc"], 1200.0)

    def test_employee_view_reports_the_display_currency(self):
        with patch("erpnext.setup.utils.get_exchange_rate", return_value=0.012):
            result = get_employees_resrouce_data_for_given_project(
                project=self.project.name, start_date=START_DATE, end_date=END_DATE
            )

        entry = next(entry for entry in result["data"] if entry["name"] == self.employee)
        self.assertEqual(entry["salary_currency"], "USD")
        self.assertAlmostEqual(entry["ctc"], 1200.0)
