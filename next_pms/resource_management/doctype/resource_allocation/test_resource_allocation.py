# Copyright (c) 2024, rtCamp and Contributors
# See license.txt

import frappe
from erpnext import get_default_company
from frappe.exceptions import ValidationError
from frappe.tests import IntegrationTestCase

# All fixtures are created manually in setUpClass; skip the auto test-record.
IGNORE_TEST_RECORD_DEPENDENCIES = ["Employee", "Project", "Customer", "Currency"]

START_DATE = "2026-06-15"
END_DATE = "2026-06-19"


class TestResourceAllocationValidation(IntegrationTestCase):
    """Controller checks for Resource Allocation: entity state, date range, and cost calculation."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.employee = cls._make_employee("Ravi Kumar")
        cls.customer = cls._make_customer("Globex")
        cls.project = cls._make_project("Active Project", cls.customer)

    @classmethod
    def _make_employee(cls, employee_name):
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
                "leave_approver": "Administrator",
                "ctc": 100000,
                "salary_currency": "INR",
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_customer(cls, name, disabled=0):
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": f"{name} {frappe.generate_hash(length=6)}",
                    "customer_type": "Company",
                    "custom_abbr": frappe.generate_hash(length=8).upper(),
                    "default_currency": "INR",
                    "disabled": disabled,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls, name, customer):
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": f"{name} {frappe.generate_hash(length=6)}",
                    "company": cls.company,
                    "customer": customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def _make_allocation_doc(self, project=None, customer=None, **overrides):
        data = {
            "doctype": "Resource Allocation",
            "employee": self.employee,
            "allocation_start_date": START_DATE,
            "allocation_end_date": END_DATE,
            "hours_allocated_per_day": 8,
            "status": "Confirmed",
            "is_billable": 0,
        }
        if project:
            data["project"] = project
        if customer:
            data["customer"] = customer
        data.update(overrides)
        return frappe.get_doc(data)

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_active_project_and_enabled_customer_saves(self):
        doc = self._make_allocation_doc(project=self.project)
        doc.insert(ignore_permissions=True)
        self.assertTrue(frappe.db.exists("Resource Allocation", doc.name))

    def test_cancelled_project_rejected(self):
        project = self._make_project("Cancelled Project", self.customer)
        frappe.db.set_value("Project", project, "status", "Cancelled")
        doc = self._make_allocation_doc(project=project)
        with self.assertRaises(ValidationError) as cm:
            doc.insert(ignore_permissions=True)
        self.assertIn("cancelled project", str(cm.exception).lower())

    def test_inactive_project_rejected(self):
        project = self._make_project("Inactive Project", self.customer)
        frappe.db.set_value("Project", project, "is_active", "No")
        doc = self._make_allocation_doc(project=project)
        with self.assertRaises(ValidationError) as cm:
            doc.insert(ignore_permissions=True)
        self.assertIn("inactive project", str(cm.exception).lower())

    def test_disabled_customer_rejected(self):
        # No project, so the disabled customer is used directly (project.customer
        # fetch_from would otherwise overwrite an explicit customer value).
        customer = self._make_customer("Disabled Customer", disabled=1)
        doc = self._make_allocation_doc(customer=customer)
        with self.assertRaises(ValidationError) as cm:
            doc.insert(ignore_permissions=True)
        self.assertIn("disabled customer", str(cm.exception).lower())

    def test_edit_unrelated_field_allowed_after_project_cancelled(self):
        # An allocation valid at creation stays editable when its project is later
        # cancelled, as long as the project/customer field itself does not change.
        project = self._make_project("Later Cancelled", self.customer)
        doc = self._make_allocation_doc(project=project)
        doc.insert(ignore_permissions=True)

        frappe.db.set_value("Project", project, "status", "Cancelled")

        doc.reload()
        doc.note = "Updated after cancellation"
        doc.save(ignore_permissions=True)

        self.assertEqual(
            frappe.db.get_value("Resource Allocation", doc.name, "note"),
            "Updated after cancellation",
        )

    def test_end_date_before_start_date_rejected(self):
        doc = self._make_allocation_doc(project=self.project, allocation_end_date="2026-06-10")
        with self.assertRaises(ValidationError) as cm:
            doc.insert(ignore_permissions=True)
        self.assertIn("end date", str(cm.exception).lower())

    def test_same_start_and_end_date_allowed(self):
        doc = self._make_allocation_doc(
            project=self.project,
            allocation_start_date=START_DATE,
            allocation_end_date=START_DATE,
        )
        doc.insert(ignore_permissions=True)
        self.assertTrue(frappe.db.exists("Resource Allocation", doc.name))

    def test_total_cost_is_hourly_rate_times_allocated_hours(self):
        doc = self._make_allocation_doc(project=self.project, total_allocated_hours=40)
        doc.insert(ignore_permissions=True)
        self.assertGreater(doc.hourly_cost_rate, 0)
        self.assertEqual(doc.total_cost, doc.hourly_cost_rate * doc.total_allocated_hours)
