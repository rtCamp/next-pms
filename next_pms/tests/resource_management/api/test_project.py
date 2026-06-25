import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.api.project import get_employees_resrouce_data_for_given_project

WRITE_USER = "zzres-projects-user@example.com"
READ_ONLY_USER = "zzres-employee@example.com"

START_DATE = "2026-06-15"
END_DATE = "2026-06-19"

# Employee fields the endpoint only returns to write-permitted callers.
PRIVILEGED_FIELDS = ("ctc", "salary_currency")


class TestEmployeeResourceDataCacheIsolation(IntegrationTestCase):
    """get_employees_resrouce_data_for_given_project must scope its redis cache per
    permission level.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.project = cls._make_project()

        # Projects User grants write permission.
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Projects User")

        # The read-only user clears the endpoint's role gate through the Employee role,
        # which ERPNext grants by linking a User to an Employee.
        cls.read_only_user = cls._make_user(READ_ONLY_USER)
        cls.employee = cls._make_employee("ZZRES Worker", user_id=cls.read_only_user)
        cls._make_allocation(cls.employee, cls.project, is_billable=0)

        # A second, billable allocation so the is_billable filter has something to
        # include/exclude.
        cls.billable_employee = cls._make_employee("ZZRES Biller")
        cls._make_allocation(cls.billable_employee, cls.project, is_billable=1)

        frappe.clear_cache()

    @classmethod
    def _make_user(cls, email):
        if not frappe.db.exists("User", email):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "first_name": email.split("@")[0],
                    "user_type": "System User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)
        return email

    @classmethod
    def _make_project(cls):
        # Reuse any existing customer; this bench enforces unique customer
        # abbreviations, so minting one risks colliding with seeded data.
        customer = frappe.db.get_value("Customer", {}, "name")
        if not customer:
            customer = (
                frappe.get_doc(
                    {
                        "doctype": "Customer",
                        "customer_name": "ZZRES Customer",
                        "customer_type": "Company",
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "ZZRES Project",
                "company": cls.company,
                "customer": customer,
                "custom_billing_type": "Non-Billable",
            }
        ).insert(ignore_permissions=True)
        return project.name

    @classmethod
    def _make_employee(cls, employee_name, user_id=None):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": employee_name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                # These test employees have no manager (reports_to is None). An HRMS
                # Employee validate hook errors while auto-deriving an approver when the
                # field is left blank, so set it explicitly to skip that path.
                "leave_approver": "Administrator",
                "user_id": user_id,
                "ctc": 100000,
                "salary_currency": "INR",
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_allocation(cls, employee, project, is_billable=0):
        frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": employee,
                "project": project,
                "allocation_start_date": START_DATE,
                "allocation_end_date": END_DATE,
                "hours_allocated_per_day": 8,
                "status": "Confirmed",
                "is_billable": is_billable,
            }
        ).insert(ignore_permissions=True)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call_as(self, user, is_billable=-1):
        frappe.set_user(user)
        return get_employees_resrouce_data_for_given_project(
            project=self.project, start_date=START_DATE, end_date=END_DATE, is_billable=is_billable
        )

    def _employee_entry(self, result):
        return next(entry for entry in result["data"] if entry["name"] == self.employee)

    def _employee_ids(self, result):
        return {entry["name"] for entry in result["data"]}

    def test_write_user_receives_privileged_fields(self):
        result = self._call_as(WRITE_USER)
        self.assertTrue(result["permissions"]["write"])
        entry = self._employee_entry(result)
        for field in PRIVILEGED_FIELDS:
            self.assertIn(field, entry)

    def test_read_only_user_excluded_from_privileged_fields(self):
        result = self._call_as(READ_ONLY_USER)
        self.assertFalse(result["permissions"]["write"])
        entry = self._employee_entry(result)
        for field in PRIVILEGED_FIELDS:
            self.assertNotIn(field, entry)

    def test_write_payload_not_leaked_to_read_only_user_via_cache(self):
        # Warm the cache as the write user, then hit the same arguments as the
        # read-only user. Under the old stacked-decorator caching this returned the
        # write user's cached payload (write=True, ctc present) to the read-only user.
        write_result = self._call_as(WRITE_USER)
        self.assertTrue(write_result["permissions"]["write"])

        read_result = self._call_as(READ_ONLY_USER)
        self.assertFalse(read_result["permissions"]["write"])
        entry = self._employee_entry(read_result)
        for field in PRIVILEGED_FIELDS:
            self.assertNotIn(field, entry)

    def test_write_user_is_billable_filter_applied(self):
        # is_billable=1 restricts the write caller to the billable allocation.
        result = self._call_as(WRITE_USER, is_billable=1)
        self.assertTrue(result["permissions"]["write"])
        ids = self._employee_ids(result)
        self.assertIn(self.billable_employee, ids)
        self.assertNotIn(self.employee, ids)

    def test_read_only_user_is_billable_filter_ignored(self):
        # The endpoint resets is_billable to -1 for non-write callers, so the
        # passed is_billable=1 is ignored and the non-billable allocation still shows.
        result = self._call_as(READ_ONLY_USER, is_billable=1)
        self.assertFalse(result["permissions"]["write"])
        ids = self._employee_ids(result)
        self.assertIn(self.billable_employee, ids)
        self.assertIn(self.employee, ids)

    def test_read_only_payload_not_leaked_to_write_user_via_cache(self):
        # The reverse direction: warming as the read-only user must not strip the
        # write user's privileged fields on the subsequent identical call.
        read_result = self._call_as(READ_ONLY_USER)
        self.assertFalse(read_result["permissions"]["write"])

        write_result = self._call_as(WRITE_USER)
        self.assertTrue(write_result["permissions"]["write"])
        entry = self._employee_entry(write_result)
        for field in PRIVILEGED_FIELDS:
            self.assertIn(field, entry)
