import frappe
from frappe.tests.test_api import FrappeAPITestCase

TEST_EMPLOYEE_USERS = (
    "next-employee@example.com",
    "next-project-manager@example.com",
    "next-employee1@example.com",
)


def setup():
    setup_projects_settings()
    setup_company_and_customer()
    setup_project_and_tasks()
    setup_employee()
    cleanup_test_timesheets()


def setup_projects_settings():
    # next_pms tracks time entries by date only, so same-day entries share
    # identical from/to times and must be allowed to overlap. On real sites this
    # is an onboarding step; a fresh test site defaults the flags off.
    settings = frappe.get_single("Projects Settings")
    settings.ignore_user_time_overlap = 1
    settings.ignore_employee_time_overlap = 1
    settings.save()


def cleanup_test_timesheets():
    # These HTTP integration tests commit their data, so timesheets submitted by
    # the approval tests persist beyond the run. Clear them both before (so a
    # reused database starts clean) and after (so we leave it clean). The commit
    # is required: otherwise the framework's end-of-class rollback would undo
    # these deletes.
    employees = frappe.get_all("Employee", filters={"user_id": ["in", TEST_EMPLOYEE_USERS]}, pluck="name")
    if not employees:
        return
    for name in frappe.get_all("Timesheet", filters={"employee": ["in", employees]}, pluck="name"):
        doc = frappe.get_doc("Timesheet", name)
        if doc.docstatus == 1:
            doc.cancel()
        frappe.delete_doc("Timesheet", name, force=1)
    frappe.db.commit()  # nosemgrep — deletes must survive the class-teardown rollback


def setup_company_and_customer():
    if not frappe.db.exists("Warehouse Type", "Transit"):
        frappe.get_doc({"doctype": "Warehouse Type", "name": "Transit"}).insert(ignore_if_duplicate=True)

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
            "country": "India",
        }
    )
    company.insert(ignore_if_duplicate=True)

    # A fresh site has no default company, so get_default_company() (used when
    # creating employees) returns nothing. Set one only if unset.
    if not frappe.db.get_single_value("Global Defaults", "default_company"):
        defaults = frappe.get_single("Global Defaults")
        defaults.default_company = company.name
        defaults.save()


def setup_project_and_tasks():
    if not frappe.db.exists("Project", {"project_name": "Next Pms"}):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Next Pms",
                "company": "Facebook",
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

    # Fresh sites (no erpnext/hrms setup wizard) lack these masters that
    # Employee creation links to. Seed them so the bootstrap works anywhere.
    if not frappe.db.exists("Gender", "Female"):
        frappe.get_doc({"doctype": "Gender", "gender": "Female"}).insert(ignore_if_duplicate=True)
    if not frappe.db.exists("Employment Type", "Intern"):
        frappe.get_doc({"doctype": "Employment Type", "employee_type_name": "Intern"}).insert(ignore_if_duplicate=True)

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
        cleanup_test_timesheets()
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

    @classmethod
    def setup_project_manager_role(cls):
        if "Projects manager" not in frappe.get_roles("next-project-manager@example.com"):
            user = frappe.get_doc("User", "next-project-manager@example.com")
            user.add_roles("Projects manager")
