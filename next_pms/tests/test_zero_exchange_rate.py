from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.api import utils as api_utils
from next_pms.next_projects.api import project as next_projects_project
from next_pms.project_currency.overrides import timesheet as timesheet_override
from next_pms.resource_management.report.spare_capacity_report import utils as spare_capacity_utils
from next_pms.timesheet.api.project import convert
from next_pms.utils import employee as employee_utils

EXCHANGE_RATE_PATH = "erpnext.setup.utils.get_exchange_rate"
MISSING_RATES = (0, None)


class TestZeroExchangeRate(IntegrationTestCase):
    """A failed exchange-rate lookup converts amounts to 0 instead of keeping them 1:1."""

    def test_convert_currency(self):
        for rate in MISSING_RATES:
            with self.subTest(rate=rate), patch(EXCHANGE_RATE_PATH, return_value=rate):
                self.assertEqual(employee_utils.convert_currency(500, "INR", "USD"), 0)

    def test_convert_currency_skips_the_lookup_for_the_same_currency(self):
        with patch(EXCHANGE_RATE_PATH) as get_rate:
            self.assertEqual(employee_utils.convert_currency(500, "USD", "USD"), 500)

        get_rate.assert_not_called()

    def test_employee_salary(self):
        for rate in MISSING_RATES:
            with (
                self.subTest(rate=rate),
                patch(EXCHANGE_RATE_PATH, return_value=rate),
                patch.object(employee_utils, "get_employee_monthly_working_hours", return_value=160),
            ):
                salary = employee_utils.get_employee_salary(
                    employee="_Test Employee", to_currency="USD", ctc=1_200_000, salary_currency="INR"
                )

                self.assertEqual(salary, {"monthly_salary": 0, "hourly_salary": 0})

    def test_timesheet_billing_rate(self):
        for rate in MISSING_RATES:
            with self.subTest(rate=rate), patch.object(timesheet_override, "get_exchange_rate", return_value=rate):
                self.assertEqual(timesheet_override.get_employee_billing_rate(50, "USD", "AUD", "2026-10-05"), 0)

    def test_timesheet_costing_rate_is_rejected(self):
        with (
            patch(EXCHANGE_RATE_PATH, return_value=0),
            patch.object(employee_utils, "get_employee_monthly_working_hours", return_value=160),
            self.assertRaises(frappe.ValidationError),
        ):
            timesheet_override.get_employee_costing_rate("_Test Employee", "INR", 1_200_000, "AUD", "2026-10-05")

    def test_sum_to_usd(self):
        rows = [
            frappe._dict(currency="INR", transaction_date="2026-10-05", current=8500, previous=4250),
            frappe._dict(currency="USD", transaction_date="2026-10-05", current=100, previous=50),
        ]

        for rate in MISSING_RATES:
            with self.subTest(rate=rate), patch.object(api_utils, "get_exchange_rate", return_value=rate):
                self.assertEqual(api_utils.sum_to_usd(rows, "current", "previous"), (100, 50))

    def test_spare_capacity_convert_currency(self):
        for rate in MISSING_RATES:
            with self.subTest(rate=rate), patch.object(spare_capacity_utils, "get_exchange_rate", return_value=rate):
                self.assertEqual(spare_capacity_utils.convert_currency(500, "INR", "USD", "2026-10-05"), 0)

    def test_project_list_currency_conversion(self):
        for rate in MISSING_RATES:
            projects = [
                {"currency": "INR", "total_budget": 1000, "burn_rate_per_week": 50, "lifetime_value_to_date": 200}
            ]

            with (
                self.subTest(rate=rate),
                patch.object(frappe.db, "exists", return_value=True),
                patch.object(next_projects_project, "get_exchange_rate", return_value=rate),
            ):
                next_projects_project._apply_currency_conversion(projects, "USD")

            self.assertEqual(
                projects,
                [{"currency": "USD", "total_budget": 0, "burn_rate_per_week": 0, "lifetime_value_to_date": 0}],
            )

    def test_timesheet_project_list_convert(self):
        for rate in MISSING_RATES:
            with self.subTest(rate=rate):
                self.assertEqual(convert(500, rate), 0)
