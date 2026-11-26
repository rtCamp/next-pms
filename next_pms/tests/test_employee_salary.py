from unittest.mock import patch

import frappe
from frappe.permissions import add_permission
from frappe.tests import IntegrationTestCase

from next_pms.api.employee import get_own_salary_summary
from next_pms.next_pms.doc_events import employee as employee_events
from next_pms.tasks import employee_salary
from next_pms.tests.utils import make_employee
from next_pms.timesheet.utils.constant import EMP_WOKING_DETAILS
from next_pms.utils.employee import get_employee_salary

EXCHANGE_RATE_PATH = "erpnext.setup.utils.get_exchange_rate"
OWN_USER = "test.salary.own@example.com"
OTHER_USER = "test.salary.other@example.com"
HR_USER = "test.salary.hr@example.com"
LEFT_USER = "test.salary.left@example.com"
SALARY_FIELDS = (
    "custom_monthly_salary",
    "custom_hourly_salary",
    "custom_income_tax_slab",
    "custom_annual_salary_usd",
    "custom_hourly_salary_usd",
)


class TestEmployeeSalary(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.own_employee = make_employee(
            OWN_USER,
            ctc=1_200_000,
            salary_currency="INR",
            custom_working_hours=40,
            custom_work_schedule="Per Week",
        )
        cls.other_employee = make_employee(OTHER_USER, ctc=2_400_000, salary_currency="INR")
        cls.left_employee = make_employee(LEFT_USER, ctc=3_600_000, salary_currency="INR")
        frappe.db.set_value("Employee", cls.left_employee, "status", "Left")
        frappe.cache().hdel(EMP_WOKING_DETAILS, cls.own_employee)

        if not frappe.db.exists("User", HR_USER):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": HR_USER,
                    "first_name": "Salary HR",
                    "send_welcome_email": 0,
                    "roles": [{"role": "HR Manager"}],
                }
            ).insert()
        add_permission("Employee", "HR Manager", 1)

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_per_week_hourly_salary_uses_weekly_hours(self):
        salary = get_employee_salary(self.own_employee, "INR")

        self.assertEqual(salary, {"monthly_salary": 100_000, "hourly_salary": 625})

    def test_level_one_reader_sees_salary_breakdown(self):
        with patch(EXCHANGE_RATE_PATH, return_value=0.012):
            employee_salary.update_salary_fields([self.own_employee])
        frappe.set_user(HR_USER)

        employee = frappe.client.get("Employee", self.own_employee)

        self.assertEqual(employee.custom_monthly_salary, 100_000)
        self.assertEqual(employee.custom_hourly_salary, 625)
        self.assertEqual(employee.custom_annual_salary_usd, 14_400)
        self.assertEqual(employee.custom_monthly_salary_usd, 1_200)
        self.assertEqual(employee.custom_hourly_salary_usd, 7.5)
        self.assertEqual(employee.custom_monthly_salary_inr, 100_000)
        self.assertEqual(employee.custom_usd_currency, "USD")

    def test_owner_without_role_gets_no_salary_fields(self):
        with patch(EXCHANGE_RATE_PATH, return_value=0.012):
            employee_salary.update_salary_fields([self.other_employee])
        frappe.db.set_value("Employee", self.other_employee, "owner", OWN_USER)
        frappe.set_user(OWN_USER)

        # Stored fields are kept from the client by the field-level read check frappe.client.get applies
        doc = frappe.get_doc("Employee", self.other_employee)
        doc.apply_fieldlevel_read_permissions()
        employee = doc.as_dict()

        for fieldname in SALARY_FIELDS:
            self.assertNotIn(fieldname, employee)
        self.assertRaises(frappe.PermissionError, get_own_salary_summary, self.other_employee)

    def test_own_record_summary_has_no_hourly_salary_or_conversions(self):
        frappe.set_user(OWN_USER)

        summary = get_own_salary_summary(self.own_employee)

        self.assertEqual(summary.ctc, 1_200_000)
        self.assertEqual(summary.monthly_salary, 100_000)
        self.assertFalse({"hourly_salary", "usd_salary", "inr_salary"} & set(summary))

    def test_guest_cannot_read_salary_summary(self):
        frappe.set_user("Guest")

        self.assertRaises(frappe.PermissionError, get_own_salary_summary, self.own_employee)

    def test_user_permission_does_not_extend_summary_to_other_employees(self):
        frappe.get_doc(
            {"doctype": "User Permission", "user": OWN_USER, "allow": "Employee", "for_value": self.other_employee}
        ).insert(ignore_if_duplicate=True)
        frappe.set_user(OWN_USER)

        self.assertRaises(frappe.PermissionError, get_own_salary_summary, self.other_employee)

    def test_daily_job_updates_active_employees_in_batches(self):
        with (
            patch(EXCHANGE_RATE_PATH, return_value=0.012),
            patch.object(employee_salary, "BATCH_SIZE", 2),
            patch.object(employee_salary, "update_salary_fields", wraps=employee_salary.update_salary_fields) as update,
            patch.object(frappe.db, "commit") as commit,
        ):
            employee_salary.update_employee_salaries()

        batches = [call.args[0] for call in update.call_args_list]
        updated = [name for batch in batches for name in batch]
        self.assertTrue(all(len(batch) <= 2 for batch in batches))
        self.assertEqual(commit.call_count, len(batches))
        self.assertIn(self.own_employee, updated)
        self.assertNotIn(self.left_employee, updated)
        self.assertEqual(frappe.db.get_value("Employee", self.own_employee, "custom_monthly_salary_usd"), 1_200)
        self.assertEqual(frappe.db.get_value("Employee", self.left_employee, "custom_monthly_salary"), 0)

    def test_job_keeps_modified_and_skips_unchanged_rows(self):
        modified = frappe.db.get_value("Employee", self.own_employee, "modified")

        with (
            patch(EXCHANGE_RATE_PATH, return_value=0.012),
            patch.object(frappe.db, "bulk_update", wraps=frappe.db.bulk_update) as bulk_update,
        ):
            employee_salary.update_salary_fields([self.own_employee])
            employee_salary.update_salary_fields([self.own_employee])

        self.assertEqual(frappe.db.get_value("Employee", self.own_employee, "modified"), modified)
        self.assertEqual(frappe.db.get_value("Employee", self.own_employee, "custom_inr_currency"), "INR")
        self.assertEqual(bulk_update.call_args_list[1].args[1], {})

    def test_amounts_reset_when_ctc_is_removed(self):
        with patch(EXCHANGE_RATE_PATH, return_value=0.012):
            employee_salary.update_salary_fields([self.other_employee])
        frappe.db.set_value("Employee", self.other_employee, "ctc", 0)
        self.addCleanup(frappe.db.set_value, "Employee", self.other_employee, "ctc", 2_400_000)

        employee_salary.update_salary_fields([self.other_employee])

        values = frappe.db.get_value("Employee", self.other_employee, employee_salary.AMOUNT_FIELDS, as_dict=True)
        self.assertTrue(all(amount == 0 for amount in values.values()))

    def test_guest_cannot_run_job_or_read_salary_fields(self):
        self.assertNotIn(employee_salary.update_employee_salaries, frappe.whitelisted)
        self.assertNotIn(employee_salary.update_salary_fields, frappe.whitelisted)
        frappe.set_user("Guest")

        self.assertRaises(frappe.PermissionError, frappe.client.get, "Employee", self.own_employee)

    def test_saving_a_new_ctc_updates_salary_fields(self):
        self.addCleanup(frappe.db.set_value, "Employee", self.own_employee, "ctc", 1_200_000)
        employee = frappe.get_doc("Employee", self.own_employee)
        employee.ctc = 2_400_000

        with patch(EXCHANGE_RATE_PATH, return_value=0.012):
            employee.save()

        values = frappe.db.get_value(
            "Employee", self.own_employee, ["custom_monthly_salary", "custom_monthly_salary_usd"], as_dict=True
        )
        self.assertEqual(values, {"custom_monthly_salary": 200_000, "custom_monthly_salary_usd": 2_400})

    def test_saving_other_fields_skips_the_salary_calculation(self):
        employee = frappe.get_doc("Employee", self.own_employee)
        employee.middle_name = "Unchanged Salary"

        with patch.object(employee_events, "calculate_salary_values") as calculate:
            employee.save()

        calculate.assert_not_called()
