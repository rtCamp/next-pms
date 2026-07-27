from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, add_to_date, get_datetime, getdate

from next_pms.tests.utils import make_employee, make_holiday_list
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.timesheet.tasks.daily_reminder_for_time_entry import get_employee_leaves, send_reminder
from next_pms.timesheet.utils.constant import EMP_WOKING_DETAILS

LEAVE_USER = "daily-reminder-leave@example.com"
HALF_DAY_USER = "daily-reminder-half-day@example.com"
WORKING_USER = "daily-reminder-working@example.com"
HOLIDAY_USER = "daily-reminder-holiday@example.com"

LEAVE_TYPE = "_Test Reminder Day Off"
EMAIL_TEMPLATE = "_Test Daily Reminder Template"
EMPTY_HOLIDAY_LIST = "_Test Reminder Holiday List"
DAY_OFF_HOLIDAY_LIST = "_Test Reminder Holiday List With Holiday"

WORKING_HOURS = 8


class TestDailyReminderForTimeEntry(IntegrationTestCase):
    """A day marked as day-off must not trigger yesterday's timesheet reminder."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.date = add_days(getdate(), -1)

        cls.leave_employee = cls._make_employee(LEAVE_USER)
        cls.half_day_employee = cls._make_employee(HALF_DAY_USER)
        cls.working_employee = cls._make_employee(WORKING_USER)
        cls.holiday_employee = cls._make_employee(HOLIDAY_USER)

        cls.empty_holiday_list = make_holiday_list(
            EMPTY_HOLIDAY_LIST, from_date=add_days(cls.date, -30), to_date=add_days(cls.date, 30)
        ).name
        cls.day_off_holiday_list = make_holiday_list(
            DAY_OFF_HOLIDAY_LIST,
            from_date=add_days(cls.date, -30),
            to_date=add_days(cls.date, 30),
            holiday_dates=[{"holiday_date": cls.date, "description": "Day off"}],
        ).name

        cls._make_leave_type()
        cls._make_email_template()
        cls._configure_timesheet_settings()

        cls.daily_norm = get_employee_daily_working_norm(cls.half_day_employee)

    @classmethod
    def _make_employee(cls, user):
        employee = make_employee(
            user,
            company=cls.company,
            custom_working_hours=WORKING_HOURS,
            custom_work_schedule="Per Day",
        )
        frappe.cache().hdel(EMP_WOKING_DETAILS, employee)
        return employee

    @classmethod
    def _make_leave_type(cls):
        if frappe.db.exists("Leave Type", LEAVE_TYPE):
            return
        frappe.get_doc(
            {
                "doctype": "Leave Type",
                "leave_type_name": LEAVE_TYPE,
                "is_lwp": 1,
                "include_holiday": 1,
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _make_email_template(cls):
        if frappe.db.exists("Email Template", EMAIL_TEMPLATE):
            return
        frappe.get_doc(
            {
                "doctype": "Email Template",
                "name": EMAIL_TEMPLATE,
                "subject": "Reminder to Complete Yesterday's Timesheet",
                "response": "Please complete your timesheet for {{ date }}.",
            }
        ).insert(ignore_permissions=True)

    @classmethod
    def _configure_timesheet_settings(cls):
        department = frappe.db.get_value("Employee", cls.working_employee, "department")
        settings = frappe.get_doc("Timesheet Settings")
        settings.send_daily_reminder = 1
        settings.daily_reminder_template = EMAIL_TEMPLATE
        settings.allowed_departments = []
        settings.append("allowed_departments", {"department": department})
        settings.save(ignore_permissions=True)

    def setUp(self):
        super().setUp()
        self.recipients = []

    def tearDown(self):
        for doctype in ("Leave Application", "Timesheet"):
            for name in frappe.get_all(
                doctype,
                filters={"employee": ["in", self._all_employees()]},
                pluck="name",
            ):
                frappe.delete_doc(doctype, name, force=True, ignore_permissions=True)
        super().tearDown()

    @classmethod
    def _all_employees(cls):
        return [cls.leave_employee, cls.half_day_employee, cls.working_employee, cls.holiday_employee]

    def _make_leave(self, employee, half_day=False):
        leave = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "leave_type": LEAVE_TYPE,
                "from_date": self.date,
                "to_date": self.date,
                "half_day": int(half_day),
                "half_day_date": self.date if half_day else None,
                "status": "Open",
                "company": self.company,
            }
        )
        leave.flags.ignore_validate = True
        leave.flags.ignore_mandatory = True
        leave.insert(ignore_permissions=True)
        return leave.name

    def _make_timesheet(self, employee, hours):
        from_time = get_datetime(self.date)
        timesheet = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": employee,
                "note": "",
                "time_logs": [
                    {
                        "description": "Daily reminder test entry",
                        "from_time": from_time,
                        "to_time": add_to_date(from_time, hours=hours),
                        "hours": hours,
                    }
                ],
            }
        )
        timesheet.flags.ignore_validate = True
        timesheet.insert(ignore_permissions=True)
        frappe.db.set_value(
            "Timesheet",
            timesheet.name,
            {"start_date": self.date, "end_date": self.date, "total_hours": hours},
        )
        return timesheet.name

    def _run_reminder(self, holiday_list=None):
        """Run the job with mail and batching stubbed out.

        Args:
            holiday_list: Holiday list the resolver should return for every employee.
                Defaults to a list with no holidays so the run does not depend on
                which weekday the suite happens to run on.

        Returns:
            The users the job would have mailed.
        """
        recipients = []
        module = "next_pms.timesheet.tasks.daily_reminder_for_time_entry"
        with (
            patch(f"{module}.send_mail", side_effect=lambda user, subject, message: recipients.append(user)),
            patch(f"{module}.get_holiday_list_for_employee", return_value=holiday_list or self.empty_holiday_list),
            patch("frappe.enqueue"),
        ):
            send_reminder()
        return recipients

    def test_leaves_are_keyed_by_employee(self):
        self._make_leave(self.leave_employee)

        leaves = get_employee_leaves([self.leave_employee], self.date)

        self.assertIn(self.leave_employee, leaves)
        self.assertEqual(len(leaves[self.leave_employee]), 1)

    def test_full_day_off_skips_reminder(self):
        self._make_leave(self.leave_employee)

        recipients = self._run_reminder()

        self.assertNotIn(LEAVE_USER, recipients)
        self.assertIn(WORKING_USER, recipients)

    def test_half_day_off_credits_leave_hours(self):
        self._make_leave(self.half_day_employee, half_day=True)
        self._make_timesheet(self.half_day_employee, self.daily_norm / 2)

        recipients = self._run_reminder()

        self.assertNotIn(HALF_DAY_USER, recipients)

    def test_half_day_off_without_logged_time_still_reminds(self):
        self._make_leave(self.half_day_employee, half_day=True)

        recipients = self._run_reminder()

        self.assertIn(HALF_DAY_USER, recipients)

    def test_holiday_uses_resolved_holiday_list(self):
        recipients = self._run_reminder(holiday_list=self.day_off_holiday_list)

        self.assertNotIn(WORKING_USER, recipients)

    def test_holiday_falls_back_to_employee_holiday_list(self):
        frappe.db.set_value("Employee", self.holiday_employee, "holiday_list", self.day_off_holiday_list)
        frappe.clear_cache(doctype="Employee")

        module = "next_pms.timesheet.tasks.daily_reminder_for_time_entry"
        recipients = []
        with (
            patch(f"{module}.send_mail", side_effect=lambda user, subject, message: recipients.append(user)),
            patch(f"{module}.get_holiday_list_for_employee", return_value=None),
            patch("frappe.enqueue"),
        ):
            send_reminder()

        self.assertNotIn(HOLIDAY_USER, recipients)
        self.assertIn(WORKING_USER, recipients)
