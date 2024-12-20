import frappe
from frappe.tests.test_api import FrappeAPITestCase


def setup():
    setup_company_and_customer()
    setup_project_and_tasks()
    setup_employee()


def setup_company_and_customer():
    if not frappe.db.exists("Customer", "Meta"):
        customer = frappe.get_doc(
            {
                "doctype": "Customer",
                "customer_name": "Meta",
                "customer_type": "Company",
                "default_currency": "INR",
            }
        )
        customer.insert(ignore_if_duplicate=True)

    company = frappe.get_doc(
        {
            "doctype": "Company",
            "company_name": "Facebook",
            "default_currency": "INR",
        }
    )
    company.insert(ignore_if_duplicate=True)


def setup_project_and_tasks():
    if not frappe.db.exists("Project", {"project_name": "Next Pms"}):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Next Pms",
                "customer": "Meta",
                "estimated_costing": 50000,
                "custom_billing_type": "Non-Billable",
            }
        )
        project.insert()
    else:
        project = frappe.get_doc("Project", {"project_name": "Next Pms"})

    task_list = [
        {
            "subject": "Task 1",
            "project": project.name,
        },
        {
            "subject": "Task 2",
            "project": project.name,
        },
    ]
    for task in task_list:
        if frappe.db.exists("Task", {"subject": task["subject"]}):
            continue
        task_doc = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": task["subject"],
                "project": task["project"],
            }
        )
        task_doc.insert(ignore_if_duplicate=True)


def setup_employee():
    from .utils import make_employee

    emp = make_employee("next-employee@example.com")
    manager = make_employee("next-project-manager@example.com")
    make_employee("next-employee1@example.com")

    # Set manager for emp
    emp = frappe.get_doc("Employee", emp)
    emp.reports_to = manager
    emp.save()


class TestNextPms(FrappeAPITestCase):
    """This is base class for all the test cases in next_pms app.
    It will contain common method which will be used in test cases.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.setup_project_manager_role()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()

    def assign_roles_to_user(self, user: str, roles):
        user = frappe.get_doc("User", user)
        user.add_roles(*roles)

    def login_as_user(self, user: str):
        frappe.set_user(user)

    def get(self, path, params=None, **kwargs):
        params = {**params, "sid": self.sid}
        return super().get(path, params, **kwargs)

    def post(self, path, data, **kwargs):
        data = {**data, "sid": self.sid}
        return super().post(path, data, **kwargs)

    def get_login_employee(self):
        return frappe.get_value("Employee", {"user_id": frappe.session.user}, "name")

    def setup_project_manager_role(self):
        if "Projects manager" not in frappe.get_roles("next-project-manager@example.com"):
            self.assign_roles_to_user("next-project-manager@example.com", ["Projects manager"])
