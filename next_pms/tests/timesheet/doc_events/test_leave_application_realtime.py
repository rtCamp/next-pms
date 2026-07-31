from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import getdate

from next_pms.resource_management.api.utils.query import get_employee_leaves

EMPLOYEE_USER = "leave-realtime-test@example.com"
LEAVE_TYPE = "Leave Realtime Test LWP"

PUBLISH_TARGET = "next_pms.timesheet.doc_events.timesheet.publish_timesheet_update"

# All dates below are in 2026 with first_day_of_the_week forced to Monday, so
# every expected week start is a known Monday.
WED_OCT_7, THU_OCT_8, MON_OCT_5 = "2026-10-07", "2026-10-08", "2026-10-05"
WED_OCT_14, MON_OCT_12 = "2026-10-14", "2026-10-12"
SAT_OCT_24, MON_OCT_26, MON_OCT_19 = "2026-10-24", "2026-10-26", "2026-10-19"
WED_NOV_4, TUE_NOV_17 = "2026-11-04", "2026-11-17"
NOV_WEEK_STARTS = ["2026-11-02", "2026-11-09", "2026-11-16"]
WED_DEC_2, THU_DEC_3, MON_NOV_30 = "2026-12-02", "2026-12-03", "2026-11-30"
WED_DEC_9, MON_DEC_7 = "2026-12-09", "2026-12-07"


class LeaveRealtimeTestCase(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._prev_first_day_of_the_week = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")

        from next_pms.tests.utils import make_employee

        cls.employee = make_employee(EMPLOYEE_USER, company=get_default_company(), leave_approver="Administrator")

        if not frappe.db.exists("Leave Type", LEAVE_TYPE):
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": LEAVE_TYPE, "is_lwp": 1}).insert()

        # A previous aborted run can leave applications behind and trip the overlap check.
        for leave in frappe.get_all("Leave Application", filters={"employee": cls.employee}, pluck="name"):
            frappe.delete_doc("Leave Application", leave, force=1, ignore_permissions=True)

    @classmethod
    def tearDownClass(cls):
        frappe.db.set_default("first_day_of_the_week", cls._prev_first_day_of_the_week)
        super().tearDownClass()

    def tearDown(self):
        get_employee_leaves.clear_cache()
        frappe.cache().delete_keys("emp_timesheet")

    def _make_leave(self, from_date, to_date):
        return frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": self.employee,
                "leave_type": LEAVE_TYPE,
                "from_date": from_date,
                "to_date": to_date,
                "description": "realtime publish test",
                "leave_approver": "Administrator",
                "status": "Open",
            }
        ).insert()


class TestLeaveRealtimeTrigger(LeaveRealtimeTestCase):
    """Leave Application doc events publish a timesheet update for every week the leave touches."""

    def _published_weeks(self, mock_publish):
        return sorted({call.args for call in mock_publish.call_args_list})

    def test_create_publishes_the_leaves_week(self):
        with patch(PUBLISH_TARGET) as mock_publish:
            self._make_leave(WED_OCT_7, THU_OCT_8)

        self.assertEqual(self._published_weeks(mock_publish), [(self.employee, getdate(MON_OCT_5))])

    def test_multi_week_leave_publishes_every_week(self):
        with patch(PUBLISH_TARGET) as mock_publish:
            self._make_leave(WED_NOV_4, TUE_NOV_17)

        expected = [(self.employee, getdate(week_start)) for week_start in NOV_WEEK_STARTS]
        self.assertEqual(self._published_weeks(mock_publish), expected)

    def test_leave_crossing_week_boundary_publishes_both_weeks(self):
        """A 7-day stride from a late-week start date skips past the final week.

        Saturday to Monday spans two weeks, but sampling every 7 days from the
        Saturday never lands inside the second one; the publisher must still
        cover the week containing to_date.
        """
        with patch(PUBLISH_TARGET) as mock_publish:
            self._make_leave(SAT_OCT_24, MON_OCT_26)

        expected = [(self.employee, getdate(MON_OCT_19)), (self.employee, getdate(MON_OCT_26))]
        self.assertEqual(self._published_weeks(mock_publish), expected)

    def test_cancel_publishes(self):
        leave = self._make_leave(WED_DEC_2, THU_DEC_3)
        leave.status = "Approved"
        leave.submit()

        with patch(PUBLISH_TARGET) as mock_publish:
            leave.cancel()

        self.assertEqual(self._published_weeks(mock_publish), [(self.employee, getdate(MON_NOV_30))])

    def test_delete_publishes(self):
        leave = self._make_leave(WED_DEC_9, WED_DEC_9)

        with patch(PUBLISH_TARGET) as mock_publish:
            leave.delete()

        self.assertEqual(self._published_weeks(mock_publish), [(self.employee, getdate(MON_DEC_7))])


class TestLeaveRealtimePayload(LeaveRealtimeTestCase):
    """The pushed snapshot is recomputed after the cache flush, so it reflects the change."""

    def _timesheet_update_payloads(self, mock_publish):
        event = f"timesheet_update::{self.employee}"
        return [call.args[1]["message"] for call in mock_publish.call_args_list if call.args[0] == event]

    def test_created_leave_is_in_the_pushed_snapshot(self):
        get_employee_leaves(self.employee, MON_OCT_12, WED_OCT_14)  # warm the cache the flush must clear

        with patch("frappe.publish_realtime") as mock_publish:
            leave = self._make_leave(WED_OCT_14, WED_OCT_14)

        payloads = self._timesheet_update_payloads(mock_publish)
        self.assertTrue(payloads)
        for payload in payloads:
            self.assertIn(leave.name, [row["name"] for row in payload["leaves"]])

        team_events = [call.args[0] for call in mock_publish.call_args_list]
        self.assertIn("timesheet_info", team_events)

    def test_cancelled_leave_is_dropped_from_the_pushed_snapshot(self):
        leave = self._make_leave(WED_OCT_7, THU_OCT_8)
        leave.status = "Approved"
        leave.submit()

        with patch("frappe.publish_realtime") as mock_publish:
            leave.cancel()

        payloads = self._timesheet_update_payloads(mock_publish)
        self.assertTrue(payloads)
        for payload in payloads:
            self.assertNotIn(leave.name, [row["name"] for row in payload["leaves"]])
