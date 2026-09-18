import json
from urllib.parse import urlencode

import frappe
from erpnext import get_default_company
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, get_datetime

from next_pms.next_pms.notifications import send_review_reminders
from next_pms.tests.utils import make_employee

MANAGER_USER = "review-reminder-manager@example.com"
ACTIVE_USER = "review-reminder-active@example.com"
LEFT_USER = "review-reminder-left@example.com"
NOT_SUBMITTED_USER = "review-reminder-not-submitted@example.com"

TIMESHEET_DATE = "2026-10-05"


class TestSendReviewReminders(IntegrationTestCase):
    """Nightly review reminders must only cover timesheets a reviewer can actually see."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver="Administrator")
        cls.active_employee = make_employee(
            ACTIVE_USER,
            company=cls.company,
            reports_to=cls.manager,
            leave_approver="Administrator",
        )
        cls.left_employee = make_employee(
            LEFT_USER,
            company=cls.company,
            reports_to=cls.manager,
            leave_approver="Administrator",
        )
        cls.not_submitted_employee = make_employee(
            NOT_SUBMITTED_USER,
            company=cls.company,
            reports_to=cls.manager,
            leave_approver="Administrator",
        )

        cls.active_timesheet = cls._make_pending_timesheet(cls.active_employee, weekly_status="Approval Pending")
        cls.left_timesheet = cls._make_pending_timesheet(cls.left_employee, weekly_status="Approval Pending")
        cls.not_submitted_timesheet = cls._make_pending_timesheet(
            cls.not_submitted_employee, weekly_status="Not Submitted"
        )

        # Flip via db.set_value to skip HRMS relieving-date validation on save.
        frappe.db.set_value("Employee", cls.left_employee, "status", "Left")
        frappe.clear_cache()

    @classmethod
    def _make_pending_timesheet(cls, employee, weekly_status, date=TIMESHEET_DATE):
        from_time = get_datetime(date)
        timesheet = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": employee,
                "note": "",
                "time_logs": [
                    {
                        "description": "Review reminder test entry",
                        "from_time": from_time,
                        "to_time": add_to_date(from_time, hours=2),
                        "hours": 2,
                    }
                ],
            }
        )
        timesheet.flags.ignore_validate = True
        timesheet.insert(ignore_permissions=True)
        frappe.db.set_value(
            "Timesheet",
            timesheet.name,
            {
                "custom_approval_status": "Approval Pending",
                "custom_weekly_approval_status": weekly_status,
            },
        )
        return timesheet.name

    @classmethod
    def tearDownClass(cls):
        for name in (cls.active_timesheet, cls.left_timesheet, cls.not_submitted_timesheet):
            if name and frappe.db.exists("Timesheet", name):
                frappe.delete_doc("Timesheet", name, force=True, ignore_permissions=True, ignore_on_trash=True)
        super().tearDownClass()

    def _delete_manager_notifications(self):
        names = frappe.get_all("NextPMS Notifications", filters={"user": MANAGER_USER}, pluck="name")
        for name in names:
            frappe.delete_doc("NextPMS Notifications", name, force=True, ignore_permissions=True)

    def tearDown(self):
        self._delete_manager_notifications()
        super().tearDown()

    def test_skips_inactive_and_not_submitted_timesheets(self):
        self._delete_manager_notifications()

        send_review_reminders()
        # create_notification uses deferred_insert; flush so rows land in the DB.
        save_to_db()

        notifications = frappe.get_all(
            "NextPMS Notifications",
            filters={"user": MANAGER_USER, "title": "Timesheets to review"},
            fields=["label", "linked_document", "url"],
        )

        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].linked_document, self.active_timesheet)
        self.assertIn("1 timesheet to review", notifications[0].label)
        self.assertNotEqual(notifications[0].linked_document, self.left_timesheet)
        self.assertNotEqual(notifications[0].linked_document, self.not_submitted_timesheet)
        expected_query = urlencode(
            {
                "reportsTo": self.manager,
                "approval": "approval-pending,partially-approved,partially-rejected",
                "compositeFilters": json.dumps(
                    [
                        {
                            "id": "date",
                            "field": "date",
                            "operator": "between",
                            "value": [TIMESHEET_DATE, TIMESHEET_DATE],
                        }
                    ],
                    separators=(",", ":"),
                ),
            }
        )
        self.assertEqual(notifications[0].url, f"/next-pms/timesheet/team?{expected_query}")

    def test_label_pluralizes_for_multiple_timesheets(self):
        self._delete_manager_notifications()

        extra_timesheet = self._make_pending_timesheet(
            self.active_employee, weekly_status="Approval Pending", date="2026-10-12"
        )
        try:
            send_review_reminders()
            # create_notification uses deferred_insert; flush so rows land in the DB.
            save_to_db()

            notifications = frappe.get_all(
                "NextPMS Notifications",
                filters={"user": MANAGER_USER, "title": "Timesheets to review"},
                fields=["label"],
            )

            self.assertEqual(len(notifications), 1)
            self.assertIn("2 timesheets to review", notifications[0].label)
        finally:
            frappe.delete_doc("Timesheet", extra_timesheet, force=True, ignore_permissions=True, ignore_on_trash=True)
