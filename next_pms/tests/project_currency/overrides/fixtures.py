from contextlib import contextmanager
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.project_currency.background_jobs import project_costing
from next_pms.tests.utils import make_employee, make_tech_stack
from next_pms.timesheet.utils.constant import EMP_WOKING_DETAILS

COMPANY = "Facebook"
INR_CUSTOMER = "Meta"
USD_CUSTOMER = "Override Test USD Customer"
EMPLOYEE_USER = "override-test-employee@example.com"

DATE = "2026-08-04"
NEXT_WEEK = "2026-08-11"

USD_TO_INR = 80.0
INR_TO_USD = 0.0125

# 192000 / 12 months / 160 monthly hours (8 h "Per Day") = 100 INR an hour.
CTC_INR = 192000
HOURLY_COST_INR = 100.0
HOURLY_COST_USD = HOURLY_COST_INR * INR_TO_USD

ENQUEUE_PATH = "next_pms.project_currency.overrides.timesheet.enqueue_update_task_and_project"


class OverrideTestCase(IntegrationTestCase):
    """Real records for pinning the Project, Timesheet and Task overrides.

    Everything is created inside the class transaction and rolled back afterwards. The
    costing job is never enqueued for real: saves go through `capture_costing`, which
    records the names our Timesheet override hands to the job."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        ensure_global_currency("INR")
        ensure_customer(USD_CUSTOMER, "USD")
        set_exchange_rate("USD", "INR", USD_TO_INR)
        set_exchange_rate("INR", "USD", INR_TO_USD)
        cls.employee = make_employee(
            EMPLOYEE_USER,
            company=COMPANY,
            ctc=CTC_INR,
            salary_currency="INR",
            custom_work_schedule="Per Day",
            custom_working_hours=8,
        )
        frappe.cache().hdel(EMP_WOKING_DETAILS, cls.employee)
        frappe.clear_document_cache("Employee", cls.employee)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        frappe.defaults._clear_cache("__default")
        frappe.cache().hdel(EMP_WOKING_DETAILS, cls.employee)

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        delete_timesheets_of(self.employee)
        delete_promotions_of(self.employee)

    def make_project(self, **fields):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Override Test {frappe.generate_hash(length=8)}",
                "company": COMPANY,
                "customer": INR_CUSTOMER,
                "custom_billing_type": "Non-Billable",
                "tech_stack": make_tech_stack(),
                **fields,
            }
        )
        return project.insert(ignore_permissions=True)

    def make_task(self, project, **fields):
        return frappe.get_doc(
            {
                "doctype": "Task",
                "subject": f"Override Test Task {frappe.generate_hash(length=8)}",
                "project": project,
                **fields,
            }
        ).insert(ignore_permissions=True)

    def build_timesheet(self, project, task, rows, date=DATE, **fields):
        """Unsaved Timesheet with one row per dict in rows, all on date, against task."""
        doc = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": self.employee,
                "parent_project": project,
                "time_logs": [
                    {
                        "task": task,
                        "project": project,
                        "from_time": date,
                        "to_time": date,
                        "description": "Override characterization",
                        **row,
                    }
                    for row in rows
                ],
                **fields,
            }
        )
        doc.ignore_backdated_validation = True
        return doc

    def make_timesheet(self, project, task, rows, date=DATE, submit=False, **fields):
        doc = self.build_timesheet(project, task, rows, date=date, **fields)
        with capture_costing():
            doc.insert(ignore_permissions=True)
            if submit:
                doc.submit()
        return doc


def ensure_global_currency(currency):
    if not frappe.db.get_default("currency"):
        frappe.db.set_default("currency", currency)
        frappe.clear_cache()


def ensure_customer(name, currency):
    if not frappe.db.exists("Customer", name):
        frappe.get_doc(
            {
                "doctype": "Customer",
                "customer_name": name,
                "customer_type": "Company",
                "default_currency": currency,
            }
        ).insert(ignore_permissions=True)


def set_exchange_rate(from_currency, to_currency, rate, date=DATE):
    frappe.db.delete("Currency Exchange", {"from_currency": from_currency, "to_currency": to_currency, "date": date})
    frappe.get_doc(
        {
            "doctype": "Currency Exchange",
            "date": date,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "exchange_rate": rate,
            "for_buying": 1,
            "for_selling": 1,
        }
    ).insert(ignore_permissions=True)


def delete_timesheets_of(employee):
    names = frappe.get_all("Timesheet", filters={"employee": employee}, pluck="name")
    if names:
        frappe.db.delete("Timesheet Detail", {"parent": ["in", names]})
        frappe.db.delete("Timesheet", {"name": ["in", names]})


def delete_promotions_of(employee):
    names = frappe.get_all("Employee Promotion", filters={"employee": employee}, pluck="name")
    if names:
        frappe.db.delete("Employee Property History", {"parent": ["in", names], "parenttype": "Employee Promotion"})
        frappe.db.delete("Employee Promotion", {"name": ["in", names]})


def insert_bare(doctype, children=None, **fields):
    """Insert doctype with only the given fields, skipping its controller, and return its name.

    For documents whose own validation needs unrelated setup (items, accounts, payroll):
    the overrides only read a handful of their header or line fields."""
    doc = frappe.get_doc({"doctype": doctype, "name": f"OVR-{frappe.generate_hash(length=10)}", **fields})
    doc.db_insert()

    meta = frappe.get_meta(doctype)
    for parentfield, rows in (children or {}).items():
        child_doctype = meta.get_field(parentfield).options
        for idx, row in enumerate(rows, start=1):
            frappe.get_doc(
                {
                    "doctype": child_doctype,
                    "name": f"OVR-{frappe.generate_hash(length=10)}",
                    "parent": doc.name,
                    "parenttype": doctype,
                    "parentfield": parentfield,
                    "idx": idx,
                    "docstatus": fields.get("docstatus", 0),
                    **row,
                }
            ).db_insert()

    return doc.name


@contextmanager
def capture_costing():
    """Record each call our Timesheet override makes to the costing job, instead of enqueueing it."""
    calls = []
    with (
        patch(ENQUEUE_PATH, side_effect=lambda tasks, projects: calls.append((tasks, projects))),
        patch.object(project_costing.frappe, "enqueue"),
    ):
        yield calls


def run_costing(calls):
    """Run the costing job for every captured call, the way the worker would."""
    for tasks, projects in calls:
        project_costing.update_task_and_project(tasks=tasks, projects=projects)
