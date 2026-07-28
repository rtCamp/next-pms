from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.tests.utils import make_employee
from next_pms.timesheet.tasks.daily_reminder_for_time_entry import get_employee_leaves, send_reminder

ON_LEAVE_USER = "daily-reminder-on-leave@example.com"
WORKING_USER = "daily-reminder-working@example.com"
TEMPLATE_NAME = "Daily Reminder Test Template"
DEPARTMENT_NAME = "Daily Reminder Test"


class TestDailyReminderForTimeEntry(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        cls.yesterday = add_days(getdate(), -1)
        cls.department = cls._make_department(company)
        cls.on_leave_employee = make_employee(
            ON_LEAVE_USER,
            company=company,
            department=cls.department,
            custom_working_hours=8,
            custom_work_schedule="Per Day",
        )
        cls.working_employee = make_employee(
            WORKING_USER,
            company=company,
            department=cls.department,
            custom_working_hours=8,
            custom_work_schedule="Per Day",
        )
        cls._make_leave_application(cls.on_leave_employee, cls.yesterday, company)
        cls._make_email_template()
        cls._configure_settings()
        cls.original_mute_emails = frappe.flags.mute_emails
        frappe.flags.mute_emails = True
        cls.enterClassContext(patch("frappe.utils.get_assets_json", return_value={}))

    @classmethod
    def tearDownClass(cls):
        frappe.flags.mute_emails = cls.original_mute_emails
        cls._restore_settings()
        super().tearDownClass()

    @classmethod
    def _make_department(cls, company):
        existing = frappe.db.exists("Department", {"department_name": DEPARTMENT_NAME, "company": company})
        if existing:
            return existing
        department = frappe.get_doc(
            {"doctype": "Department", "department_name": DEPARTMENT_NAME, "company": company}
        ).insert(ignore_permissions=True)
        return department.name

    @classmethod
    def _make_leave_application(cls, employee, date, company):
        if not frappe.db.exists("Leave Type", "Leave Without Pay"):
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": "Leave Without Pay", "is_lwp": 1}).insert(
                ignore_permissions=True
            )
        leave = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "company": company,
                "leave_type": "Leave Without Pay",
                "from_date": date,
                "to_date": date,
                "posting_date": date,
                "status": "Open",
            }
        )
        leave.flags.ignore_validate = True
        leave.insert(ignore_permissions=True, ignore_mandatory=True)

    @classmethod
    def _make_email_template(cls):
        if frappe.db.exists("Email Template", TEMPLATE_NAME):
            return
        frappe.get_doc(
            {
                "doctype": "Email Template",
                "__newname": TEMPLATE_NAME,
                "subject": "Timesheet reminder for {{ date }}",
                "use_html": 0,
                "response": "Please log your time for {{ date }}.",
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _configure_settings(cls):
        settings = frappe.get_doc("Timesheet Settings")
        cls.original_settings = {
            "send_daily_reminder": settings.send_daily_reminder,
            "daily_reminder_template": settings.daily_reminder_template,
            "allowed_departments": [{"department": row.department} for row in settings.allowed_departments],
        }
        settings.send_daily_reminder = 1
        settings.daily_reminder_template = TEMPLATE_NAME
        settings.set("allowed_departments", [{"department": cls.department}])
        settings.save(ignore_permissions=True)

    @classmethod
    def _restore_settings(cls):
        settings = frappe.get_doc("Timesheet Settings")
        settings.send_daily_reminder = cls.original_settings["send_daily_reminder"]
        settings.daily_reminder_template = cls.original_settings["daily_reminder_template"]
        settings.set("allowed_departments", cls.original_settings["allowed_departments"])
        settings.save(ignore_permissions=True)

    def _queued_recipients(self):
        return frappe.get_all(
            "Email Queue Recipient",
            filters={"recipient": ["in", [WORKING_USER, ON_LEAVE_USER]]},
            pluck="recipient",
        )

    def test_leaves_are_keyed_by_employee(self):
        leaves = get_employee_leaves([self.on_leave_employee], self.yesterday)
        self.assertNotIn(None, leaves)
        self.assertIn(self.on_leave_employee, leaves)

    def test_reminder_skips_employee_on_full_day_leave(self):
        self.assertEqual(self._queued_recipients(), [])

        send_reminder()

        recipients = self._queued_recipients()
        self.assertIn(WORKING_USER, recipients)
        self.assertNotIn(ON_LEAVE_USER, recipients)

        expected_subject = f"Timesheet reminder for {self.yesterday}"
        expected_body = f"Please log your time for {self.yesterday}."
        queue_name = frappe.db.get_value("Email Queue Recipient", {"recipient": WORKING_USER}, "parent")
        message = frappe.db.get_value("Email Queue", queue_name, "message")
        self.assertIn(expected_subject, message)
        self.assertIn(expected_body, message)
