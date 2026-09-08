from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.api.utils.helpers import (
    DEFAULT_ALLOCATION_RATE_CURRENCY,
    convert_ctc_to_allocation_currency,
    get_allocation_rate_currency,
)

EXCHANGE_RATE_PATH = "erpnext.setup.utils.get_exchange_rate"


class TestAllocationRateCurrency(IntegrationTestCase):
    """The currency the resource management views restate employee rates in."""

    def setUp(self):
        self.original_currency = frappe.db.get_single_value("Timesheet Settings", "default_currency")

    def tearDown(self):
        frappe.db.set_single_value("Timesheet Settings", "default_currency", self.original_currency)

    def _set_currency(self, currency):
        frappe.db.set_single_value("Timesheet Settings", "default_currency", currency)

    def test_configured_currency_is_used(self):
        self._set_currency("EUR")
        self.assertEqual(get_allocation_rate_currency(), "EUR")

    def test_unset_currency_falls_back_to_the_default(self):
        self._set_currency(None)
        self.assertEqual(get_allocation_rate_currency(), DEFAULT_ALLOCATION_RATE_CURRENCY)


class TestConvertCtcToAllocationCurrency(IntegrationTestCase):
    """convert_ctc_to_allocation_currency restates CTC in the display currency in place."""

    def test_ctc_is_converted_and_relabelled(self):
        employees = [{"ctc": 100000, "salary_currency": "INR"}]

        with patch(EXCHANGE_RATE_PATH, return_value=0.012) as get_rate:
            convert_ctc_to_allocation_currency(employees, currency="USD")

        get_rate.assert_called_once_with("INR", "USD")
        self.assertAlmostEqual(employees[0]["ctc"], 1200.0)
        self.assertEqual(employees[0]["salary_currency"], "USD")

    def test_matching_currency_is_left_alone(self):
        employees = [{"ctc": 100000, "salary_currency": "USD"}]

        with patch(EXCHANGE_RATE_PATH) as get_rate:
            convert_ctc_to_allocation_currency(employees, currency="USD")

        get_rate.assert_not_called()
        self.assertEqual(employees[0]["ctc"], 100000)
        self.assertEqual(employees[0]["salary_currency"], "USD")

    def test_row_without_an_exchange_rate_keeps_its_own_currency(self):
        # An unconfigured pair is a setup gap, not a data error. The row keeps the amount
        # and the label that actually describe it rather than being relabelled USD while
        # still holding rupees.
        employees = [{"ctc": 100000, "salary_currency": "INR"}]

        with patch(EXCHANGE_RATE_PATH, return_value=0):
            convert_ctc_to_allocation_currency(employees, currency="USD")

        self.assertEqual(employees[0]["ctc"], 100000)
        self.assertEqual(employees[0]["salary_currency"], "INR")

    def test_rows_without_salary_data_are_skipped(self):
        # Read-only callers never receive ctc/salary_currency, so the helper must leave
        # those rows untouched instead of stamping a currency onto them.
        employees = [{"ctc": None, "salary_currency": "INR"}, {"employee_name": "No Salary Fields"}]

        with patch(EXCHANGE_RATE_PATH) as get_rate:
            convert_ctc_to_allocation_currency(employees, currency="USD")

        get_rate.assert_not_called()
        self.assertIsNone(employees[0]["ctc"])
        self.assertEqual(employees[0]["salary_currency"], "INR")
        self.assertNotIn("salary_currency", employees[1])

    def test_exchange_rate_is_looked_up_once_per_currency(self):
        employees = [
            {"ctc": 100000, "salary_currency": "INR"},
            {"ctc": 200000, "salary_currency": "INR"},
            {"ctc": 50000, "salary_currency": "EUR"},
        ]

        with patch(EXCHANGE_RATE_PATH, return_value=2) as get_rate:
            convert_ctc_to_allocation_currency(employees, currency="USD")

        self.assertEqual(get_rate.call_count, 2)
        self.assertEqual([employee["ctc"] for employee in employees], [200000, 400000, 100000])

    def test_currency_defaults_to_the_configured_setting(self):
        original = frappe.db.get_single_value("Timesheet Settings", "default_currency")
        frappe.db.set_single_value("Timesheet Settings", "default_currency", "EUR")
        self.addCleanup(frappe.db.set_single_value, "Timesheet Settings", "default_currency", original)

        employees = [{"ctc": 100000, "salary_currency": "INR"}]

        with patch(EXCHANGE_RATE_PATH, return_value=0.011) as get_rate:
            convert_ctc_to_allocation_currency(employees)

        get_rate.assert_called_once_with("INR", "EUR")
        self.assertEqual(employees[0]["salary_currency"], "EUR")
