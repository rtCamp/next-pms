# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import unittest
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, formatdate, getdate, today

from next_pms.api.dashboard import approve_leave_application, reject_leave_application
from next_pms.next_pms.notifications import MANAGER_DASHBOARD_URL
from next_pms.tests.utils import assign_empty_holiday_list, make_employee

MANAGER_USER = "leave-notify-manager@example.com"
APPROVER_USER = "leave-notify-approver@example.com"
NOTIFIED_USER = "leave-notify-notified@example.com"
TRAY_ONLY_USER = "leave-notify-tray-only@example.com"
NO_TRAY_ROLE_USER = "leave-notify-no-tray-role@example.com"
TIMESHEET_MANAGER_USER = "leave-notify-timesheet-manager@example.com"
DISABLED_USER = "leave-notify-disabled@example.com"

ALL_USERS = (
    MANAGER_USER,
    APPROVER_USER,
    NOTIFIED_USER,
    TRAY_ONLY_USER,
    NO_TRAY_ROLE_USER,
    TIMESHEET_MANAGER_USER,
    DISABLED_USER,
)

LEAVE_TYPE = "Leave Notification Test LWP"
NOTIFICATION_TITLE = "Leave request"

PUBLISH_REALTIME = "next_pms.next_pms.notifications.frappe.publish_realtime"

ROLES_BY_USER = {
    MANAGER_USER: ("Projects Manager", "Leave Approver"),
    APPROVER_USER: ("Projects User",),
    NOTIFIED_USER: ("Delivery Manager",),
    TRAY_ONLY_USER: ("Delivery User",),
    NO_TRAY_ROLE_USER: ("Leave Approver",),
    TIMESHEET_MANAGER_USER: ("Timesheet Manager",),
    DISABLED_USER: ("Projects User",),
}


class LeaveNotificationTestCase(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        if not frappe.get_meta("Leave Application").has_field("custom_notify_users"):
            raise unittest.SkipTest("rtcamp app's Notify Users field is not installed")
        super().setUpClass()

        from erpnext import get_default_company

        cls.company = get_default_company()
        cls.manager = make_employee(MANAGER_USER, company=cls.company, leave_approver=MANAGER_USER)
        for user in ALL_USERS:
            if not frappe.db.exists("User", user):
                frappe.get_doc(
                    {
                        "doctype": "User",
                        "email": user,
                        "first_name": user,
                        "send_welcome_email": 0,
                    }
                ).insert(ignore_permissions=True)
        for user in ALL_USERS:
            if user != MANAGER_USER:
                make_employee(user, company=cls.company)

        for user, roles in ROLES_BY_USER.items():
            frappe.get_doc("User", user).add_roles(*roles)

        frappe.db.set_value("User", DISABLED_USER, "enabled", 0)

        if not frappe.db.exists("Leave Type", LEAVE_TYPE):
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": LEAVE_TYPE, "is_lwp": 1}).insert()

        frappe.clear_cache()

    def tearDown(self):
        for name in frappe.get_all("NextPMS Notifications", filters={"user": ["in", list(ALL_USERS)]}, pluck="name"):
            frappe.delete_doc("NextPMS Notifications", name, force=True, ignore_permissions=True)
        frappe.set_user("Administrator")
        super().tearDown()

    def _requester_user(self, tag):
        return f"leave-notify-requester-{tag}@example.com"

    def _apply_for_leave(self, tag, leave_approver=APPROVER_USER, reports_to=True, actor=None, **leave_fields):
        """Apply for leave as a fresh employee and return the resulting draft Leave Application.

        `Leave Application.leave_approver` is fetched from `Employee.leave_approver`, so the
        approver a test needs has to be set on the employee record. A fresh employee per call
        also keeps HRMS's overlap check out of the way.
        """
        requester = self._requester_user(tag)
        employee = make_employee(
            requester,
            company=self.company,
            leave_approver=leave_approver,
            reports_to=self.manager if reports_to else None,
        )
        assign_empty_holiday_list(employee)
        frappe.set_user(actor or requester)

        leave = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "leave_type": LEAVE_TYPE,
                "from_date": add_days(today(), 30),
                "to_date": add_days(today(), 32),
                "description": "Family function",
                "status": "Open",
                **leave_fields,
            }
        )
        leave.flags.ignore_validate = True
        leave.insert(ignore_permissions=True)
        return leave

    def _notifications(self, user):
        return frappe.get_all(
            "NextPMS Notifications",
            filters={"user": user, "title": NOTIFICATION_TITLE},
            fields=["name", "label", "url", "linked_doctype", "linked_document", "viewed"],
            order_by="creation desc",
        )

    def _recipients(self, leave):
        return set(
            frappe.get_all(
                "NextPMS Notifications",
                filters={
                    "title": NOTIFICATION_TITLE,
                    "linked_doctype": "Leave Application",
                    "linked_document": leave.name,
                },
                pluck="user",
            )
        )

    def _unviewed(self, leave):
        return set(
            frappe.get_all(
                "NextPMS Notifications",
                filters={
                    "title": NOTIFICATION_TITLE,
                    "linked_doctype": "Leave Application",
                    "linked_document": leave.name,
                    "viewed": 0,
                },
                pluck="user",
            )
        )


class TestLeaveApplicationNotifications(LeaveNotificationTestCase):
    """A new leave request notifies everyone who can action or follow it, exactly once."""

    def test_approver_reporting_manager_and_notified_user_each_get_one_notification(self):
        leave = self._apply_for_leave("all-sources", custom_notify_users=[{"user": NOTIFIED_USER}])

        self.assertEqual(self._recipients(leave), {APPROVER_USER, MANAGER_USER, NOTIFIED_USER})
        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)
        self.assertEqual(len(self._notifications(APPROVER_USER)), 1)
        self.assertEqual(len(self._notifications(NOTIFIED_USER)), 1)

    def test_approver_who_is_also_the_reporting_manager_gets_one_notification(self):
        leave = self._apply_for_leave("approver-is-manager", leave_approver=MANAGER_USER)

        self.assertEqual(self._recipients(leave), {MANAGER_USER})
        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)

    def test_approver_who_is_manager_and_notified_user_gets_one_notification(self):
        leave = self._apply_for_leave(
            "approver-is-manager-and-notified",
            leave_approver=MANAGER_USER,
            custom_notify_users=[{"user": MANAGER_USER}],
        )

        self.assertEqual(self._recipients(leave), {MANAGER_USER})
        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)

    def test_actor_is_not_notified(self):
        requester = self._requester_user("self-approver")
        leave = self._apply_for_leave("self-approver", leave_approver=requester)

        self.assertEqual(self._recipients(leave), {MANAGER_USER})
        self.assertEqual(self._notifications(requester), [])

    def test_reporting_manager_who_is_the_actor_is_not_notified(self):
        leave = self._apply_for_leave(
            "manager-applies",
            leave_approver=MANAGER_USER,
            actor=MANAGER_USER,
            custom_notify_users=[{"user": NOTIFIED_USER}],
        )

        self.assertEqual(self._recipients(leave), {NOTIFIED_USER})

    def test_users_without_a_notification_tray_role_are_skipped(self):
        leave = self._apply_for_leave(
            "no-tray-role",
            leave_approver=NO_TRAY_ROLE_USER,
            custom_notify_users=[{"user": TIMESHEET_MANAGER_USER}],
        )

        self.assertEqual(self._recipients(leave), {MANAGER_USER})
        self.assertEqual(self._notifications(NO_TRAY_ROLE_USER), [])
        self.assertEqual(self._notifications(TIMESHEET_MANAGER_USER), [])

    def test_disabled_user_is_skipped(self):
        leave = self._apply_for_leave("disabled-approver", leave_approver=DISABLED_USER)

        self.assertEqual(self._recipients(leave), {MANAGER_USER})
        self.assertEqual(self._notifications(DISABLED_USER), [])

    def test_notified_user_is_notified_without_an_approver_or_a_manager(self):
        leave = self._apply_for_leave(
            "notify-only", leave_approver=None, reports_to=False, custom_notify_users=[{"user": NOTIFIED_USER}]
        )

        self.assertEqual(self._recipients(leave), {NOTIFIED_USER})

    def test_url_points_at_the_manager_dashboard(self):
        self._apply_for_leave("dashboard-url", custom_notify_users=[{"user": NOTIFIED_USER}])

        for user in (APPROVER_USER, MANAGER_USER, NOTIFIED_USER):
            self.assertEqual(self._notifications(user)[0]["url"], MANAGER_DASHBOARD_URL)

    def test_url_falls_back_to_the_desk_form_without_dashboard_access(self):
        leave = self._apply_for_leave("tray-only-approver", leave_approver=TRAY_ONLY_USER)

        self.assertEqual(self._recipients(leave), {TRAY_ONLY_USER, MANAGER_USER})
        self.assertIsNone(self._notifications(TRAY_ONLY_USER)[0]["url"])
        self.assertEqual(self._notifications(MANAGER_USER)[0]["url"], MANAGER_DASHBOARD_URL)

    def test_notification_describes_the_requester_and_the_leave_dates(self):
        from_date, to_date = add_days(today(), 40), add_days(today(), 42)
        leave = self._apply_for_leave("label", from_date=from_date, to_date=to_date)

        notification = self._notifications(MANAGER_USER)[0]
        self.assertEqual(notification["linked_doctype"], "Leave Application")
        self.assertEqual(notification["linked_document"], leave.name)
        self.assertIn(leave.employee_name, notification["label"])
        self.assertIn(formatdate(getdate(from_date), "dd/mm/yyyy"), notification["label"])
        self.assertIn(formatdate(getdate(to_date), "dd/mm/yyyy"), notification["label"])

    def test_leave_that_is_not_open_does_not_notify(self):
        leave = self._apply_for_leave("already-approved", status="Approved")

        self.assertEqual(self._recipients(leave), set())
        self.assertEqual(self._notifications(MANAGER_USER), [])

    def test_updating_an_open_leave_does_not_notify_again(self):
        leave = self._apply_for_leave("re-save")
        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)

        frappe.set_user(MANAGER_USER)
        frappe.get_doc("Leave Application", leave.name).save(ignore_permissions=True)

        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)


class TestLeaveApplicationNotificationResolved(LeaveNotificationTestCase):
    """A leave request stops being offered in the tray once it is actioned."""

    def _open_leave(self):
        return self._apply_for_leave(
            f"resolved-{self.id().split('.')[-1]}",
            leave_approver=MANAGER_USER,
            custom_notify_users=[{"user": NOTIFIED_USER}],
        )

    def _assert_resolved(self, leave):
        self.assertEqual(self._unviewed(leave), set())
        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)
        self.assertEqual(len(self._notifications(NOTIFIED_USER)), 1)
        for notification in self._notifications(MANAGER_USER) + self._notifications(NOTIFIED_USER):
            self.assertTrue(notification["viewed"])

    def test_approving_marks_the_notification_viewed(self):
        leave = self._open_leave()

        frappe.set_user(MANAGER_USER)
        approve_leave_application(leave.name)

        self.assertEqual(frappe.db.get_value("Leave Application", leave.name, "docstatus"), 1)
        self._assert_resolved(leave)

    def test_rejecting_marks_the_notification_viewed(self):
        leave = self._open_leave()

        frappe.set_user(MANAGER_USER)
        reject_leave_application(leave.name, "Team capacity")

        self.assertEqual(frappe.db.get_value("Leave Application", leave.name, "status"), "Rejected")
        self._assert_resolved(leave)

    def test_rejecting_without_a_reason_is_refused(self):
        leave = self._open_leave()

        frappe.set_user(MANAGER_USER)
        with self.assertRaisesRegex(frappe.ValidationError, "Rejection reason is required"):
            reject_leave_application(leave.name, "  ")

        self.assertEqual(self._unviewed(leave), {MANAGER_USER, NOTIFIED_USER})
        self.assertEqual(frappe.db.get_value("Leave Application", leave.name, "status"), "Open")

    def test_cancelling_marks_the_notification_viewed(self):
        leave = self._open_leave()
        frappe.set_user(MANAGER_USER)
        approve_leave_application(leave.name)

        frappe.set_user("Administrator")
        frappe.get_doc("Leave Application", leave.name).cancel()

        self._assert_resolved(leave)

    def test_deleting_marks_the_notification_viewed(self):
        leave = self._open_leave()

        frappe.delete_doc("Leave Application", leave.name, force=True, ignore_permissions=True)

        self.assertEqual(len(self._notifications(MANAGER_USER)), 1)
        self.assertEqual(len(self._notifications(NOTIFIED_USER)), 1)
        for notification in self._notifications(MANAGER_USER) + self._notifications(NOTIFIED_USER):
            self.assertTrue(notification["viewed"])

    def test_resolving_publishes_a_realtime_refresh_to_every_recipient(self):
        leave = self._open_leave()

        with patch(PUBLISH_REALTIME) as publish_realtime:
            frappe.set_user(MANAGER_USER)
            approve_leave_application(leave.name)

        refreshes = [call for call in publish_realtime.call_args_list if call.kwargs.get("event") == "notification"]
        self.assertEqual(len(refreshes), 2)
        self.assertEqual({call.kwargs.get("user") for call in refreshes}, {MANAGER_USER, NOTIFIED_USER})
