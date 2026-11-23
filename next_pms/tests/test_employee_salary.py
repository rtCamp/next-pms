from unittest.mock import patch

import frappe
from frappe.permissions import add_permission
from frappe.tests import IntegrationTestCase

from next_pms.api.employee import get_own_salary_summary
from next_pms.tests.utils import make_employee
from next_pms.timesheet.utils.constant import EMP_WOKING_DETAILS
from next_pms.utils.employee import get_employee_salary

EXCHANGE_RATE_PATH = "erpnext.setup.utils.get_exchange_rate"
OWN_USER = "test.salary.own@example.com"
OTHER_USER = "test.salary.other@example.com"
HR_USER = "test.salary.hr@example.com"
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
        frappe.set_user(HR_USER)
        with patch(EXCHANGE_RATE_PATH, return_value=0.012):
            employee = frappe.get_doc("Employee", self.own_employee).as_dict()

        self.assertEqual(employee.custom_monthly_salary, 100_000)
        self.assertEqual(employee.custom_hourly_salary, 625)
        self.assertEqual(employee.custom_annual_salary_usd, 14_400)
        self.assertEqual(employee.custom_monthly_salary_usd, 1_200)
        self.assertEqual(employee.custom_hourly_salary_usd, 7.5)
        self.assertEqual(employee.custom_usd_currency, "USD")

    def test_owner_without_role_gets_no_salary_fields(self):
        frappe.db.set_value("Employee", self.other_employee, "owner", OWN_USER)
        frappe.set_user(OWN_USER)

        employee = frappe.get_doc("Employee", self.other_employee).as_dict()

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
