from datetime import date

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, flt, today

from next_pms.next_projects.api.project import (
    _allocated_day_count,
    _chargeable_hours,
    _remaining_cost_ratio,
    get_cost_forecasted,
    get_cost_forecasted_map,
    get_project_sidebar,
    get_projects_view,
)
from next_pms.resource_management.api.allocation import upsert_day_override

# Unique marker so `search` scopes every call to this suite's fixtures only.
FIXTURE_PREFIX = "CompSort"
BURN_FIXTURE_PREFIX = "BurnAccrued"
FORECAST_FIXTURE_PREFIX = "CostForecast"
ADJUSTED_FIXTURE_PREFIX = "CostAdjusted"

# 2026-05-04 is a Monday, so 05-08 is Friday and 05-09/05-10 are the weekend.
MONDAY = date(2026, 5, 4)
TUESDAY = date(2026, 5, 5)
WEDNESDAY = date(2026, 5, 6)
THURSDAY = date(2026, 5, 7)
FRIDAY = date(2026, 5, 8)
SATURDAY = date(2026, 5, 9)
SUNDAY = date(2026, 5, 10)
NEXT_MONDAY = date(2026, 5, 11)

NO_OVERRIDES: dict[date, float] = {}

ALLOCATION_COST = 1000.0
# suffix -> (start offset from today, end offset from today, expected share of ALLOCATION_COST)
FORECAST_FIXTURE_ROWS = {
    "FUTURE": (1, 5, 1.0),  # not started: whole cost is forecast
    "PAST": (-10, -1, 0.0),  # finished: entirely in cost_accrued
    "RUNNING": (-4, 5, 0.6),  # 10 days, today..+5 = 6 still ahead
    "STARTS_TODAY": (0, 4, 1.0),  # boundary: nothing elapsed yet
    "ENDS_TODAY": (-3, 0, 0.25),  # boundary: 4 days, only today ahead
}


class TestGetProjectsViewComputedSort(IntegrationTestCase):
    """get_projects_view sorts by computed fields (burn_rate_per_week,
    cost_burn_percent, total_budget, profit_margin, contract_end_date) via
    sort-key pagination: correct order across page boundaries, nulls last
    in both directions.

    Component amounts are written with db.set_value because they are
    read-only/rollup columns on Project.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        # name -> (billing_type, sales, estimated, costing, rate, billable, start_days_ago)
        # Derived values (cost_forecasted = 0, no allocations):
        #   total_budget:      A 1000, B 2000, C 3000, D 0
        #   cost_burn_percent: A 70,   B 25,   C 93.3, D 0 (budget<=0 guard)
        #     (billable/budget when billable; costing/budget for non-billable B and D)
        #   profit_margin:     A 50,   B 75,   C -100, D 0 (budget<=0 guard)
        #   burn_rate/week:    A 700,  B None, C 1400, D None
        fixture_rows = {
            "A": ("Fixed Cost", 1000, 0, 500, 100, 700, 7),
            "B": (None, 0, 2000, 500, 0, 0, 7),
            "C": ("Fixed Cost", 3000, 0, 6000, 100, 2800, 14),
            "D": (None, 0, 0, 100, 0, 0, None),
        }
        # name -> (status, expected_end_in_days, actual_end_in_days)
        # contract_end_date = actual_end_date when Completed/Cancelled, else expected_end_date:
        #   A +10, B +5, C +20 (Completed, actual wins over expected +2), D None
        end_date_rows = {
            "A": (None, 10, None),
            "B": (None, 5, None),
            "C": ("Completed", 2, 20),
            "D": (None, None, None),
        }
        cls.projects = {}
        for suffix, (billing_type, sales, estimated, costing, rate, billable, days_ago) in fixture_rows.items():
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"{FIXTURE_PREFIX} {suffix}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            status, end_in, actual_end_in = end_date_rows[suffix]
            values = {
                "custom_billing_type": billing_type,
                "total_sales_amount": sales,
                "estimated_costing": estimated,
                "total_costing_amount": costing,
                "custom_default_hourly_billing_rate": rate,
                "total_billable_amount": billable,
                "expected_start_date": add_days(today(), -days_ago) if days_ago else None,
                "expected_end_date": add_days(today(), end_in) if end_in else None,
                "actual_end_date": add_days(today(), actual_end_in) if actual_end_in else None,
            }
            if status:
                values["status"] = status
            frappe.db.set_value("Project", name, values, update_modified=False)
            cls.projects[suffix] = name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    def call(self, order_by, start=0, limit=20, view="list"):
        return get_projects_view(
            view=view,
            search=FIXTURE_PREFIX,
            start=start,
            limit=limit,
            order_by=order_by,
        )

    def fixture_order(self, result):
        by_name = {name: suffix for suffix, name in self.projects.items()}
        return [by_name[row["name"]] for row in result["data"]]

    def test_cost_burn_percent_sort(self):
        self.assertEqual(self.fixture_order(self.call("cost_burn_percent desc")), ["C", "A", "B", "D"])
        self.assertEqual(self.fixture_order(self.call("cost_burn_percent asc")), ["D", "B", "A", "C"])

    def test_total_budget_sort(self):
        self.assertEqual(self.fixture_order(self.call("total_budget desc")), ["C", "B", "A", "D"])
        self.assertEqual(self.fixture_order(self.call("total_budget asc")), ["D", "A", "B", "C"])

    def test_profit_margin_sort(self):
        self.assertEqual(self.fixture_order(self.call("profit_margin desc")), ["B", "A", "D", "C"])
        self.assertEqual(self.fixture_order(self.call("profit_margin asc")), ["C", "D", "A", "B"])

    def test_burn_rate_sort_nulls_last_both_directions(self):
        desc = self.fixture_order(self.call("burn_rate_per_week desc"))
        asc = self.fixture_order(self.call("burn_rate_per_week asc"))
        self.assertEqual(desc[:2], ["C", "A"])
        self.assertEqual(asc[:2], ["A", "C"])
        self.assertEqual(set(desc[2:]), {"B", "D"})
        self.assertEqual(set(asc[2:]), {"B", "D"})

    def test_contract_end_date_sort(self):
        self.assertEqual(self.fixture_order(self.call("contract_end_date desc")), ["C", "A", "B", "D"])
        self.assertEqual(self.fixture_order(self.call("contract_end_date asc")), ["B", "A", "C", "D"])

    def test_pagination_across_page_boundary(self):
        page_one = self.call("cost_burn_percent desc", start=0, limit=2)
        page_two = self.call("cost_burn_percent desc", start=2, limit=2)

        self.assertEqual(page_one["total_count"], 4)
        self.assertTrue(page_one["has_more"])
        self.assertFalse(page_two["has_more"])
        self.assertEqual(
            self.fixture_order(page_one) + self.fixture_order(page_two),
            ["C", "A", "B", "D"],
        )

    def test_stored_field_sort_unchanged(self):
        result = self.call("project_name asc")
        self.assertEqual(self.fixture_order(result), ["A", "B", "C", "D"])
        self.assertEqual(result["total_count"], 4)

    def test_kanban_falls_back_for_computed_field(self):
        result = self.call("cost_burn_percent desc", view="kanban")
        self.assertEqual(result["total_count"], 4)
        self.assertIn("columns", result)


class TestBudgetBurnAccrued(IntegrationTestCase):
    """The Budget Burn bar (project sidebar + projects list) burns the budget with
    billable amounts on billable projects and with costing amounts on non-billable
    ones, while cost-incurred metrics stay on costing amounts throughout.

    Both fixtures set costing != billable so every assertion discriminates between
    the two sources.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        # name -> (billing_type, sales, estimated, costing, billable)
        # Derived values (cost_forecasted = 0, no allocations):
        #   BILL:    budget 10000 (sales),     burn 7000 (billable), margin 70 (costing)
        #   NONBILL: budget  5000 (estimated), burn 2000 (costing),  margin 60 (costing)
        fixture_rows = {
            "BILL": ("Fixed Cost", 10000, 0, 3000, 7000),
            "NONBILL": ("Non-Billable", 0, 5000, 2000, 6000),
        }
        cls.projects = {}
        for suffix, (billing_type, sales, estimated, costing, billable) in fixture_rows.items():
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"{BURN_FIXTURE_PREFIX} {suffix}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            frappe.db.set_value(
                "Project",
                name,
                {
                    "custom_billing_type": billing_type,
                    "total_sales_amount": sales,
                    "estimated_costing": estimated,
                    "total_costing_amount": costing,
                    "total_billable_amount": billable,
                },
                update_modified=False,
            )
            cls.projects[suffix] = name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    def list_view(self, order_by=None):
        return get_projects_view(
            view="list",
            search=BURN_FIXTURE_PREFIX,
            start=0,
            limit=20,
            **({"order_by": order_by} if order_by else {}),
        )

    def list_row(self, suffix):
        return next(row for row in self.list_view()["data"] if row["name"] == self.projects[suffix])

    def test_list_burn_uses_billable_amount_when_billable(self):
        cost_burn = self.list_row("BILL")["cost_burn"]
        self.assertEqual(cost_burn["cost_accrued"], 7000)
        self.assertEqual(cost_burn["total_budget"], 10000)

    def test_list_burn_uses_costing_amount_when_non_billable(self):
        cost_burn = self.list_row("NONBILL")["cost_burn"]
        self.assertEqual(cost_burn["cost_accrued"], 2000)
        self.assertEqual(cost_burn["total_budget"], 5000)

    def test_sidebar_burn_matches_list_burn(self):
        for suffix, expected in (("BILL", 7000), ("NONBILL", 2000)):
            burn = get_project_sidebar(self.projects[suffix])["burn"]
            self.assertEqual(burn["cost_accrued"], expected, msg=suffix)
            self.assertEqual(burn["cost_accrued"], self.list_row(suffix)["cost_burn"]["cost_accrued"], msg=suffix)

    def test_profit_margin_stays_on_costing_amount(self):
        # Guards the cost_accrued / budget_burn_accrued split: billable amounts must
        # not leak into the margin. BILL would read 30 instead of 70 if they did.
        self.assertEqual(self.list_row("BILL")["profit_margin"], 70)
        self.assertEqual(self.list_row("NONBILL")["profit_margin"], 60)

    def test_cost_burn_percent_sort_ranks_by_burn_source(self):
        # BILL burns 70% (7000/10000), NONBILL 40% (2000/5000). Sorting the whole
        # list on costing amounts would put BILL at 30% and invert the order.
        by_name = {name: suffix for suffix, name in self.projects.items()}
        result = self.list_view(order_by="cost_burn_percent desc")
        self.assertEqual([by_name[row["name"]] for row in result["data"]], ["BILL", "NONBILL"])


class TestAllocationDayMath(IntegrationTestCase):
    """The pure helpers behind cost proration: how many days an allocation charges
    for, how many hours those days carry once day overrides are applied, and what
    fraction of the cost is still ahead of a given day.

    Dates are fixed (not relative to today) so the weekday assertions hold whichever
    day the suite runs on. NO_OVERRIDES keeps the plain-day cases readable.
    """

    def test_calendar_days_when_weekends_included(self):
        self.assertEqual(_allocated_day_count(MONDAY, SUNDAY, True), 7)
        self.assertEqual(_allocated_day_count(MONDAY, MONDAY, True), 1)

    def test_weekends_excluded_from_day_count(self):
        self.assertEqual(_allocated_day_count(MONDAY, SUNDAY, False), 5)
        self.assertEqual(_allocated_day_count(FRIDAY, NEXT_MONDAY, False), 2)
        self.assertEqual(_allocated_day_count(SATURDAY, SUNDAY, False), 0)

    def test_inverted_range_charges_nothing(self):
        self.assertEqual(_allocated_day_count(FRIDAY, MONDAY, False), 0)
        self.assertEqual(_chargeable_hours(FRIDAY, MONDAY, False, 8.0, NO_OVERRIDES), 0.0)

    def test_hours_default_to_the_daily_rate(self):
        self.assertAlmostEqual(_chargeable_hours(MONDAY, FRIDAY, False, 8.0, NO_OVERRIDES), 40.0)
        self.assertAlmostEqual(_chargeable_hours(MONDAY, SUNDAY, True, 8.0, NO_OVERRIDES), 56.0)

    def test_override_replaces_the_daily_rate(self):
        self.assertAlmostEqual(_chargeable_hours(MONDAY, FRIDAY, False, 8.0, {WEDNESDAY: 4.0}), 36.0)
        # cancelled days arrive as zero hours
        self.assertAlmostEqual(_chargeable_hours(MONDAY, FRIDAY, False, 8.0, {WEDNESDAY: 0.0}), 32.0)

    def test_override_outside_the_range_is_ignored(self):
        self.assertAlmostEqual(_chargeable_hours(MONDAY, WEDNESDAY, False, 8.0, {FRIDAY: 4.0}), 24.0)

    def test_override_adds_a_day_the_allocation_would_skip(self):
        # An explicit entry on a Saturday outranks the weekday-only default.
        self.assertAlmostEqual(_chargeable_hours(MONDAY, SUNDAY, False, 8.0, {SATURDAY: 3.0}), 43.0)

    def test_ratio_at_range_boundaries(self):
        # Not started yet, and finished: the whole cost is ahead / behind.
        self.assertEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, NO_OVERRIDES, MONDAY), 1.0)
        self.assertEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, NO_OVERRIDES, NEXT_MONDAY), 0.0)
        # Ending today still leaves today itself in the forecast.
        self.assertAlmostEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, NO_OVERRIDES, FRIDAY), 1 / 5)

    def test_ratio_mid_range_counts_today_as_forecast(self):
        # Mon-Fri with today = Wed: Wed, Thu, Fri remain.
        self.assertAlmostEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, NO_OVERRIDES, WEDNESDAY), 3 / 5)

    def test_ratio_skips_weekends_for_weekday_allocations(self):
        # Fri-Mon charges 2 days when weekends are excluded, 4 when they are not.
        self.assertAlmostEqual(_remaining_cost_ratio(FRIDAY, NEXT_MONDAY, False, 8.0, NO_OVERRIDES, SUNDAY), 1 / 2)
        self.assertAlmostEqual(_remaining_cost_ratio(FRIDAY, NEXT_MONDAY, True, 8.0, NO_OVERRIDES, SUNDAY), 2 / 4)

    def test_ratio_shrinks_when_a_remaining_day_is_shortened(self):
        # Mon-Fri, today = Wed. Halving Thursday drops the remaining hours from
        # 24/40 to 20/36 - a day-count split would still report 3/5.
        self.assertAlmostEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, {THURSDAY: 4.0}, WEDNESDAY), 20 / 36)

    def test_ratio_grows_when_an_elapsed_day_is_shortened(self):
        # Same range, but the shortened day is behind today: less of the cost was
        # spent, so more of it is still ahead.
        self.assertAlmostEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, {TUESDAY: 4.0}, WEDNESDAY), 24 / 36)

    def test_ratio_drops_a_cancelled_remaining_day(self):
        # Cancelling Friday leaves Wed + Thu of a 32-hour allocation.
        self.assertAlmostEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, {FRIDAY: 0.0}, WEDNESDAY), 16 / 32)

    def test_ratio_is_zero_when_every_day_is_cancelled(self):
        cancelled = dict.fromkeys((MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY), 0.0)
        self.assertEqual(_remaining_cost_ratio(MONDAY, FRIDAY, False, 8.0, cancelled, WEDNESDAY), 0.0)

    def test_weekend_only_range_falls_back_to_calendar_days(self):
        # No chargeable weekday in range: prorate on calendar days rather than
        # dividing by zero and dropping a non-zero total_cost.
        self.assertAlmostEqual(_remaining_cost_ratio(SATURDAY, SUNDAY, False, 8.0, NO_OVERRIDES, SUNDAY), 1 / 2)

    def test_hour_split_matches_day_split_without_overrides(self):
        # The hours model must not move the answer when every day is uniform.
        for include_weekends in (True, False):
            expected = _allocated_day_count(WEDNESDAY, NEXT_MONDAY, include_weekends) / _allocated_day_count(
                MONDAY, NEXT_MONDAY, include_weekends
            )
            self.assertAlmostEqual(
                _remaining_cost_ratio(MONDAY, NEXT_MONDAY, include_weekends, 8.0, NO_OVERRIDES, WEDNESDAY),
                expected,
                msg=f"include_weekends={include_weekends}",
            )


class TestCostForecastedProration(IntegrationTestCase):
    """cost_forecasted counts only the allocation cost still ahead of today.

    A running allocation has its elapsed days already realized in the project's
    total_costing_amount (cost_accrued) via timesheets, so counting it in full
    double-counts them. Fixtures set include_weekends so the expected split is a
    plain calendar-day ratio whichever weekday the suite runs on.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = cls._get_customer()
        cls.employee = cls._make_employee()

        cls.projects = {}
        for suffix, (start_offset, end_offset, _) in FORECAST_FIXTURE_ROWS.items():
            project = frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": f"{FORECAST_FIXTURE_PREFIX} {suffix}",
                    "company": cls.company,
                    "customer": cls.customer,
                }
            ).insert(ignore_permissions=True)
            cls._make_allocation(project.name, start_offset, end_offset)
            cls.projects[suffix] = project.name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    @classmethod
    def _get_customer(cls):
        # Reuse a seeded customer; this bench enforces unique customer abbreviations,
        # so minting one risks colliding with existing data.
        customer = frappe.db.get_value("Customer", {"disabled": 0}, "name")
        if customer:
            return customer
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": f"{FORECAST_FIXTURE_PREFIX} Customer",
                    "customer_type": "Company",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_employee(cls):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": f"{FORECAST_FIXTURE_PREFIX} Resource",
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                # An HRMS validate hook errors while auto-deriving an approver when
                # reports_to and leave_approver are both blank.
                "leave_approver": "Administrator",
                "ctc": 100000,
                "salary_currency": "INR",
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_allocation(cls, project, start_offset, end_offset):
        allocation = frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": cls.employee,
                "project": project,
                "allocation_start_date": add_days(today(), start_offset),
                "allocation_end_date": add_days(today(), end_offset),
                "hours_allocated_per_day": 8,
                "include_weekends": 1,
                "status": "Confirmed",
            }
        ).insert(ignore_permissions=True)
        # total_cost is read-only and derived from the employee's CTC; pin it so the
        # expected split is exact and independent of salary setup.
        frappe.db.set_value(
            "Resource Allocation", allocation.name, "total_cost", ALLOCATION_COST, update_modified=False
        )
        return allocation.name

    def expected(self, suffix):
        return ALLOCATION_COST * FORECAST_FIXTURE_ROWS[suffix][2]

    def test_map_prorates_every_allocation_state(self):
        forecast = get_cost_forecasted_map(list(self.projects.values()))
        for suffix, project in self.projects.items():
            self.assertAlmostEqual(flt(forecast.get(project, 0.0)), self.expected(suffix), msg=suffix)

    def test_running_allocation_drops_its_elapsed_days(self):
        # The regression: summing total_cost in full would report 1000 here and
        # double-count the 4 elapsed days that are already in cost_accrued.
        forecast = get_cost_forecasted(self.projects["RUNNING"])
        self.assertAlmostEqual(forecast, 600.0)
        self.assertLess(forecast, ALLOCATION_COST)

    def test_finished_allocation_is_not_forecast(self):
        self.assertEqual(get_cost_forecasted(self.projects["PAST"]), 0.0)

    def test_single_project_matches_map(self):
        forecast = get_cost_forecasted_map(list(self.projects.values()))
        for suffix, project in self.projects.items():
            self.assertAlmostEqual(get_cost_forecasted(project), flt(forecast.get(project, 0.0)), msg=suffix)

    def test_empty_input_skips_queries(self):
        self.assertEqual(get_cost_forecasted_map([]), {})

    def test_list_view_reports_prorated_forecast(self):
        result = get_projects_view(view="list", search=FORECAST_FIXTURE_PREFIX, start=0, limit=20)
        rows = {row["name"]: row for row in result["data"]}
        for suffix, project in self.projects.items():
            self.assertAlmostEqual(
                flt(rows[project]["cost_burn"]["cost_forecasted"]), self.expected(suffix), msg=suffix
            )


class TestCostForecastedAdjustments(IntegrationTestCase):
    """A running allocation is split by chargeable hours, not by days, so day
    overrides and an employee's relieving date land on the right side of today.

    Every fixture spans today-4 to today+5 with include_weekends, so a plain
    day-count split would report 600 for all of them; each expected value below
    is deliberately something else. hours_allocated_per_day is 8, giving 80 hours
    before adjustments.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = TestCostForecastedProration._get_customer()
        cls.employee = cls._make_employee("Adjusted")
        cls.relieved_employee = cls._make_employee("Relieved")

        cls.projects = {}
        for suffix in ("OVERRIDE_AHEAD", "OVERRIDE_BEHIND", "CANCELLED_AHEAD", "RELIEVED"):
            cls.projects[suffix] = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"{ADJUSTED_FIXTURE_PREFIX} {suffix}",
                        "company": cls.company,
                        "customer": cls.customer,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )

        # Thursday-hours cut in half, ahead of today: 76 total hours, 44 still ahead.
        cls._make_allocation("OVERRIDE_AHEAD", cls.employee, {"date": add_days(today(), 1), "hours": 4.0})
        # Same cut, but already elapsed: 76 total hours, all 48 remaining ones intact.
        cls._make_allocation("OVERRIDE_BEHIND", cls.employee, {"date": add_days(today(), -2), "hours": 4.0})
        # A cancelled day ahead of today: 72 total hours, 40 still ahead.
        cls._make_allocation("CANCELLED_AHEAD", cls.employee, {"date": add_days(today(), 1), "cancelled": 1})
        cls._make_allocation("RELIEVED", cls.relieved_employee)

        # Set after the allocation exists and with db.set_value, so the Employee
        # on_update hook does not rewrite total_cost out from under the fixture.
        frappe.db.set_value(
            "Employee",
            cls.relieved_employee,
            {"relieving_date": add_days(today(), 2), "status": "Left"},
            update_modified=False,
        )

        frappe.set_user("Administrator")
        frappe.clear_cache()

    @classmethod
    def _make_employee(cls, label):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": f"{ADJUSTED_FIXTURE_PREFIX} {label}",
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                "leave_approver": "Administrator",
                "ctc": 100000,
                "salary_currency": "INR",
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_allocation(cls, suffix, employee, override=None):
        allocation = frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": employee,
                "project": cls.projects[suffix],
                "allocation_start_date": add_days(today(), -4),
                "allocation_end_date": add_days(today(), 5),
                "hours_allocated_per_day": 8,
                "include_weekends": 1,
                "status": "Confirmed",
            }
        ).insert(ignore_permissions=True)

        if override:
            fields = {k: v for k, v in override.items() if k != "date"}
            upsert_day_override(allocation.name, str(override["date"]), fields)

        # Pinned last: adding an override re-saves the doc, which recomputes total_cost.
        frappe.db.set_value(
            "Resource Allocation", allocation.name, "total_cost", ALLOCATION_COST, update_modified=False
        )
        return allocation.name

    def forecast(self, suffix):
        return get_cost_forecasted(self.projects[suffix])

    def test_shortened_day_ahead_of_today_lowers_the_forecast(self):
        self.assertAlmostEqual(self.forecast("OVERRIDE_AHEAD"), ALLOCATION_COST * 44 / 76, places=4)

    def test_shortened_day_behind_today_raises_the_forecast(self):
        # Less was spent before today, so more of the same total is still ahead.
        self.assertAlmostEqual(self.forecast("OVERRIDE_BEHIND"), ALLOCATION_COST * 48 / 76, places=4)

    def test_cancelled_day_leaves_the_forecast(self):
        self.assertAlmostEqual(self.forecast("CANCELLED_AHEAD"), ALLOCATION_COST * 40 / 72, places=4)

    def test_forecast_stops_at_the_relieving_date(self):
        # total_cost is already clamped to [start, relieving] by the Employee hook,
        # so the split has to use the same window or it overstates what is left.
        self.assertAlmostEqual(self.forecast("RELIEVED"), ALLOCATION_COST * 24 / 56, places=4)

    def test_none_of_these_match_a_plain_day_split(self):
        # Guards the whole class: a day-count split reports 600 for every fixture.
        day_count_split = ALLOCATION_COST * 6 / 10
        for suffix in self.projects:
            self.assertNotAlmostEqual(self.forecast(suffix), day_count_split, places=2, msg=suffix)

    def test_map_agrees_with_single_project_lookup(self):
        forecast = get_cost_forecasted_map(list(self.projects.values()))
        for suffix, project in self.projects.items():
            self.assertAlmostEqual(flt(forecast.get(project, 0.0)), self.forecast(suffix), msg=suffix)
