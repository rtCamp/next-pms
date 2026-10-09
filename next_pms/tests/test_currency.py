from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.utils.currency import require_exchange_rate

EXCHANGE_RATE_PATH = "next_pms.utils.currency.get_exchange_rate"


class TestRequireExchangeRate(IntegrationTestCase):
    """require_exchange_rate must never fall back silently (see issue #2188)."""

    def test_returns_upstream_rate(self):
        with patch(EXCHANGE_RATE_PATH, return_value=0.012) as mocked:
            self.assertEqual(require_exchange_rate("INR", "USD", "2026-09-01"), 0.012)
        mocked.assert_called_once_with("INR", "USD", "2026-09-01")

    def test_same_currency_short_circuits(self):
        with patch(EXCHANGE_RATE_PATH) as mocked:
            self.assertEqual(require_exchange_rate("USD", "USD"), 1.0)
        mocked.assert_not_called()

    def test_zero_rate_raises(self):
        with patch(EXCHANGE_RATE_PATH, return_value=0.0):
            with self.assertRaises(frappe.ValidationError) as ctx:
                require_exchange_rate("INR", "USD", "2026-09-01")
        self.assertIn("INR", str(ctx.exception))
        self.assertIn("USD", str(ctx.exception))

    def test_none_rate_raises(self):
        with patch(EXCHANGE_RATE_PATH, return_value=None):
            with self.assertRaises(frappe.ValidationError):
                require_exchange_rate("INR", "USD")

    def test_missing_currency_raises(self):
        with self.assertRaises(frappe.ValidationError):
            require_exchange_rate("", "USD")
        with self.assertRaises(frappe.ValidationError):
            require_exchange_rate("INR", None)
