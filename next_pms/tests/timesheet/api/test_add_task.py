import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.project import get_projects
from next_pms.timesheet.api.task import add_task, get_task, get_task_list
from next_pms.timesheet.api.timesheet import save

CUSTOMER_NAME = "Add Task Test Customer"
PROJECT_NAME = "Add Task Test Project"
OTHER_PROJECT_NAME = "Add Task Test Unshared Project"
EMPLOYEE_USER = "add-task-employee@example.com"


class TestAddTask(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = cls._make_customer(CUSTOMER_NAME)
        cls.project = cls._make_project(PROJECT_NAME, cls.customer)
        cls.other_project = cls._make_project(OTHER_PROJECT_NAME, cls.customer)
        make_employee(EMPLOYEE_USER, company=cls.company, leave_approver="Administrator")
        frappe.share.add_docshare(
            "Project", cls.project, EMPLOYEE_USER, read=1, flags={"ignore_share_permission": True}
        )
        cls.shared_task = cls._make_access_task("Access shared task", cls.project)
        cls.other_task = cls._make_access_task("Access unshared task", cls.other_project)

    @classmethod
    def _make_access_task(cls, subject, project):
        existing = frappe.db.get_value("Task", {"subject": subject, "project": project})
        if existing:
            return existing
        return frappe.get_doc({"doctype": "Task", "subject": subject, "project": project}).insert().name

    def tearDown(self):
        frappe.set_user("Administrator")

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

    def test_employee_adds_a_task_to_a_project_shared_with_them(self):
        frappe.set_user(EMPLOYEE_USER)
        add_task(subject="Employee shared task", expected_time="1", project=self.project, description="")
        frappe.set_user("Administrator")
        self.assertEqual(self._get_task("Employee shared task").owner, EMPLOYEE_USER)

    def test_employee_cannot_add_a_task_to_a_project_not_shared_with_them(self):
        frappe.set_user(EMPLOYEE_USER)
        with self.assertRaises(frappe.PermissionError):
            add_task(subject="Employee unshared task", expected_time="1", project=self.other_project, description="")
        frappe.set_user("Administrator")
        self.assertFalse(frappe.db.exists("Task", {"subject": "Employee unshared task"}))

    def test_employee_cannot_move_a_task_to_a_project_not_shared_with_them(self):
        frappe.set_user(EMPLOYEE_USER)
        add_task(subject="Employee task to move", expected_time="1", project=self.project, description="")
        task = self._get_task("Employee task to move")
        task.project = self.other_project
        with self.assertRaises(frappe.PermissionError):
            task.save()

    def test_task_list_holds_only_tasks_of_projects_shared_with_the_employee(self):
        frappe.set_user(EMPLOYEE_USER)
        names = {task.name for task in get_task_list(page_length=500)["task"]}
        self.assertIn(self.shared_task, names)
        self.assertNotIn(self.other_task, names)

    def test_asking_for_an_unshared_project_returns_no_tasks(self):
        frappe.set_user(EMPLOYEE_USER)
        self.assertEqual(get_task_list(projects=[self.other_project])["task"], [])

    def test_project_lookup_holds_only_shared_projects(self):
        frappe.set_user(EMPLOYEE_USER)
        names = {project.name for project in get_projects(limit=500)["data"]}
        self.assertIn(self.project, names)
        self.assertNotIn(self.other_project, names)

    def test_employee_cannot_open_a_task_of_an_unshared_project(self):
        frappe.set_user(EMPLOYEE_USER)
        get_task(self.shared_task, "2026-11-16", "2026-11-22")
        with self.assertRaises(frappe.PermissionError):
            get_task(self.other_task, "2026-11-16", "2026-11-22")

    def test_employee_cannot_log_time_on_a_task_of_an_unshared_project(self):
        frappe.set_user(EMPLOYEE_USER)
        with self.assertRaises(frappe.PermissionError):
            save(date=frappe.utils.today(), description="Unshared", task=self.other_task, hours=1)
