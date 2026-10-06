from unittest.mock import call, patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.project_currency.billing_rate import BILLING_RATE_COST_MULTIPLIER
from next_pms.project_currency.overrides import timesheet as timesheet_override
from next_pms.project_currency.overrides.timesheet import TimesheetOverwrite

PROJECT = "_Test Base Rate Project"
CUSTOMER = "_Test Base Rate Customer"
BASE_CURRENCY = "INR"


class TestTimesheetBaseRates(IntegrationTestCase):
    """Base rates on Timesheet Detail rows are the row's rate times the Timesheet's exchange rate."""

    def update_cost(
        self,
        rows=((8, 1),),
        currency="AUD",
        exchange_rate=66.8,
        costing_rate=0.935,
        billing_rate=50,
        billing_type="Time and Material",
    ):
        timesheet = TimesheetOverwrite(
            {
                "doctype": "Timesheet",
                "parent_project": PROJECT,
                "start_date": "2026-10-05",
                "time_logs": [
                    {"hours": hours, "billing_hours": hours if is_billable else 0, "is_billable": is_billable}
                    for hours, is_billable in rows
                ],
            }
        )
        values = {
            ("Project", "customer"): CUSTOMER,
            ("Project", "company"): "_Test Base Rate Company",
            ("Project", "custom_billing_type"): billing_type,
            ("Customer", "default_currency"): currency,
        }

        with (
            patch.object(frappe.db, "get_value", side_effect=lambda doctype, name, field: values[(doctype, field)]),
            patch.object(frappe.defaults, "get_global_default", return_value=BASE_CURRENCY),
            patch.object(timesheet_override, "get_exchange_rate", return_value=exchange_rate),
            patch.object(TimesheetOverwrite, "get_activity_costing_rate", return_value=costing_rate) as costing,
            patch.object(TimesheetOverwrite, "get_activity_billing_rate", return_value=billing_rate) as billing,
        ):
            timesheet.update_cost()

        return timesheet, costing, billing

    def test_base_rates_follow_the_timesheet_exchange_rate(self):
        timesheet, _, _ = self.update_cost()
        row = timesheet.time_logs[0]

        self.assertEqual((timesheet.currency, timesheet.exchange_rate), ("AUD", 66.8))
        self.assertAlmostEqual(row.costing_rate, 0.935)
        self.assertAlmostEqual(row.costing_amount, 7.48)
        self.assertAlmostEqual(row.base_costing_rate, 0.935 * 66.8)
        self.assertAlmostEqual(row.base_costing_amount, 0.935 * 66.8 * 8)
        self.assertEqual((row.billing_rate, row.billing_amount), (50, 400))
        self.assertAlmostEqual(row.base_billing_rate, 50 * 66.8)
        self.assertAlmostEqual(row.base_billing_amount, 50 * 66.8 * 8)

    def test_missing_exchange_rate_gives_zero_base_rates(self):
        for exchange_rate in (0, None):
            with self.subTest(exchange_rate=exchange_rate):
                timesheet, _, _ = self.update_cost(exchange_rate=exchange_rate)
                row = timesheet.time_logs[0]

                self.assertEqual((row.costing_rate, row.billing_rate), (0.935, 50))
                self.assertEqual((row.base_costing_rate, row.base_costing_amount), (0, 0))
                self.assertEqual((row.base_billing_rate, row.base_billing_amount), (0, 0))

    def test_base_rates_equal_rates_in_the_base_currency(self):
        timesheet, _, _ = self.update_cost(currency=BASE_CURRENCY, exchange_rate=1, costing_rate=62.5)
        row = timesheet.time_logs[0]

        self.assertEqual((row.base_costing_rate, row.base_costing_amount), (62.5, 500))
        self.assertEqual((row.base_billing_rate, row.base_billing_amount), (50, 400))

    def test_take_costing_rate_bills_a_multiple_of_cost(self):
        timesheet, _, _ = self.update_cost(billing_rate="Take Costing Rate", billing_type="Fixed Cost")
        row = timesheet.time_logs[0]

        self.assertAlmostEqual(row.billing_rate, BILLING_RATE_COST_MULTIPLIER * 0.935)
        self.assertAlmostEqual(row.base_billing_rate, BILLING_RATE_COST_MULTIPLIER * 0.935 * 66.8)
        self.assertAlmostEqual(row.base_billing_amount, BILLING_RATE_COST_MULTIPLIER * 0.935 * 66.8 * 8)

    def test_non_billable_row_has_costing_but_no_billing(self):
        timesheet, _, _ = self.update_cost(rows=((8, 0),))
        row = timesheet.time_logs[0]

        self.assertAlmostEqual(row.base_costing_amount, 0.935 * 66.8 * 8)
        self.assertEqual((row.billing_rate, row.billing_amount), (0, 0))
        self.assertEqual((row.base_billing_rate, row.base_billing_amount), (0, 0))

    def test_set_base_rates_uses_the_stored_rates(self):
        timesheet = TimesheetOverwrite(
            {
                "doctype": "Timesheet",
                "exchange_rate": 84.5,
                "time_logs": [{"costing_rate": 10, "costing_amount": 80, "billing_rate": 30, "billing_amount": 240}],
            }
        )

        with patch.object(timesheet_override, "get_exchange_rate") as get_rate:
            timesheet.set_base_rates()

        get_rate.assert_not_called()
        row = timesheet.time_logs[0]
        self.assertEqual((row.base_costing_rate, row.base_costing_amount), (845, 6760))
        self.assertEqual((row.base_billing_rate, row.base_billing_amount), (2535, 20280))

    def test_rates_are_looked_up_once_per_row_in_the_timesheet_currency(self):
        _, costing, billing = self.update_cost(rows=((8, 1), (4, 1)))

        self.assertEqual(costing.call_args_list, [call(currency="AUD")] * 2)
        self.assertEqual(billing.call_args_list, [call(currency="AUD", custom_billing_type="Time and Material")] * 2)
