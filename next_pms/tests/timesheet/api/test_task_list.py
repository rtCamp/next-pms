import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.timesheet.api.task import get_task_list

CUSTOMER_NAME = "Task List Test Customer"
PROJECT_NAME = "Task List Test Project"

# (subject, priority, status, expected_time)
TASKS = [
    ("Alpha login page", "Low", "Working", 5),
    ("Bravo push service", "High", "Working", 10),
    ("Charlie billing sync", "High", "Pending Review", 2),
    ("Delta reporting", "Medium", "Overdue", 8),
]


class TestGetTaskListFiltersAndSorting(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = cls._make_customer(CUSTOMER_NAME)
        cls.project = cls._make_project(PROJECT_NAME, cls.customer)
        cls.task_names = {
            subject: cls._make_task(subject, priority, status, expected_time)
            for subject, priority, status, expected_time in TASKS
        }

    @classmethod
    def _make_customer(cls, customer_name):
        existing = frappe.db.get_value("Customer", {"customer_name": customer_name})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": customer_name,
                    "customer_type": "Company",
                    "default_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls, project_name, customer):
        if frappe.db.exists("Project", {"project_name": project_name}):
            return frappe.db.get_value("Project", {"project_name": project_name}, "name")
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": project_name,
                    "company": cls.company,
                    "customer": customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_task(cls, subject, priority, status, expected_time):
        existing = frappe.db.get_value("Task", {"subject": subject, "project": cls.project})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Task",
                    "subject": subject,
                    "project": cls.project,
                    "priority": priority,
                    "status": status,
                    "expected_time": expected_time,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def _subjects(self, result):
        return [row["subject"] for row in result["task"]]

    def test_filter_single_field(self):
        result = get_task_list(projects=[self.project], filters=[["priority", "=", "High"]])
        self.assertEqual(set(self._subjects(result)), {"Bravo push service", "Charlie billing sync"})
        self.assertEqual(result["total_count"], 2)

    def test_filter_multiple_fields_are_anded(self):
        result = get_task_list(
            projects=[self.project],
            filters=[["priority", "=", "High"], ["status", "=", "Working"]],
        )
        self.assertEqual(self._subjects(result), ["Bravo push service"])
        self.assertEqual(result["total_count"], 1)

    def test_filter_in_operator(self):
        result = get_task_list(projects=[self.project], filters=[["status", "in", ["Working", "Overdue"]]])
        self.assertEqual(
            set(self._subjects(result)),
            {"Alpha login page", "Bravo push service", "Delta reporting"},
        )
        self.assertEqual(result["total_count"], 3)

    def test_filter_comparison_operator(self):
        result = get_task_list(projects=[self.project], filters=[["expected_time", ">", 5]])
        self.assertEqual(set(self._subjects(result)), {"Bravo push service", "Delta reporting"})

    def test_filter_dict_form_raises(self):
        with self.assertRaises(frappe.exceptions.FrappeTypeError):
            get_task_list(projects=[self.project], filters={"priority": "Medium"})

    def test_filter_accepts_json_string(self):
        result = get_task_list(projects=[self.project], filters=json.dumps([["status", "=", "Pending Review"]]))
        self.assertEqual(self._subjects(result), ["Charlie billing sync"])

    def test_filter_unknown_field_raises(self):
        with self.assertRaises(frappe.ValidationError):
            get_task_list(projects=[self.project], filters=[["not_a_real_field", "=", "x"]])

    def test_filter_unknown_operator_raises(self):
        with self.assertRaises(frappe.ValidationError):
            get_task_list(projects=[self.project], filters=[["priority", "matches", "High"]])

    def test_order_by_ascending(self):
        result = get_task_list(projects=[self.project], order_by="subject asc")
        self.assertEqual(
            self._subjects(result),
            ["Alpha login page", "Bravo push service", "Charlie billing sync", "Delta reporting"],
        )

    def test_order_by_descending(self):
        result = get_task_list(projects=[self.project], order_by="subject desc")
        self.assertEqual(
            self._subjects(result),
            ["Delta reporting", "Charlie billing sync", "Bravo push service", "Alpha login page"],
        )

    def test_order_by_numeric_field(self):
        result = get_task_list(projects=[self.project], order_by="expected_time asc")
        self.assertEqual(
            self._subjects(result),
            ["Charlie billing sync", "Alpha login page", "Delta reporting", "Bravo push service"],
        )

    def test_order_by_multiple_fields(self):
        # priority asc groups alphabetically (High, Low, Medium); subject desc breaks ties.
        result = get_task_list(projects=[self.project], order_by="priority asc, subject desc")
        self.assertEqual(
            self._subjects(result),
            ["Charlie billing sync", "Bravo push service", "Alpha login page", "Delta reporting"],
        )

    def test_order_by_default_field(self):
        # `modified` is a Frappe default column, not a Task DocField, but must still be sortable.
        # Stamp distinct modified values so order is deterministic (avoids same-second ties).
        stamps = {
            "Alpha login page": "2024-01-01 10:00:00",
            "Bravo push service": "2024-01-03 10:00:00",
            "Charlie billing sync": "2024-01-02 10:00:00",
            "Delta reporting": "2024-01-04 10:00:00",
        }
        for subject, modified in stamps.items():
            frappe.db.set_value("Task", self.task_names[subject], "modified", modified, update_modified=False)

        result = get_task_list(projects=[self.project], order_by="modified desc")
        self.assertEqual(
            self._subjects(result),
            ["Delta reporting", "Bravo push service", "Charlie billing sync", "Alpha login page"],
        )

    def test_filter_on_default_field(self):
        stamps = {
            "Alpha login page": "1999-06-01 00:00:00",
            "Bravo push service": "2024-01-03 10:00:00",
            "Charlie billing sync": "2024-01-02 10:00:00",
            "Delta reporting": "2024-01-04 10:00:00",
        }
        for subject, modified in stamps.items():
            frappe.db.set_value("Task", self.task_names[subject], "modified", modified, update_modified=False)

        result = get_task_list(projects=[self.project], filters=[["modified", ">", "2000-01-01"]])
        self.assertEqual(result["total_count"], 3)
        self.assertEqual(
            set(self._subjects(result)),
            {"Bravo push service", "Charlie billing sync", "Delta reporting"},
        )

    def test_order_by_unknown_field_raises(self):
        with self.assertRaises(frappe.ValidationError):
            get_task_list(projects=[self.project], order_by="not_a_real_field asc")

    def test_order_by_invalid_direction_raises(self):
        with self.assertRaises(frappe.ValidationError):
            get_task_list(projects=[self.project], order_by="subject sideways")

    def test_filters_and_order_by_combined(self):
        result = get_task_list(
            projects=[self.project],
            filters=[["priority", "=", "High"]],
            order_by="subject asc",
        )
        self.assertEqual(self._subjects(result), ["Bravo push service", "Charlie billing sync"])
