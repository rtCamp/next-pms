from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.project_currency.tasks.reminder_project_threshold import send_reminder_mail

PM_USER = "threshold-reminder-pm@example.com"
NON_PM_USER = "threshold-reminder-member@example.com"
TEMPLATE_NAME = "Project Threshold Reminder Test Template"
AMOUNT_TEMPLATE_NAME = "Project Threshold Reminder Test Amount Template"
PROJECT_PREFIX = "Threshold Reminder Test"

TEMPLATE_RESPONSE = """<p>Hello,</p>
<p>The {{ project.custom_reminder_threshold_percentage }} threshold limit for the
Project - {{ project.project_name }} have been reached.</p>
<p>Total Budget: {{ project.custom_project_budget_hours[-1].hours_purchased }}</p>
<p>Spent: {{ project.custom_project_budget_hours[-1].consumed_hours }}</p>
<p>Remaining: {{ project.custom_project_budget_hours[-1].remaining_hours }}</p>"""

AMOUNT_TEMPLATE_RESPONSE = """<p>Project - {{ project.project_name }} has billed
{{ project.total_billable_amount }} of {{ project.total_sales_amount }}.</p>"""


class TestProjectThresholdReminder(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls._cleanup_projects()
        cls._make_email_template()
        cls._make_user(PM_USER, with_pm_role=True)
        cls._make_user(NON_PM_USER, with_pm_role=False)

        cls.retainer_over = cls._make_retainer_project(
            f"{PROJECT_PREFIX} Retainer Over", hours_purchased=100, consumed_hours=90
        )
        cls.retainer_under = cls._make_retainer_project(
            f"{PROJECT_PREFIX} Retainer Under", hours_purchased=100, consumed_hours=10
        )
        cls.retainer_zero_hours = cls._make_retainer_project(
            f"{PROJECT_PREFIX} Retainer Zero", hours_purchased=0, consumed_hours=0
        )
        cls.tnm_over = cls._make_project(
            f"{PROJECT_PREFIX} TnM Over", "Time and Material", template=AMOUNT_TEMPLATE_NAME
        )
        frappe.db.set_value("Project", cls.tnm_over, {"total_sales_amount": 1000, "total_billable_amount": 900})

        for project in (cls.retainer_over, cls.retainer_zero_hours, cls.tnm_over):
            cls._share_project(project, PM_USER)
        cls._share_project(cls.retainer_over, NON_PM_USER)
        cls._share_project(cls.retainer_under, PM_USER)

        cls.original_mute_emails = frappe.flags.mute_emails
        frappe.flags.mute_emails = True
        cls.enterClassContext(patch("frappe.utils.get_assets_json", return_value={}))

    @classmethod
    def tearDownClass(cls):
        frappe.flags.mute_emails = cls.original_mute_emails
        super().tearDownClass()

    @classmethod
    def _cleanup_projects(cls):
        stale_projects = frappe.get_all(
            "Project", filters={"project_name": ["like", f"{PROJECT_PREFIX}%"]}, pluck="name"
        )
        for name in stale_projects:
            frappe.delete_doc("Project", name, force=True, ignore_permissions=True)

    @classmethod
    def _make_email_template(cls):
        for name, response in ((TEMPLATE_NAME, TEMPLATE_RESPONSE), (AMOUNT_TEMPLATE_NAME, AMOUNT_TEMPLATE_RESPONSE)):
            if frappe.db.exists("Email Template", name):
                frappe.delete_doc("Email Template", name, force=True, ignore_permissions=True)
            frappe.get_doc(
                {
                    "doctype": "Email Template",
                    "__newname": name,
                    "subject": "Threshold reached for {{ project.name }}",
                    "use_html": 1,
                    "response_html": response,
                }
            ).insert(ignore_permissions=True)

    @classmethod
    def _make_user(cls, email, with_pm_role):
        if not frappe.db.exists("User", email):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "first_name": email.split("@")[0],
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)
        user = frappe.get_doc("User", email)
        if with_pm_role:
            user.add_roles("Projects Manager")

    @classmethod
    def _make_project(cls, title, billing_type, template=TEMPLATE_NAME):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": title,
                "company": cls.company,
                "status": "Open",
                "custom_billing_type": billing_type,
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "custom_reminder_threshold_percentage": 80,
                "custom_email_template": template,
            }
        ).insert(ignore_permissions=True)
        return project.name

    @classmethod
    def _make_retainer_project(cls, title, hours_purchased, consumed_hours):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": title,
                "company": cls.company,
                "status": "Open",
                "custom_billing_type": "Retainer",
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "custom_reminder_threshold_percentage": 80,
                "custom_email_template": TEMPLATE_NAME,
                "custom_project_budget_hours": [
                    {
                        "start_date": "2026-01-01",
                        "end_date": "2026-12-31",
                        "hours_purchased": hours_purchased,
                    }
                ],
            }
        ).insert(ignore_permissions=True)
        frappe.db.set_value(
            "Project Budget",
            project.custom_project_budget_hours[0].name,
            {
                "hours_purchased": hours_purchased,
                "consumed_hours": consumed_hours,
                "remaining_hours": hours_purchased - consumed_hours,
            },
        )
        return project.name

    @classmethod
    def _share_project(cls, project, user):
        frappe.share.add_docshare("Project", project, user, read=1, flags={"ignore_share_permission": True})

    def setUp(self):
        self._clear_test_email_queue()

    def _clear_test_email_queue(self):
        queue_names = frappe.get_all(
            "Email Queue Recipient",
            filters={"recipient": ["in", [PM_USER, NON_PM_USER]]},
            pluck="parent",
        )
        if queue_names:
            frappe.db.delete("Email Queue Recipient", {"parent": ["in", queue_names]})
            frappe.db.delete("Email Queue", {"name": ["in", queue_names]})

    def _messages_for(self, recipient):
        queue_names = frappe.get_all("Email Queue Recipient", filters={"recipient": recipient}, pluck="parent")
        if not queue_names:
            return []
        return frappe.get_all("Email Queue", filters={"name": ["in", queue_names]}, pluck="message")

    def _error_log_count(self):
        return frappe.db.count("Error Log", {"method": "send_reminder_project_threshold_mail_failed"})

    def test_reminder_goes_to_project_managers_only(self):
        errors_before = self._error_log_count()

        send_reminder_mail()

        self.assertEqual(self._error_log_count(), errors_before)

        pm_messages = "\n".join(self._messages_for(PM_USER))
        self.assertIn(self.retainer_over, pm_messages)
        self.assertNotIn(self.retainer_under, pm_messages)
        self.assertNotIn(self.retainer_zero_hours, pm_messages)

        self.assertEqual(self._messages_for(NON_PM_USER), [])

    def test_template_renders_project_fields_and_budget_rows(self):
        send_reminder_mail()

        messages = [m for m in self._messages_for(PM_USER) if self.retainer_over in m]
        self.assertEqual(len(messages), 1)
        message = messages[0]

        self.assertIn(f"{PROJECT_PREFIX} Retainer Over", message)
        self.assertNotIn("None", message)
        for value in ("100.0", "90.0", "10.0"):
            self.assertIn(value, message)

    def test_time_and_material_project_sends_reminder(self):
        send_reminder_mail()

        pm_messages = "\n".join(self._messages_for(PM_USER))
        self.assertIn(self.tnm_over, pm_messages)

    def test_duplicate_shares_send_a_single_mail(self):
        self._share_project(self.retainer_over, PM_USER)

        send_reminder_mail()

        messages = [m for m in self._messages_for(PM_USER) if self.retainer_over in m]
        self.assertEqual(len(messages), 1)

    def test_failing_template_does_not_block_other_projects(self):
        errors_before = self._error_log_count()
        # An hours based template cannot render for a project that has no budget rows.
        broken = self._make_project(f"{PROJECT_PREFIX} Broken Template", "Time and Material", template=TEMPLATE_NAME)
        frappe.db.set_value("Project", broken, {"total_sales_amount": 1000, "total_billable_amount": 900})
        self._share_project(broken, PM_USER)

        try:
            send_reminder_mail()

            self.assertEqual(self._error_log_count(), errors_before + 1)
            pm_messages = "\n".join(self._messages_for(PM_USER))
            self.assertIn(self.retainer_over, pm_messages)
            self.assertIn(self.tnm_over, pm_messages)
            self.assertNotIn(broken, pm_messages)
        finally:
            frappe.delete_doc("Project", broken, force=True, ignore_permissions=True)

    def test_query_count_does_not_scale_with_project_count(self):
        baseline = self._count_queries()

        extra_projects = [
            self._make_retainer_project(f"{PROJECT_PREFIX} Extra {index}", hours_purchased=100, consumed_hours=90)
            for index in range(3)
        ]
        for name in extra_projects:
            self._share_project(name, PM_USER)

        try:
            scaled = self._count_queries()
        finally:
            for name in extra_projects:
                frappe.delete_doc("Project", name, force=True, ignore_permissions=True)

        self.assertEqual(baseline, scaled)

    def _count_queries(self):
        send_reminder_mail()  # warm caches so both measured runs start equal
        self._clear_test_email_queue()

        counter = {"queries": 0}
        original_sql = frappe.db.sql

        def counting_sql(*args, **kwargs):
            counter["queries"] += 1
            return original_sql(*args, **kwargs)

        with patch("frappe.sendmail"), patch.object(frappe.db, "sql", side_effect=counting_sql):
            send_reminder_mail()
        return counter["queries"]
