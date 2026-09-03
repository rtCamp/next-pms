from unittest.mock import patch

import frappe
import frappe.share
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

from next_pms.install import setup_project_threshold_reminder_template
from next_pms.project_currency.constant import PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE
from next_pms.project_currency.tasks.reminde_project_threshold import send_reminder_mail

PM_USER = "threshold-reminder-pm@example.com"
VIEWER_USER = "threshold-reminder-viewer@example.com"
TEMPLATE_NAME = "Project Threshold Reminder Test Template"
PROJECT_PREFIX = "Threshold Reminder"
BATCH_QUERY_COUNT = 5


class TestSendReminderMail(IntegrationTestCase):
    """The threshold reminder job must run a fixed number of queries no matter how many projects exist."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls._make_user(PM_USER, "Projects Manager")
        cls._make_user(VIEWER_USER, "Employee")
        cls._make_email_template()

        cls.retainer_over = cls._make_project(
            "Retainer", budget_rows=[(100, 10), (100, 90)], share_with=(PM_USER, VIEWER_USER)
        )
        cls.retainer_under = cls._make_project("Retainer", budget_rows=[(100, 10)], share_with=(PM_USER,))
        cls.retainer_no_budget = cls._make_project("Retainer", share_with=(PM_USER,))
        cls.retainer_zero_purchased = cls._make_project("Retainer", budget_rows=[(0, 5)], share_with=(PM_USER,))
        cls.tm_over = cls._make_project(
            "Time and Material", share_with=(PM_USER,), estimated_costing=1000, total_billable_amount=900
        )
        cls.tm_zero_estimate = cls._make_project(
            "Time and Material", share_with=(PM_USER,), estimated_costing=0, total_billable_amount=900
        )
        cls.viewer_only = cls._make_project("Retainer", budget_rows=[(100, 90)], share_with=(VIEWER_USER,))
        cls.unshared = cls._make_project("Retainer", budget_rows=[(100, 90)])
        cls.projects = [
            cls.retainer_over,
            cls.retainer_under,
            cls.retainer_no_budget,
            cls.retainer_zero_purchased,
            cls.tm_over,
            cls.tm_zero_estimate,
            cls.viewer_only,
            cls.unshared,
        ]

    @classmethod
    def tearDownClass(cls):
        for name in cls.projects:
            frappe.delete_doc("Project", name, force=True, ignore_permissions=True)
        frappe.delete_doc("Email Template", TEMPLATE_NAME, force=True, ignore_permissions=True)
        super().tearDownClass()

    @classmethod
    def _make_user(cls, email, role):
        if frappe.db.exists("User", email):
            frappe.get_doc("User", email).add_roles(role)
            return
        frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": email,
                "send_welcome_email": 0,
                "roles": [{"role": role}],
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _make_email_template(cls):
        if frappe.db.exists("Email Template", TEMPLATE_NAME):
            return
        frappe.get_doc(
            {
                "doctype": "Email Template",
                "__newname": TEMPLATE_NAME,
                "subject": "Threshold reached for {{ project.name }}",
                "use_html": 0,
                "response": (
                    "{{ project.project_name }} is {{ project.custom_billing_type }} "
                    "with {{ project.custom_project_budget_hours | length }} budget rows"
                ),
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _make_project(cls, billing_type, budget_rows=(), share_with=(), **project_values):
        start_date, end_date = add_days(nowdate(), -30), nowdate()
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"{PROJECT_PREFIX} {frappe.generate_hash(length=8)}",
                "company": cls.company,
                "status": "Open",
                "custom_billing_type": billing_type,
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "custom_reminder_threshold_percentage": 80,
                "custom_email_template": TEMPLATE_NAME,
                "custom_project_budget_hours": [
                    {"start_date": start_date, "end_date": end_date, "hours_purchased": purchased}
                    for purchased, _ in budget_rows
                ],
            }
        ).insert(ignore_permissions=True)

        # Project.validate recomputes consumed hours and billing totals from timesheets, so set them after insert.
        for row, (_, consumed) in zip(project.custom_project_budget_hours, budget_rows, strict=True):
            frappe.db.set_value("Project Budget", row.name, "consumed_hours", consumed)
        if project_values:
            frappe.db.set_value("Project", project.name, project_values)

        for user in share_with:
            frappe.share.add_docshare("Project", project.name, user=user, flags={"ignore_share_permission": True})
        return project.name

    def _run_job(self):
        with patch.object(frappe, "sendmail") as sendmail:
            send_reminder_mail()
        return {
            call.kwargs["subject"].split()[-1]: call.kwargs
            for call in sendmail.call_args_list
            if call.kwargs["subject"].split()[-1] in self.projects
        }

    def test_sends_only_for_projects_past_threshold(self):
        sent = self._run_job()

        self.assertEqual(set(sent), {self.retainer_over, self.tm_over})
        self.assertEqual(sent[self.retainer_over]["recipients"], [PM_USER])
        self.assertEqual(sent[self.tm_over]["recipients"], [PM_USER])

    def test_template_receives_project_with_budget_rows(self):
        sent = self._run_job()

        project_name = frappe.db.get_value("Project", self.retainer_over, "project_name")
        self.assertEqual(sent[self.retainer_over]["message"], f"{project_name} is Retainer with 2 budget rows")
        self.assertEqual(sent[self.retainer_over]["subject"], f"Threshold reached for {self.retainer_over}")

    def test_query_count_does_not_grow_with_projects(self):
        # The first run also fills frappe's per-table column cache, which is not part of the job's own cost.
        self._run_job()

        with patch.object(frappe, "sendmail") as sendmail, self.assertQueryCount(BATCH_QUERY_COUNT):
            send_reminder_mail()

        self.assertGreaterEqual(sendmail.call_count, 2)


class TestProjectThresholdReminderTemplate(IntegrationTestCase):
    """The shipped template must install idempotently and render for both billing types."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        setup_project_threshold_reminder_template()
        setup_project_threshold_reminder_template()
        cls.template = frappe.get_doc("Email Template", PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE)

    def _render(self, project_values):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "name": "PROJ-TEMPLATE-TEST",
                "project_name": "Template Test",
                "company": get_default_company(),
                "custom_currency": "INR",
                "custom_reminder_threshold_percentage": 80.0,
                **project_values,
            }
        )
        args = {"project": project}
        return (
            frappe.render_template(self.template.subject, args),
            frappe.render_template(self.template.response_html, args),
        )

    def test_template_is_installed_once(self):
        self.assertEqual(self.template.use_html, 1)
        self.assertEqual(frappe.db.count("Email Template", {"name": PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE}), 1)

    def test_renders_retainer_budget_hours(self):
        subject, message = self._render(
            {
                "custom_billing_type": "Retainer",
                "custom_project_budget_hours": [
                    {"hours_purchased": 50.0, "consumed_hours": 10.0, "remaining_hours": 40.0},
                    {"hours_purchased": 100.0, "consumed_hours": 90.0, "remaining_hours": 10.0},
                ],
            }
        )

        self.assertEqual(subject, "Project threshold reached for Template Test")
        self.assertIn("80.0% threshold limit", message)
        self.assertIn("Total Budget: 100.0 hours", message)
        self.assertIn("Spent: 90.0 hours", message)
        self.assertIn("Remaining: 10.0 hours", message)
        self.assertNotIn("no such element", message)

    def test_renders_time_and_material_amounts(self):
        _, message = self._render(
            {
                "custom_billing_type": "Time and Material",
                "estimated_costing": 1000.0,
                "total_billable_amount": 900.0,
            }
        )

        self.assertIn("Total Budget: ₹ 1,000.00", message)
        self.assertIn("Spent: ₹ 900.00", message)
        self.assertIn("Remaining: ₹ 100.00", message)
        self.assertNotIn("no such element", message)
