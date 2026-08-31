import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee, make_holiday_list
from next_pms.timesheet.api.app import get_data
from next_pms.timesheet.doc_events.timesheet import get_backdate_restriction_boundary

EMPLOYEE_USER = "app.get-data.employee@example.com"
COMPANY_HOLIDAY_LIST_NAME = "App GetData Test Company Holidays"


class TestGetDataBackdateRestriction(IntegrationTestCase):
    """get_data's backdate_restricted_before field - a thin wrapper around
    get_backdate_restriction_boundary, so these just confirm the wiring."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls._ensure_company_holiday_list_assignment()
        cls.employee = make_employee(EMPLOYEE_USER, company=cls.company)

        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries", 1)
        frappe.db.set_single_value("Timesheet Settings", "allow_backdated_entries_till_employee", 4)
        frappe.clear_cache()

    @classmethod
    def _ensure_company_holiday_list_assignment(cls):
        if frappe.db.exists("Holiday List Assignment", {"assigned_to": cls.company, "docstatus": 1}):
            return
        holiday_list = make_holiday_list(COMPANY_HOLIDAY_LIST_NAME, holiday_dates=[])
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Company",
                "assigned_to": cls.company,
                "holiday_list": holiday_list.name,
                "from_date": holiday_list.from_date,
            }
        ).insert(ignore_permissions=True).submit()

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_backdate_restricted_before_matches_shared_calculation(self):
        frappe.set_user(EMPLOYEE_USER)
        response = get_data()
        expected = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(response["backdate_restricted_before"], expected)

    def test_backdate_restricted_before_is_none_without_an_employee_record(self):
        # Administrator has no linked Employee record.
        frappe.set_user("Administrator")
        response = get_data()
        self.assertIsNone(response["backdate_restricted_before"])

    def test_get_data_still_returns_the_existing_keys(self):
        frappe.set_user(EMPLOYEE_USER)
        response = get_data()
        for key in ("roles", "currencies", "has_business_unit", "has_industry", "backdate_restricted_before"):
            self.assertIn(key, response)

    def test_backdate_restricted_before_is_none_for_an_ignored_role(self):
        """get_own_backdate_restriction_boundary must also respect the
        Ignored Role exemption, not just validate_dates - a user granted an ignored
        role should see no restriction on the frontend either."""
        role_name = "App GetData Test Ignored Role"
        if not frappe.db.exists("Role", role_name):
            frappe.get_doc({"doctype": "Role", "role_name": role_name}).insert(ignore_permissions=True)
        settings = frappe.get_single("Timesheet Settings")
        if not any(row.role == role_name for row in settings.ignored_role):
            settings.append("ignored_role", {"role": role_name})
            settings.save(ignore_permissions=True)

        bypass_user = "app.get-data.ignoredrole@example.com"
        make_employee(bypass_user, company=self.company)
        frappe.get_doc("User", bypass_user).add_roles(role_name)
        frappe.clear_cache()

        frappe.set_user(bypass_user)
        response = get_data()
        self.assertIsNone(response["backdate_restricted_before"])
