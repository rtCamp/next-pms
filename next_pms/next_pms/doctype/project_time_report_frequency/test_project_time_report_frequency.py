# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_time_report_frequency

# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
IGNORE_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]

FREQUENCY_DOCTYPE = "Project Time Report Frequency"
DEFAULT_FREQUENCIES = ("Weekly", "Bi-weekly", "Monthly")


class IntegrationTestProjectTimeReportFrequency(IntegrationTestCase):
    """
    Integration tests for ProjectTimeReportFrequency.
    Use this class for testing interactions between multiple components.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_time_report_frequency()
        cls.company = get_default_company()
        cls.customer = cls._ensure_customer()

    @classmethod
    def _ensure_customer(cls):
        customer = frappe.db.get_value("Customer", {}, "name")
        if customer:
            return customer
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": "_Test Time Report Customer",
                    "customer_type": "Company",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def make_frequency(self, name):
        return frappe.get_doc({"doctype": FREQUENCY_DOCTYPE, "name": name}).insert()

    def make_project(self, project_name, frequency=None):
        return frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": project_name,
                "company": self.company,
                "customer": self.customer,
                "custom_time_report_frequency": frequency,
            }
        ).insert()

    def test_frequency_is_named_from_prompt(self):
        frequency = self.make_frequency("_Test Time Report Frequency Naming")
        self.assertEqual(frequency.name, "_Test Time Report Frequency Naming")
        self.assertTrue(frappe.db.exists(FREQUENCY_DOCTYPE, frequency.name))

    def test_project_links_to_frequency(self):
        frequency = self.make_frequency("_Test Time Report Frequency Linked")
        project = self.make_project("_Test Time Report Project Linked", frequency.name)
        self.assertEqual(project.custom_time_report_frequency, frequency.name)

    def test_project_rejects_unknown_frequency(self):
        self.assertRaises(
            frappe.LinkValidationError,
            self.make_project,
            "_Test Time Report Project Bad Link",
            "_Test Time Report Frequency Missing",
        )

    def test_rename_propagates_to_linked_projects(self):
        frequency = self.make_frequency("_Test Time Report Frequency Old Name")
        project = self.make_project("_Test Time Report Project Renamed", frequency.name)
        frappe.rename_doc(FREQUENCY_DOCTYPE, frequency.name, "_Test Time Report Frequency New Name")
        project.reload()
        self.assertEqual(project.custom_time_report_frequency, "_Test Time Report Frequency New Name")

    def test_delete_is_blocked_while_projects_reference_frequency(self):
        frequency = self.make_frequency("_Test Time Report Frequency Referenced")
        self.make_project("_Test Time Report Project Reference", frequency.name)
        self.assertRaises(frappe.LinkExistsError, frequency.delete)

    def test_delete_unreferenced_frequency(self):
        frequency = self.make_frequency("_Test Time Report Frequency Deletable")
        frequency.delete()
        self.assertFalse(frappe.db.exists(FREQUENCY_DOCTYPE, "_Test Time Report Frequency Deletable"))

    def test_setup_creates_default_frequencies(self):
        setup_time_report_frequency()
        for frequency in DEFAULT_FREQUENCIES:
            self.assertTrue(frappe.db.exists(FREQUENCY_DOCTYPE, frequency))

    def test_setup_is_idempotent(self):
        setup_time_report_frequency()
        setup_time_report_frequency()
        for frequency in DEFAULT_FREQUENCIES:
            self.assertEqual(frappe.db.count(FREQUENCY_DOCTYPE, {"name": frequency}), 1)
