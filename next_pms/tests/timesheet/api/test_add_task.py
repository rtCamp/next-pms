import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.timesheet.api.task import add_task

CUSTOMER_NAME = "Add Task Test Customer"
PROJECT_NAME = "Add Task Test Project"


class TestAddTask(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = cls._make_customer(CUSTOMER_NAME)
        cls.project = cls._make_project(PROJECT_NAME, cls.customer)

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

    def _get_task(self, subject):
        return frappe.get_doc("Task", {"subject": subject, "project": self.project})

    def test_add_task_creates_task_with_required_fields(self):
        result = add_task(
            subject="Minimal task",
            expected_time="4",
            project=self.project,
            description="A minimal task",
        )
        self.assertEqual(result, frappe._("Task Created Successfully"))

        task = self._get_task("Minimal task")
        self.assertEqual(task.expected_time, 4)
        self.assertEqual(task.description, "A minimal task")
        # Task.priority is a Select field; with no priority kwarg, Frappe falls
        # back to the first option ("Low") rather than leaving it blank.
        self.assertEqual(task.priority, "Low")
        self.assertFalse(task.exp_end_date)

    def test_add_task_sets_priority_when_provided(self):
        add_task(
            subject="Prioritized task",
            expected_time="2",
            project=self.project,
            description="Has a priority",
            priority="Urgent",
        )
        task = self._get_task("Prioritized task")
        self.assertEqual(task.priority, "Urgent")

    def test_add_task_sets_exp_end_date_when_provided(self):
        add_task(
            subject="Due dated task",
            expected_time="2",
            project=self.project,
            description="Has a due date",
            exp_end_date="2026-09-15",
        )
        task = self._get_task("Due dated task")
        self.assertEqual(frappe.utils.getdate(task.exp_end_date), frappe.utils.getdate("2026-09-15"))

    def test_add_task_sets_both_priority_and_exp_end_date(self):
        add_task(
            subject="Fully specified task",
            expected_time="3",
            project=self.project,
            description="Has both",
            priority="High",
            exp_end_date="2026-10-01",
        )
        task = self._get_task("Fully specified task")
        self.assertEqual(task.priority, "High")
        self.assertEqual(frappe.utils.getdate(task.exp_end_date), frappe.utils.getdate("2026-10-01"))

    def test_add_task_treats_empty_string_priority_as_unset(self):
        add_task(
            subject="Empty priority task",
            expected_time="1",
            project=self.project,
            description="Priority sent as empty string",
            priority="",
        )
        task = self._get_task("Empty priority task")
        # add_task only assigns priority when truthy, so an empty string is
        # ignored and the field is left at Frappe's own Select default ("Low").
        self.assertEqual(task.priority, "Low")

    def test_add_task_treats_empty_string_exp_end_date_as_unset(self):
        add_task(
            subject="Empty due date task",
            expected_time="1",
            project=self.project,
            description="Due date sent as empty string",
            exp_end_date="",
        )
        task = self._get_task("Empty due date task")
        self.assertFalse(task.exp_end_date)

    def test_add_task_defaults_priority_and_exp_end_date_when_omitted(self):
        add_task(
            subject="Omitted optional fields task",
            expected_time="1",
            project=self.project,
            description="No priority/exp_end_date kwargs at all",
        )
        task = self._get_task("Omitted optional fields task")
        self.assertEqual(task.priority, "Low")
        self.assertFalse(task.exp_end_date)
