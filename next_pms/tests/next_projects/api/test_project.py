import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, today

from next_pms.next_projects.api.project import get_projects_view

# Unique marker so `search` scopes every call to this suite's fixtures only.
FIXTURE_PREFIX = "CompSort"


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
