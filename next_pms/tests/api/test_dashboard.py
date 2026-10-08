# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import unittest

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, today

from next_pms.api.dashboard import (
    _get_employees_on_leave,
    approve_leave_application,
    get_employees_on_leave,
    reject_leave_application,
)
from next_pms.tests.utils import make_employee

MANAGER_USER = "leave-widget-manager@example.com"
REQUESTER_USER = "leave-widget-requester@example.com"
NOTIFIED_USER = "leave-widget-notified@example.com"
OUTSIDER_USER = "leave-widget-outsider@example.com"
LEAVE_TYPE = "Leave Widget Test LWP"


class TestEmployeesOnLeaveNotifyUsers(IntegrationTestCase):
    """Notified users see a leave in the Upcoming Time Off widget but cannot action it."""

    @classmethod
    def setUpClass(cls):
        if not frappe.get_meta("Leave Application").has_field("custom_notify_users"):
            raise unittest.SkipTest("rtcamp app's Notify Users field is not installed")
        super().setUpClass()

        cls.manager = make_employee(MANAGER_USER, leave_approver="Administrator")
        cls.requester = make_employee(REQUESTER_USER, leave_approver="Administrator", reports_to=cls.manager)
        make_employee(NOTIFIED_USER, leave_approver="Administrator")
        make_employee(OUTSIDER_USER, leave_approver="Administrator")
        for user in (MANAGER_USER, NOTIFIED_USER, OUTSIDER_USER):
            frappe.get_doc("User", user).add_roles("Projects User")

        if not frappe.db.exists("Leave Type", LEAVE_TYPE):
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": LEAVE_TYPE, "is_lwp": 1}).insert()

        for leave in frappe.get_all("Leave Application", filters={"employee": cls.requester}, pluck="name"):
            frappe.delete_doc("Leave Application", leave, force=1, ignore_permissions=True)

        cls.open_leave = cls._make_leave(add_days(today(), 20), "Open", 0, [NOTIFIED_USER, MANAGER_USER])
        cls.approved_leave = cls._make_leave(add_days(today(), 10), "Approved", 1, [NOTIFIED_USER])
        cls.rejected_leave = cls._make_leave(add_days(today(), 30), "Rejected", 1, [NOTIFIED_USER])
        cls.past_leave = cls._make_leave(add_days(today(), -10), "Open", 0, [NOTIFIED_USER])

    @classmethod
    def _make_leave(cls, date, status, docstatus, notify_users):
        leave = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": cls.requester,
                "leave_type": LEAVE_TYPE,
                "from_date": date,
                "to_date": date,
                "description": "Family function",
                "leave_approver": "Administrator",
                "status": "Open",
                "custom_notify_users": [{"user": user} for user in notify_users],
            }
        )
        leave.flags.ignore_validate = True
        leave.insert(ignore_permissions=True)
        frappe.db.set_value("Leave Application", leave.name, {"status": status, "docstatus": docstatus})
        return leave.name

    def setUp(self):
        _get_employees_on_leave.clear_cache()

    def tearDown(self):
        frappe.set_user("Administrator")

    def _visible_leaves(self, user):
        frappe.set_user(user)
        return {row.name: row for row in get_employees_on_leave()}

    def test_notified_user_sees_upcoming_open_and_approved_leaves(self):
        leaves = self._visible_leaves(NOTIFIED_USER)

        self.assertIn(self.open_leave, leaves)
        self.assertIn(self.approved_leave, leaves)
        self.assertNotIn(self.rejected_leave, leaves)
        self.assertNotIn(self.past_leave, leaves)

    def test_notified_user_rows_are_read_only_without_description(self):
        leaves = self._visible_leaves(NOTIFIED_USER)

        for name in (self.open_leave, self.approved_leave):
            self.assertFalse(leaves[name].can_approve)
            self.assertIsNone(leaves[name].description)

    def test_reporting_manager_rows_are_actionable(self):
        leaves = self._visible_leaves(MANAGER_USER)

        self.assertTrue(leaves[self.open_leave].can_approve)
        self.assertEqual(leaves[self.open_leave].description, "Family function")

    def test_manager_who_is_also_notified_gets_one_row(self):
        frappe.set_user(MANAGER_USER)
        names = [row.name for row in get_employees_on_leave()]

        self.assertEqual(names.count(self.open_leave), 1)

    def test_unrelated_user_sees_nothing(self):
        leaves = self._visible_leaves(OUTSIDER_USER)

        self.assertNotIn(self.open_leave, leaves)
        self.assertNotIn(self.approved_leave, leaves)

    def test_notified_user_cannot_approve_or_reject(self):
        frappe.set_user(NOTIFIED_USER)

        for action, args in (
            (approve_leave_application, (self.open_leave,)),
            (reject_leave_application, (self.open_leave, "Not allowed")),
        ):
            with self.subTest(action=action.__name__):
                with self.assertRaisesRegex(frappe.PermissionError, "Only the reporting manager"):
                    action(*args)

        self.assertEqual(frappe.db.get_value("Leave Application", self.open_leave, "status"), "Open")
