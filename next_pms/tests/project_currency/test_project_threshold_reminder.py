from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.project_currency.tasks.reminde_project_threshold import send_reminder_mail

PM_USER = "threshold-reminder-pm@example.com"
NON_PM_USER = "threshold-reminder-member@example.com"
TEMPLATE_NAME = "Project Threshold Reminder Test Template"
PROJECT_PREFIX = "Threshold Reminder Test"


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
        cls.tnm_over = cls._make_project(f"{PROJECT_PREFIX} TnM Over", "Time and Material")
        frappe.db.set_value("Project", cls.tnm_over, {"estimated_costing": 1000, "total_billable_amount": 900})

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
        if frappe.db.exists("Email Template", TEMPLATE_NAME):
            return
        frappe.get_doc(
            {
                "doctype": "Email Template",
                "__newname": TEMPLATE_NAME,
                "subject": "Threshold reached for {{ project.name }}",
                "use_html": 0,
                "response": "Project {{ project.name }} - {{ project.project_name }} crossed the threshold.",
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
    def _make_project(cls, title, billing_type):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": title,
                "company": cls.company,
                "status": "Open",
                "custom_billing_type": billing_type,
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "custom_reminder_threshold_percentage": 80,
                "custom_email_template": TEMPLATE_NAME,
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
        budget_row = project.custom_project_budget_hours[0]
        frappe.db.set_value(
            "Project Budget",
            budget_row.name,
            {"hours_purchased": hours_purchased, "consumed_hours": consumed_hours},
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

    def _queued_subjects_for(self, recipient):
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

        pm_messages = "\n".join(self._queued_subjects_for(PM_USER))
        self.assertIn(self.retainer_over, pm_messages)
        self.assertNotIn(self.retainer_under, pm_messages)
        self.assertNotIn(self.retainer_zero_hours, pm_messages)

        self.assertEqual(self._queued_subjects_for(NON_PM_USER), [])

    def test_time_and_material_project_sends_reminder(self):
        send_reminder_mail()

        pm_messages = "\n".join(self._queued_subjects_for(PM_USER))
        self.assertIn(self.tnm_over, pm_messages)

    def test_query_count_does_not_scale_with_project_count(self):
        baseline = self._count_queries()

        extra_projects = [
            self._make_retainer_project(f"{PROJECT_PREFIX} Extra {index}", hours_purchased=100, consumed_hours=10)
            for index in range(3)
        ]
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

        with patch.object(frappe.db, "sql", side_effect=counting_sql):
            send_reminder_mail()
        return counter["queries"]
