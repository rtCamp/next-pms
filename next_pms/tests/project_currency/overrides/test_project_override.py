import frappe
from erpnext.projects.doctype.project import project as erpnext_project
from frappe.utils import flt, getdate

from next_pms.tests.project_currency.overrides.fixtures import (
    COMPANY,
    DATE,
    HOURLY_COST_INR,
    HOURLY_COST_USD,
    INR_TO_USD,
    NEXT_WEEK,
    USD_CUSTOMER,
    USD_TO_INR,
    OverrideTestCase,
    capture_costing,
    insert_bare,
)

WEEK_AFTER_NEXT = "2026-08-18"


class TestProjectOverride(OverrideTestCase):
    """Pins what ProjectOverwrite computes today. Each test is chosen so the hrms/erpnext
    implementation that would run without our class gives a different answer."""

    def submitted_timesheet(self, project, task, hours, date, cancel=False):
        timesheet = self.make_timesheet(project, task, [{"hours": hours}], date=date)
        with capture_costing():
            timesheet.submit()
            if cancel:
                timesheet.cancel()
        return timesheet

    def test_currency_comes_from_customer(self):
        project = self.make_project(customer=USD_CUSTOMER)

        self.assertEqual(project.custom_currency, "USD")

    def test_currency_falls_back_to_company_without_customer(self):
        project = self.make_project(customer=None)

        self.assertEqual(project.custom_currency, "INR")

    def test_billing_team_rejects_same_employee_and_valid_from(self):
        team = [
            {"employee": self.employee, "valid_from": DATE, "hourly_billing_rate": 50},
            {"employee": self.employee, "valid_from": DATE, "hourly_billing_rate": 60},
        ]

        with self.assertRaisesRegex(frappe.ValidationError, "overlapping date range"):
            self.make_project(custom_billing_type="Time and Material", custom_project_billing_team=team)

        team[1]["valid_from"] = NEXT_WEEK
        project = self.make_project(custom_billing_type="Time and Material", custom_project_billing_team=team)
        self.assertEqual(len(project.custom_project_billing_team), 2)

    def test_budget_rejects_start_after_end(self):
        budget = [{"start_date": NEXT_WEEK, "end_date": DATE, "hours_purchased": 10}]

        with self.assertRaisesRegex(frappe.ValidationError, "End date should be greater than start date"):
            self.make_project(custom_billing_type="Retainer", custom_project_budget_hours=budget)

    def test_costing_counts_draft_and_submitted_rows_but_not_cancelled(self):
        project = self.make_project()
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 2}], date=DATE)
        self.submitted_timesheet(project.name, task.name, hours=3, date=NEXT_WEEK)
        self.submitted_timesheet(project.name, task.name, hours=7, date=WEEK_AFTER_NEXT, cancel=True)

        project.reload()
        project.update_costing()

        self.assertEqual(flt(project.actual_time), 5.0)
        self.assertEqual(flt(project.total_costing_amount), 5 * HOURLY_COST_INR)
        self.assertEqual(getdate(project.actual_start_date), getdate(DATE))
        self.assertEqual(getdate(project.actual_end_date), getdate(NEXT_WEEK))

    def test_costing_totals_stay_in_transaction_currency(self):
        project = self.make_project(
            customer=USD_CUSTOMER,
            custom_billing_type="Time and Material",
            custom_default_hourly_billing_rate=10,
        )
        task = self.make_task(project.name)
        timesheet = self.make_timesheet(project.name, task.name, [{"hours": 4, "is_billable": 1}])
        row = timesheet.time_logs[0]
        self.assertEqual(flt(row.base_costing_amount), 4 * HOURLY_COST_USD * USD_TO_INR)

        project.reload()
        project.update_costing()

        self.assertEqual(flt(project.total_costing_amount), 4 * HOURLY_COST_USD)
        self.assertEqual(flt(project.total_billable_amount), 40.0)

    def test_sales_amount_sums_submitted_sales_order_net_total(self):
        project = self.make_project()
        for docstatus, net_total in ((1, 1000), (1, 250), (0, 500), (2, 300)):
            insert_bare(
                "Sales Order",
                project=project.name,
                docstatus=docstatus,
                net_total=net_total,
                base_net_total=net_total * USD_TO_INR,
            )

        project.update_sales_amount()

        self.assertEqual(flt(project.total_sales_amount), 1250.0)

    def test_billed_amount_sums_sales_invoice_header_net_total(self):
        project = self.make_project()
        insert_bare("Sales Invoice", project=project.name, docstatus=1, net_total=700, base_net_total=56000)
        insert_bare("Sales Invoice", project=project.name, docstatus=0, net_total=900, base_net_total=72000)
        insert_bare(
            "Sales Invoice",
            docstatus=1,
            net_total=999,
            children={"items": [{"project": project.name, "net_amount": 999, "base_net_amount": 999}]},
        )

        project.update_billed_amount()

        self.assertEqual(flt(project.total_billed_amount), 700.0)

    def test_purchase_cost_converts_invoice_net_total_to_project_currency(self):
        project = self.make_project()
        insert_bare(
            "Purchase Invoice", project=project.name, docstatus=1, currency="USD", net_total=100, posting_date=DATE
        )
        insert_bare(
            "Purchase Invoice", project=project.name, docstatus=0, currency="USD", net_total=50, posting_date=DATE
        )

        project.update_purchase_costing()

        self.assertEqual(flt(project.total_purchase_cost), 100 * USD_TO_INR)

    def test_purchase_invoice_submit_path_runs_our_purchase_costing(self):
        """erpnext 16.52+ calls update_purchase_cost when a Purchase Invoice is submitted. Older
        releases add the invoice lines to total_purchase_cost without calling the controller."""
        update_purchase_cost = getattr(erpnext_project, "update_purchase_cost", None)
        if not update_purchase_cost:
            self.skipTest("erpnext < 16.52 has no update_purchase_cost")

        project = self.make_project()
        insert_bare(
            "Purchase Invoice", project=project.name, docstatus=1, currency="USD", net_total=100, posting_date=DATE
        )

        update_purchase_cost({project.name})

        self.assertEqual(flt(frappe.db.get_value("Project", project.name, "total_purchase_cost")), 100 * USD_TO_INR)

    def test_expense_claim_converts_header_sanctioned_amount_from_company_currency(self):
        project = self.make_project(customer=USD_CUSTOMER)
        insert_bare(
            "Expense Claim",
            project=project.name,
            company=COMPANY,
            docstatus=1,
            total_sanctioned_amount=8000,
            posting_date=DATE,
        )
        insert_bare(
            "Expense Claim",
            company=COMPANY,
            docstatus=1,
            total_sanctioned_amount=500,
            posting_date=DATE,
            children={"expenses": [{"project": project.name, "sanctioned_amount": 500, "amount": 500}]},
        )

        project.update_expense_claim()

        self.assertEqual(flt(project.total_expense_claim), 8000 * INR_TO_USD)

    def test_gross_margin_uses_expense_claim_from_before_the_run(self):
        """hrms's calculate_gross_margin runs before update_expense_claim, so a new claim only
        reaches the gross margin on the next recalculation."""
        project = self.make_project()
        insert_bare("Sales Invoice", project=project.name, docstatus=1, net_total=10000, base_net_total=10000)
        insert_bare(
            "Expense Claim",
            project=project.name,
            company=COMPANY,
            docstatus=1,
            total_sanctioned_amount=3000,
            posting_date=DATE,
        )

        project.update_costing()
        self.assertEqual(flt(project.total_expense_claim), 3000.0)
        self.assertEqual(flt(project.gross_margin), 10000.0)
        self.assertEqual(flt(project.per_gross_margin), 100.0)

        project.update_costing()
        self.assertEqual(flt(project.gross_margin), 7000.0)
        self.assertEqual(flt(project.per_gross_margin), 70.0)

    def test_fixed_cost_sets_percentage_of_estimated_cost(self):
        fixed = self.make_project(custom_billing_type="Fixed Cost", estimated_costing=1000)
        time_and_material = self.make_project(custom_billing_type="Time and Material", estimated_costing=1000)
        for project in (fixed, time_and_material):
            task = self.make_task(project.name)
            self.make_timesheet(project.name, task.name, [{"hours": 2}])
            project.reload()
            project.update_costing()

        self.assertEqual(flt(fixed.custom_percentage_estimated_cost), 20.0)
        self.assertFalse(flt(time_and_material.custom_percentage_estimated_cost))

    def test_fixed_cost_consumes_budget_fifo_and_last_row_goes_negative(self):
        project = self.make_project(
            custom_billing_type="Fixed Cost",
            custom_project_budget_hours=[
                {"start_date": DATE, "end_date": NEXT_WEEK, "hours_purchased": 2},
                {"start_date": DATE, "end_date": NEXT_WEEK, "hours_purchased": 1},
            ],
        )
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 5, "is_billable": 1}])

        project.reload()
        project.update_costing()

        first, last = project.custom_project_budget_hours
        self.assertEqual((flt(first.consumed_hours), flt(first.remaining_hours)), (2.0, 0.0))
        self.assertEqual((flt(last.consumed_hours), flt(last.remaining_hours)), (1.0, -2.0))
        self.assertEqual(flt(project.custom_total_hours_purchased), 3.0)
        self.assertEqual(flt(project.custom_total_hours_remaining), -2.0)

    def test_budget_hours_untouched_for_time_and_material(self):
        project = self.make_project(
            custom_billing_type="Time and Material",
            custom_project_budget_hours=[{"start_date": DATE, "end_date": NEXT_WEEK, "hours_purchased": 2}],
        )
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 5, "is_billable": 1}])

        project.reload()
        project.update_costing()

        self.assertFalse(flt(project.custom_project_budget_hours[0].consumed_hours))
        self.assertFalse(flt(project.custom_total_hours_purchased))

    def test_estimated_profit_falls_back_to_billable_amount_and_subtracts_every_cost(self):
        project = self.make_project(custom_billing_type="Time and Material", custom_default_hourly_billing_rate=500)
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 2, "is_billable": 1}])
        insert_bare(
            "Purchase Invoice", project=project.name, docstatus=1, currency="INR", net_total=100, posting_date=DATE
        )
        insert_bare(
            "Expense Claim",
            project=project.name,
            company=COMPANY,
            docstatus=1,
            total_sanctioned_amount=50,
            posting_date=DATE,
        )

        project.reload()
        project.total_consumed_material_cost = 30
        project.update_costing()

        self.assertEqual(flt(project.total_billable_amount), 1000.0)
        self.assertEqual(flt(project.custom_estimated_profit), 1000 - (2 * HOURLY_COST_INR + 50 + 100 + 30))
        self.assertEqual(flt(project.custom_percentage_estimated_profit), 62.0)

    def test_estimated_profit_prefers_estimated_costing_plus_sales(self):
        project = self.make_project(custom_billing_type="Time and Material", custom_default_hourly_billing_rate=500)
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 2, "is_billable": 1}])
        insert_bare("Sales Order", project=project.name, docstatus=1, net_total=2000, base_net_total=2000)

        project.reload()
        project.estimated_costing = 1000
        project.update_costing()

        self.assertEqual(flt(project.custom_estimated_profit), 3000 - 2 * HOURLY_COST_INR)
        self.assertEqual(flt(project.custom_percentage_estimated_profit), flt(2800 * 100 / 3000))

    def test_save_persists_costing_through_validate(self):
        project = self.make_project(customer=USD_CUSTOMER, estimated_costing=100)
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 4}])

        project.reload()
        project.save(ignore_permissions=True)

        saved = frappe.db.get_value(
            "Project",
            project.name,
            ["custom_currency", "actual_time", "total_costing_amount", "custom_estimated_profit"],
            as_dict=True,
        )
        self.assertEqual(saved.custom_currency, "USD")
        self.assertEqual(flt(saved.actual_time), 4.0)
        self.assertEqual(flt(saved.total_costing_amount), 4 * HOURLY_COST_USD)
        self.assertEqual(flt(saved.custom_estimated_profit), 100 - 4 * HOURLY_COST_USD)

    def test_update_costing_and_billing_endpoint_runs_our_costing(self):
        """erpnext's whitelisted "Update Costing and Billing" action on the Project form."""
        project = self.make_project()
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, [{"hours": 3}])

        erpnext_project.update_costing_and_billing(project.name)

        self.assertEqual(flt(frappe.db.get_value("Project", project.name, "total_costing_amount")), 300.0)
