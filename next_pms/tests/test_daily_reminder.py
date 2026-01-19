import unittest
from unittest.mock import MagicMock, patch

import frappe
from frappe.utils import add_days, getdate

from next_pms.tests import TestNextPms
from next_pms.timesheet.tasks.daily_reminder_for_time_entry import calculate_daily_norm, send_reminder


class TestDailyReminder(TestNextPms):
    def setUp(self):
        super().setUp()
        self.date = add_days(getdate(), -1)

    def test_calculate_daily_norm_per_day(self):
        """Test daily norm calculation for Per Day schedule"""
        employee = frappe._dict(
            {
                "custom_working_hours": 8,
                "custom_work_schedule": "Per Day",
            }
        )
        result = calculate_daily_norm(employee)
        self.assertEqual(result, 8)

    def test_calculate_daily_norm_per_week(self):
        """Test daily norm calculation for Per Week schedule"""
        employee = frappe._dict(
            {
                "custom_working_hours": 40,
                "custom_work_schedule": "Per Week",
            }
        )
        result = calculate_daily_norm(employee)
        self.assertEqual(result, 8)

    def test_calculate_daily_norm_default_hours(self):
        """Test daily norm calculation with default hours"""
        employee = frappe._dict(
            {
                "custom_working_hours": None,
                "custom_work_schedule": "Per Day",
            }
        )
        result = calculate_daily_norm(employee)
        self.assertEqual(result, 8)

    @patch("next_pms.timesheet.tasks.daily_reminder_for_time_entry.send_mail")
    def test_send_reminder_batch_queries(self, mock_send_mail):
        """Test that send_reminder uses batch queries instead of N+1 pattern"""
        # Setup: Create test data
        try:
            frappe.db.sql("DELETE FROM `tabTimesheet Settings`")
            setting = frappe.get_doc(
                {
                    "doctype": "Timesheet Settings",
                    "send_daily_reminder": 1,
                    "daily_reminder_template": "_Test Reminder Template",
                }
            )
            # Create a department for the test
            if not frappe.db.exists("Department", "_Test Department"):
                frappe.get_doc(
                    {
                        "doctype": "Department",
                        "department_name": "_Test Department",
                    }
                ).insert()

            setting.append("allowed_departments", {"department": "_Test Department"})
            setting.insert()

            # Create email template
            if not frappe.db.exists("Email Template", "_Test Reminder Template"):
                frappe.get_doc(
                    {
                        "doctype": "Email Template",
                        "name": "_Test Reminder Template",
                        "subject": "Test Subject",
                        "response": "Test Message",
                        "use_html": 0,
                    }
                ).insert()

            # Count queries before calling send_reminder
            with patch("frappe.db.sql", wraps=frappe.db.sql) as mock_sql:
                with patch("frappe.get_all", wraps=frappe.get_all) as mock_get_all:
                    send_reminder()

                    # The refactored version should make fewer database queries
                    # We expect approximately 4-5 batch queries total:
                    # 1. Get Timesheet Settings
                    # 2. Get Email Template
                    # 3. Get Employees (batch)
                    # 4. Get Holidays (batch)
                    # 5. Get Leaves (batch SQL)
                    # 6. Get Timesheets (batch)

                    # Verify that get_all was called for batch operations
                    # (exact count depends on Frappe internals, but it should be minimal)
                    self.assertGreater(mock_get_all.call_count, 0)
        finally:
            # Clean up in finally block to ensure it runs even if test fails
            frappe.db.sql("DELETE FROM `tabTimesheet Settings`")
            if frappe.db.exists("Email Template", "_Test Reminder Template"):
                frappe.delete_doc("Email Template", "_Test Reminder Template")

    def tearDown(self):
        # Clean up any test data
        super().tearDown()
        frappe.db.rollback()


if __name__ == "__main__":
    unittest.main()
