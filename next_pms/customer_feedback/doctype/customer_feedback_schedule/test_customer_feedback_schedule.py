# Copyright (c) 2024, rtCamp and Contributors
# See license.txt

from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.customer_feedback.doctype.customer_feedback_schedule.customer_feedback_schedule import (
    send_feedback_request,
)
from next_pms.tests.utils import make_test_employee


class TestCustomerFeedbackSchedule(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        # The tests insert their own records; skip IntegrationTestCase's auto test records for linked doctypes.
        frappe.local.test_objects.setdefault("Customer Feedback Schedule", [])
        super().setUpClass()

    def setUp(self):
        """Set up test data before each test"""
        frappe.set_user("Administrator")
        self.created_docs = []
        self.cleanup_test_data()

    def tearDown(self):
        """Clean up test data after each test"""
        self.cleanup_test_data()
        frappe.db.rollback()

    def cleanup_test_data(self):
        """Remove any test data created during tests"""
        # Delete any docs tracked during the test
        for doctype, name in reversed(self.created_docs):
            if frappe.db.exists(doctype, name):
                frappe.delete_doc(doctype, name, force=True, ignore_permissions=True)

        # Delete test schedules - cleanup any that match the auto-naming pattern
        schedules = frappe.get_all("Customer Feedback Schedule", filters={"name": ["like", "CFS-%"]})
        for schedule in schedules:
            # Only delete if it references our test data
            if frappe.db.exists("Customer Feedback Schedule", schedule.name):
                doc = frappe.get_doc("Customer Feedback Schedule", schedule.name)
                if doc.customer and "TEST-CUSTOMER" in doc.customer:
                    frappe.delete_doc(
                        "Customer Feedback Schedule",
                        schedule.name,
                        force=True,
                        ignore_permissions=True,
                    )

        # Delete test contacts
        frappe.db.delete("Contact", {"email_id": "test_feedback@example.com"})
        # Delete test customers
        frappe.db.delete("Customer", {"name": ["like", "TEST-CUSTOMER-%"]})
        # Delete test employees
        frappe.db.delete("Employee", {"name": ["like", "TEST-EMP-%"]})
        # Delete test email templates
        frappe.db.delete("Email Template", {"name": "Test Feedback Template"})
        frappe.db.commit()

    def create_test_employee(self, emp_id):
        """Helper to create test employee"""
        if not frappe.db.exists("Designation", "Developer"):
            frappe.get_doc({"doctype": "Designation", "designation_name": "Developer"}).insert(ignore_permissions=True)
            self.created_docs.append(("Designation", "Developer"))

        # Employees are named by their naming series, so emp_id only labels the record.
        company = frappe.get_all("Company", limit=1)
        employee = make_test_employee(
            first_name="Test Employee",
            last_name=emp_id,
            designation="Developer",
            company=company[0].name if company else None,
        )
        self.created_docs.append(("Employee", employee))
        return frappe.get_doc("Employee", employee)

    def create_test_customer(self):
        """Helper to create test customer"""
        customer_name = "TEST-CUSTOMER-001"
        if not frappe.db.exists("Customer", customer_name):
            # Get a valid customer group
            customer_group = frappe.get_all("Customer Group", filters={"is_group": 0}, limit=1)
            if not customer_group:
                # Fallback: use any customer group
                customer_group = frappe.get_all("Customer Group", limit=1)
            customer_group_name = customer_group[0].name if customer_group else None

            customer = frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": customer_name,
                    "customer_type": "Company",
                    "customer_group": customer_group_name,
                    # rtCamp makes Billing Currency mandatory on Customer.
                    "default_currency": frappe.db.get_default("currency") or "INR",
                }
            )
            customer.insert(ignore_permissions=True)
            self.created_docs.append(("Customer", customer_name))
            return customer
        return frappe.get_doc("Customer", customer_name)

    def create_test_contact(self):
        """Helper to create test contact"""
        if not frappe.db.exists("Contact", {"email_id": "test_feedback@example.com"}):
            contact = frappe.get_doc(
                {
                    "doctype": "Contact",
                    "first_name": "Test",
                    "last_name": "Contact",
                    "email_id": "test_feedback@example.com",
                }
            )
            contact.insert(ignore_permissions=True)
            self.created_docs.append(("Contact", contact.name))
            return contact
        return frappe.get_doc("Contact", {"email_id": "test_feedback@example.com"})

    def create_test_email_template(self):
        """Helper to create test email template"""
        if not frappe.db.exists("Email Template", "Test Feedback Template"):
            template = frappe.get_doc(
                {
                    "doctype": "Email Template",
                    "name": "Test Feedback Template",
                    "subject": "Feedback Request for {{ contact_name }}",
                    "response": "Dear {{ contact_name }}, please provide feedback.",
                    "use_html": 0,
                }
            )
            template.insert(ignore_permissions=True)
            self.created_docs.append(("Email Template", "Test Feedback Template"))
            return template
        return frappe.get_doc("Email Template", "Test Feedback Template")

    @patch("frappe.sendmail")
    def test_send_feedback_request_resource_type(self, mock_sendmail):
        """Test that send_feedback_request generates unique tokens for all employees in a single save"""
        # Create test data
        customer = self.create_test_customer()
        contact = self.create_test_contact()
        template = self.create_test_email_template()

        # Create employees
        emp1 = self.create_test_employee("TEST-EMP-001")
        emp2 = self.create_test_employee("TEST-EMP-002")
        emp3 = self.create_test_employee("TEST-EMP-003")

        # Create feedback schedule
        schedule = frappe.get_doc(
            {
                "doctype": "Customer Feedback Schedule",
                "customer": customer.name,
                "feedback_type": "Resource",
                "feedback_by": contact.name,
                "email_template": template.name,
                "feedback_from_date": "2024-01-01",
                "feedback_to_date": "2024-12-31",
                "resources": [
                    {"employee": emp1.name},
                    {"employee": emp2.name},
                    {"employee": emp3.name},
                ],
            }
        )
        schedule.insert(ignore_permissions=True)
        self.created_docs.append(("Customer Feedback Schedule", schedule.name))

        # Call send_feedback_request
        send_feedback_request(schedule.name)

        # Reload the schedule to get updated data
        schedule.reload()

        # Verify schedule token is set
        self.assertIsNotNone(schedule.schedule_unique_token)
        self.assertEqual(len(schedule.schedule_unique_token), 56)

        # Verify all employees have unique tokens
        tokens = []
        for resource in schedule.resources:
            self.assertIsNotNone(
                resource.unique_token,
                f"Employee {resource.employee} should have a unique token",
            )
            self.assertEqual(len(resource.unique_token), 56)
            tokens.append(resource.unique_token)

        # Verify all tokens are unique
        self.assertEqual(len(tokens), len(set(tokens)), "All employee tokens should be unique")

        # Verify email was sent
        mock_sendmail.assert_called_once()
        call_args = mock_sendmail.call_args
        self.assertIn(contact.email_id, call_args.kwargs.get("recipients", []))

    @patch("frappe.sendmail")
    def test_send_feedback_request_project_type(self, mock_sendmail):
        """Test that send_feedback_request works correctly for Project type"""
        # Create test data
        customer = self.create_test_customer()
        contact = self.create_test_contact()
        template = self.create_test_email_template()

        # Create feedback schedule for Project type
        schedule = frappe.get_doc(
            {
                "doctype": "Customer Feedback Schedule",
                "customer": customer.name,
                "feedback_type": "Project",
                "feedback_by": contact.name,
                "email_template": template.name,
                "feedback_from_date": "2024-01-01",
                "feedback_to_date": "2024-12-31",
            }
        )
        schedule.insert(ignore_permissions=True)
        self.created_docs.append(("Customer Feedback Schedule", schedule.name))

        # Call send_feedback_request
        send_feedback_request(schedule.name)

        # Reload the schedule to get updated data
        schedule.reload()

        # Verify schedule token is set
        self.assertIsNotNone(schedule.schedule_unique_token)
        self.assertEqual(len(schedule.schedule_unique_token), 56)

        # Verify email was sent
        mock_sendmail.assert_called_once()
        call_args = mock_sendmail.call_args
        self.assertIn(contact.email_id, call_args.kwargs.get("recipients", []))
