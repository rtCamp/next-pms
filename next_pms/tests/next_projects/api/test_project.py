import json
from datetime import date

import frappe
from erpnext import get_default_company
from frappe.desk.doctype.tag.tag import add_tag
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, flt, today

from next_pms.next_projects.api.project import (
    _allocated_day_count,
    _chargeable_hours,
    _remaining_cost_ratio,
    get_cost_forecasted,
    get_cost_forecasted_map,
    get_forecast_map,
    get_project_forecast,
    get_project_sidebar,
    get_project_tracking,
    get_projects_view,
)
from next_pms.next_projects.api.utils import resolve_tag_filters
from next_pms.project_currency.billing_rate import (
    BILLING_RATE_COST_MULTIPLIER,
    get_billing_rate_context,
    resolve_billing_rate,
)
from next_pms.resource_management.api.allocation import upsert_day_override
from next_pms.tests.utils import assign_empty_holiday_list

# Unique marker so `search` scopes every call to this suite's fixtures only.
FIXTURE_PREFIX = "CompSort"
BURN_FIXTURE_PREFIX = "BurnAccrued"
FORECAST_FIXTURE_PREFIX = "CostForecast"
ADJUSTED_FIXTURE_PREFIX = "CostAdjusted"
BUDGET_FIXTURE_PREFIX = "BudgetForecast"
TAG_FIXTURE_PREFIX = "TagFilter"

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
        assign_empty_holiday_list(employee.name)
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
        assign_empty_holiday_list(employee.name)
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


class TestSidebarBillingTeamGate(IntegrationTestCase):
    """get_project_sidebar exposes billing team members only on Time and
    Material projects; every other billing type gets an empty list even when
    rows exist in the child table.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": "SidebarTeam Member",
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                "leave_approver": "Administrator",
            }
        )
        employee.insert(ignore_permissions=True)
        cls.employee = employee.name

        cls.projects = {}
        for suffix, billing_type in {
            "TNM": "Time and Material",
            "FIXED": "Fixed Cost",
            "RETAINER": "Retainer",
        }.items():
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"SidebarTeam {suffix}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            frappe.db.set_value("Project", name, "custom_billing_type", billing_type, update_modified=False)
            frappe.get_doc(
                {
                    "doctype": "Project Billing Team",
                    "parenttype": "Project",
                    "parent": name,
                    "parentfield": "custom_project_billing_team",
                    "employee": cls.employee,
                    "hourly_billing_rate": 100,
                    "valid_from": today(),
                }
            ).insert(ignore_permissions=True)
            cls.projects[suffix] = name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    def test_time_and_material_returns_members(self):
        billing_team = get_project_sidebar(self.projects["TNM"])["billing_team"]
        self.assertEqual(len(billing_team), 1)
        self.assertEqual(billing_team[0]["employee_id"], self.employee)

    def test_other_billing_types_return_empty(self):
        for suffix in ("FIXED", "RETAINER"):
            self.assertEqual(get_project_sidebar(self.projects[suffix])["billing_team"], [], msg=suffix)


class TestTrackingBillingTables(IntegrationTestCase):
    """get_project_tracking returns the contracts and project_rates tables for
    Fixed Cost, Retainer and Time and Material projects, and None for
    Non-Billable ones.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.projects = {}
        for suffix, billing_type in {
            "TNM": "Time and Material",
            "FIXED": "Fixed Cost",
            "RETAINER": "Retainer",
            "NONBILL": "Non-Billable",
        }.items():
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"TrackingTables {suffix}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            frappe.db.set_value("Project", name, "custom_billing_type", billing_type, update_modified=False)
            cls.projects[suffix] = name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    def test_billable_types_get_both_tables(self):
        for suffix in ("TNM", "FIXED", "RETAINER"):
            tracking = get_project_tracking(self.projects[suffix])
            self.assertIsInstance(tracking["contracts"], list, msg=suffix)
            self.assertIsInstance(tracking["project_rates"], list, msg=suffix)

    def test_non_billable_gets_neither_table(self):
        tracking = get_project_tracking(self.projects["NONBILL"])
        self.assertIsNone(tracking["contracts"])
        self.assertIsNone(tracking["project_rates"])


class TestResolveBillingRate(IntegrationTestCase):
    """The rate an employee's forecast work bills at, resolved in the same order
    Timesheet.get_activity_billing_rate applies: a Time and Material project rates each
    member off its billing team, every other billing type rates the whole project off its
    default rate, and a project with no rate at all falls back to a multiple of cost.

    resolve_billing_rate takes its project and billing team rows as plain data, so every
    case below is exercised without touching the database.
    """

    COST_RATE = 100.0

    def project(self, billing_type, default_rate=0.0):
        return {"PROJ": frappe._dict(custom_billing_type=billing_type, custom_default_hourly_billing_rate=default_rate)}

    def team(self, *rows):
        return {("PROJ", "EMP"): [frappe._dict(**row) for row in rows]}

    def resolve(self, project_map, context=None, employee="EMP"):
        return resolve_billing_rate("PROJ", employee, self.COST_RATE, date(2026, 6, 1), project_map, context or {})

    def test_non_billable_project_never_bills(self):
        self.assertEqual(self.resolve(self.project("Non-Billable", default_rate=500)), 0.0)

    def test_unknown_project_never_bills(self):
        self.assertEqual(self.resolve({}), 0.0)

    def test_flat_rate_projects_use_the_project_default(self):
        for billing_type in ("Fixed Cost", "Retainer", "Time and Material"):
            self.assertEqual(self.resolve(self.project(billing_type, default_rate=500)), 500.0, msg=billing_type)

    def test_missing_rate_falls_back_to_a_multiple_of_cost(self):
        for billing_type in ("Fixed Cost", "Retainer", "Time and Material"):
            self.assertEqual(
                self.resolve(self.project(billing_type)),
                BILLING_RATE_COST_MULTIPLIER * self.COST_RATE,
                msg=billing_type,
            )

    def test_time_and_material_prefers_the_member_rate(self):
        context = self.team({"hourly_billing_rate": 700, "valid_from": date(2026, 1, 1)})
        self.assertEqual(self.resolve(self.project("Time and Material", default_rate=500), context), 700.0)

    def test_flat_rate_projects_ignore_the_billing_team(self):
        # The regression: a member rate on a Fixed Cost or Retainer project is not
        # contractual, so billing it would overstate the forecast.
        context = self.team({"hourly_billing_rate": 700, "valid_from": date(2026, 1, 1)})
        for billing_type in ("Fixed Cost", "Retainer"):
            self.assertEqual(
                self.resolve(self.project(billing_type, default_rate=500), context), 500.0, msg=billing_type
            )

    def test_latest_effective_member_rate_wins(self):
        context = self.team(
            {"hourly_billing_rate": 900, "valid_from": date(2026, 5, 1)},
            {"hourly_billing_rate": 700, "valid_from": date(2026, 1, 1)},
        )
        self.assertEqual(self.resolve(self.project("Time and Material"), context), 900.0)

    def test_member_rate_that_has_not_taken_effect_is_skipped(self):
        context = self.team(
            {"hourly_billing_rate": 900, "valid_from": date(2026, 9, 1)},
            {"hourly_billing_rate": 700, "valid_from": date(2026, 1, 1)},
        )
        self.assertEqual(self.resolve(self.project("Time and Material"), context), 700.0)

    def test_member_rate_without_a_start_date_is_skipped(self):
        context = self.team({"hourly_billing_rate": 900, "valid_from": None})
        self.assertEqual(self.resolve(self.project("Time and Material", default_rate=500), context), 500.0)

    def test_another_employees_rate_is_not_borrowed(self):
        context = self.team({"hourly_billing_rate": 700, "valid_from": date(2026, 1, 1)})
        self.assertEqual(
            self.resolve(self.project("Time and Material", default_rate=500), context, employee="OTHER"), 500.0
        )


class TestBudgetForecasted(IntegrationTestCase):
    """Forecast budget burn is remaining allocation hours priced at each member's
    billable rate, which is a different figure from forecast cost (hours priced at CTC).

    Every allocation below books 40 hours and a pinned total_cost, so a fixture's budget
    is never confusable with its cost.
    """

    HOURS = 40.0
    # RUNNING spans 10 days rather than the 5 every other fixture allocation covers.
    RUNNING_HOURS = 80.0
    COST_RATE = 100.0
    FLAT_RATE = 500.0
    MEMBER_RATE = 700.0

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = TestCostForecastedProration._get_customer()
        cls.employee = cls._make_employee("Member")
        cls.other_employee = cls._make_employee("Other")

        # suffix -> (billing type, project default rate)
        specs = {
            "FLAT": ("Fixed Cost", cls.FLAT_RATE),
            "RETAINER": ("Retainer", cls.FLAT_RATE),
            "MULTIPLIER": ("Fixed Cost", 0),
            "NON_BILLABLE_RESOURCE": ("Fixed Cost", cls.FLAT_RATE),
            "NON_BILLABLE_PROJECT": ("Non-Billable", 0),
            "TIME_AND_MATERIAL": ("Time and Material", cls.FLAT_RATE),
            "TIME_AND_MATERIAL_NO_ROW": ("Time and Material", cls.FLAT_RATE),
            "RUNNING": ("Fixed Cost", cls.FLAT_RATE),
        }
        cls.projects = {
            suffix: cls._make_project(suffix, billing_type, rate) for suffix, (billing_type, rate) in specs.items()
        }

        # Only the Time and Material project rates its members individually.
        for suffix in ("TIME_AND_MATERIAL", "TIME_AND_MATERIAL_NO_ROW"):
            project = frappe.get_doc("Project", cls.projects[suffix])
            project.append(
                "custom_project_billing_team",
                {
                    "employee": cls.employee if suffix == "TIME_AND_MATERIAL" else cls.other_employee,
                    "hourly_billing_rate": cls.MEMBER_RATE,
                    "valid_from": add_days(today(), -30),
                },
            )
            project.save(ignore_permissions=True)

        for suffix in cls.projects:
            if suffix == "RUNNING":
                continue
            cls._make_allocation(suffix, start=1, end=5, is_billable=suffix != "NON_BILLABLE_RESOURCE")
        # 10 days with weekends, today..+5 still ahead: 60% of both cost and budget.
        cls._make_allocation("RUNNING", start=-4, end=5)

        frappe.set_user("Administrator")
        frappe.clear_cache()

    @classmethod
    def _make_employee(cls, label):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": f"{BUDGET_FIXTURE_PREFIX} {label}",
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
        assign_empty_holiday_list(employee.name)
        return employee.name

    @classmethod
    def _make_project(cls, suffix, billing_type, default_rate):
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": f"{BUDGET_FIXTURE_PREFIX} {suffix}",
                    "company": cls.company,
                    "customer": cls.customer,
                    "custom_billing_type": billing_type,
                    "custom_default_hourly_billing_rate": default_rate,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_allocation(cls, suffix, start, end, is_billable=True):
        allocation = frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": cls.employee,
                "project": cls.projects[suffix],
                "allocation_start_date": add_days(today(), start),
                "allocation_end_date": add_days(today(), end),
                "hours_allocated_per_day": 8,
                "include_weekends": 1,
                "is_billable": int(is_billable),
                "status": "Confirmed",
            }
        ).insert(ignore_permissions=True)
        # Both are read-only and derived from the employee's CTC; pin them so every
        # expectation below is exact and independent of salary setup.
        frappe.db.set_value(
            "Resource Allocation",
            allocation.name,
            {"total_cost": ALLOCATION_COST, "hourly_cost_rate": cls.COST_RATE},
            update_modified=False,
        )
        return allocation.name

    def forecast(self, suffix):
        project = frappe.db.get_value(
            "Project",
            self.projects[suffix],
            ["custom_billing_type", "custom_default_hourly_billing_rate"],
            as_dict=True,
        )
        return get_project_forecast(self.projects[suffix], project)

    def test_flat_rate_projects_bill_hours_at_the_project_rate(self):
        for suffix in ("FLAT", "RETAINER"):
            self.assertAlmostEqual(self.forecast(suffix)["budget"], self.HOURS * self.FLAT_RATE, msg=suffix)

    def test_project_without_a_rate_bills_a_multiple_of_cost(self):
        self.assertAlmostEqual(
            self.forecast("MULTIPLIER")["budget"],
            self.HOURS * BILLING_RATE_COST_MULTIPLIER * self.COST_RATE,
        )

    def test_time_and_material_bills_the_member_rate(self):
        self.assertAlmostEqual(self.forecast("TIME_AND_MATERIAL")["budget"], self.HOURS * self.MEMBER_RATE)

    def test_time_and_material_without_a_member_row_bills_the_project_rate(self):
        self.assertAlmostEqual(self.forecast("TIME_AND_MATERIAL_NO_ROW")["budget"], self.HOURS * self.FLAT_RATE)

    def test_non_billable_resource_burns_cost_but_not_budget(self):
        forecast = self.forecast("NON_BILLABLE_RESOURCE")
        self.assertEqual(forecast["budget"], 0.0)
        self.assertAlmostEqual(forecast["cost"], ALLOCATION_COST)

    def test_non_billable_project_has_no_budget_to_burn(self):
        forecast = self.forecast("NON_BILLABLE_PROJECT")
        self.assertEqual(forecast["budget"], 0.0)
        self.assertAlmostEqual(forecast["cost"], ALLOCATION_COST)

    def test_running_allocation_prorates_budget_like_cost(self):
        forecast = self.forecast("RUNNING")
        self.assertAlmostEqual(forecast["budget"], 0.6 * self.RUNNING_HOURS * self.FLAT_RATE)
        self.assertAlmostEqual(forecast["cost"], 0.6 * ALLOCATION_COST)

    def test_budget_is_not_a_restatement_of_cost(self):
        # Guards the whole class: reporting cost as budget passes nothing here.
        for suffix in ("FLAT", "RETAINER", "MULTIPLIER", "TIME_AND_MATERIAL", "RUNNING"):
            forecast = self.forecast(suffix)
            self.assertNotAlmostEqual(forecast["budget"], forecast["cost"], places=2, msg=suffix)

    def test_cost_is_unchanged_by_forecasting_budget(self):
        # The regression guard for generalising get_cost_forecasted_map: asking for budget
        # must not perturb the cost figure the project list view has always read.
        names = list(self.projects.values())
        cost_only = get_cost_forecasted_map(names)
        with_budget = get_forecast_map(names, with_budget=True)
        for suffix, project in self.projects.items():
            self.assertAlmostEqual(with_budget[project]["cost"], flt(cost_only.get(project, 0.0)), places=6, msg=suffix)

    def test_billing_rate_context_only_loads_time_and_material_projects(self):
        project_map = {
            name: frappe.db.get_value(
                "Project", name, ["custom_billing_type", "custom_default_hourly_billing_rate"], as_dict=True
            )
            for name in self.projects.values()
        }
        context = get_billing_rate_context(project_map)
        self.assertEqual(
            {project for project, _employee in context},
            {self.projects["TIME_AND_MATERIAL"], self.projects["TIME_AND_MATERIAL_NO_ROW"]},
        )

    def test_tracking_reports_the_budget_burn(self):
        tracking = get_project_tracking(self.projects["FLAT"])
        self.assertAlmostEqual(tracking["budget_burn"]["forecasted"], self.HOURS * self.FLAT_RATE)
        self.assertEqual(tracking["budget_burn"]["actual"], 0.0)
        self.assertEqual(tracking["budget_burn"]["total_budget"], tracking["total_project_value"])
        # Cost burn keeps reporting cost, not budget.
        self.assertAlmostEqual(tracking["forecasted_cost_to_completion"], ALLOCATION_COST)

    def test_tracking_omits_budget_burn_for_non_billable(self):
        self.assertIsNone(get_project_tracking(self.projects["NON_BILLABLE_PROJECT"])["budget_burn"])

    def test_sidebar_reports_budget_and_cost_forecasts_apart(self):
        burn = get_project_sidebar(self.projects["FLAT"])["burn"]
        self.assertAlmostEqual(burn["budget_forecasted"], self.HOURS * self.FLAT_RATE)
        self.assertAlmostEqual(burn["cost_forecasted"], ALLOCATION_COST)


class TestGetProjectsViewTagFilter(IntegrationTestCase):
    """The projects list/kanban composite filter supports a `tag` condition,
    resolved against the Tag Link doctype that ERPNext already maintains for the
    tags shown on the Project form.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        # suffix -> tags assigned through the ERPNext tagging API
        fixture_tags = {
            "A": [f"{TAG_FIXTURE_PREFIX} Alpha", f"{TAG_FIXTURE_PREFIX} Beta"],
            "B": [f"{TAG_FIXTURE_PREFIX} Beta"],
            "C": [],
        }
        cls.projects = {}
        for suffix, tags in fixture_tags.items():
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"{TAG_FIXTURE_PREFIX} {suffix}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            for tag in tags:
                add_tag(tag, "Project", name)
            cls.projects[suffix] = name

        frappe.set_user("Administrator")
        frappe.clear_cache()

    def matched(self, filters, view="list"):
        result = get_projects_view(view=view, search=TAG_FIXTURE_PREFIX, filters=filters, limit=50)
        by_name = {name: suffix for suffix, name in self.projects.items()}
        return {by_name[row["name"]] for row in result["data"]}, result["total_count"]

    def test_no_filter_returns_every_fixture(self):
        self.assertEqual(self.matched([]), ({"A", "B", "C"}, 3))

    def test_equals_returns_only_the_tagged_projects(self):
        self.assertEqual(self.matched([["tag", "=", f"{TAG_FIXTURE_PREFIX} Beta"]]), ({"A", "B"}, 2))
        self.assertEqual(self.matched([["tag", "=", f"{TAG_FIXTURE_PREFIX} Alpha"]]), ({"A"}, 1))

    def test_not_equals_excludes_the_tagged_projects(self):
        self.assertEqual(self.matched([["tag", "!=", f"{TAG_FIXTURE_PREFIX} Beta"]]), ({"C"}, 1))

    def test_unknown_tag_matches_nothing(self):
        self.assertEqual(self.matched([["tag", "=", f"{TAG_FIXTURE_PREFIX} Missing"]]), (set(), 0))
        self.assertEqual(self.matched([["tag", "!=", f"{TAG_FIXTURE_PREFIX} Missing"]]), ({"A", "B", "C"}, 3))

    def test_tag_conditions_combine_with_each_other(self):
        filters = [
            ["tag", "=", f"{TAG_FIXTURE_PREFIX} Alpha"],
            ["tag", "=", f"{TAG_FIXTURE_PREFIX} Beta"],
        ]
        self.assertEqual(self.matched(filters), ({"A"}, 1))

    def test_tag_condition_combines_with_project_fields(self):
        frappe.db.set_value("Project", self.projects["A"], "status", "Completed", update_modified=False)
        self.addCleanup(frappe.db.set_value, "Project", self.projects["A"], "status", "Open", update_modified=False)
        filters = [["tag", "=", f"{TAG_FIXTURE_PREFIX} Beta"], ["status", "=", "Open"]]
        self.assertEqual(self.matched(filters), ({"B"}, 1))

    def test_kanban_view_applies_the_same_filter(self):
        result = get_projects_view(
            view="kanban",
            search=TAG_FIXTURE_PREFIX,
            filters=[["tag", "=", f"{TAG_FIXTURE_PREFIX} Alpha"]],
            limit=50,
        )
        self.assertEqual(result["total_count"], 1)

    def test_json_encoded_filters_are_accepted(self):
        filters = json.dumps([["tag", "=", f"{TAG_FIXTURE_PREFIX} Alpha"]])
        self.assertEqual(self.matched(filters), ({"A"}, 1))

    def test_non_tag_conditions_pass_through_untouched(self):
        self.assertEqual(
            resolve_tag_filters([["status", "=", "Open"], ["project_name", "like", "%x%"]]),
            [["status", "=", "Open"], ["project_name", "like", "%x%"]],
        )

    def test_unsupported_operator_is_rejected(self):
        self.assertRaises(frappe.ValidationError, resolve_tag_filters, [["tag", "in", ["Alpha"]]])
