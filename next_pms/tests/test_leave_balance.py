"""`leave_balance` ("Leave Balance Before Application") stored server-side for every client.

HRMS only sets the field from the Desk form and the mobile app; a Leave Application created
through the API, as the add-leave forms do, carried 0, and so did the HR emails built from it.
"""

from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, today

from next_pms.tests.utils import make_employee

EMPLOYEE_USER = "leave-balance-employee@example.com"
PAID_LEAVE = "Leave Balance Test Leave"
SMALL_LEAVE = "Leave Balance Test Leave Small"
UNPAID_LEAVE = "Leave Balance Test LWP"
HOLIDAY_LIST = "Leave Balance Test Holiday List"


class TestLeaveBalanceBeforeApplication(IntegrationTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        # Other apps' hooks on Leave Application queue notification jobs about the test records
        enqueue = patch("frappe.enqueue")
        enqueue.start()
        self.addCleanup(enqueue.stop)

        self.period_start = add_days(today(), -30)
        self.period_end = add_days(today(), 335)
        self.make_holiday_list()
        self.make_leave_type(PAID_LEAVE)
        self.make_leave_type(SMALL_LEAVE)
        self.make_leave_type(UNPAID_LEAVE, is_lwp=1)
        self.employee = make_employee(
            EMPLOYEE_USER, company=get_default_company(), holiday_list=HOLIDAY_LIST, leave_approver="Administrator"
        )
        self.assign_holiday_list()
        self.allocate(PAID_LEAVE, 10)
        self.allocate(SMALL_LEAVE, 5)

    def tearDown(self):
        frappe.db.rollback()

    def make_holiday_list(self):
        if frappe.db.exists("Holiday List", HOLIDAY_LIST):
            return
        frappe.get_doc(
            {
                "doctype": "Holiday List",
                "holiday_list_name": HOLIDAY_LIST,
                "from_date": self.period_start,
                "to_date": self.period_end,
            }
        ).insert(ignore_permissions=True)

    def assign_holiday_list(self):
        # HRMS >= 16.5x resolves an employee's holidays through Holiday List Assignment
        if frappe.db.exists("Holiday List Assignment", {"assigned_to": self.employee, "docstatus": 1}):
            return
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "holiday_list": HOLIDAY_LIST,
                "applicable_for": "Employee",
                "assigned_to": self.employee,
                "from_date": self.period_start,
            }
        ).insert(ignore_permissions=True).submit()

    def make_leave_type(self, name, **fields):
        if frappe.db.exists("Leave Type", name):
            return
        frappe.get_doc({"doctype": "Leave Type", "leave_type_name": name, "max_leaves_allowed": 30, **fields}).insert(
            ignore_permissions=True
        )

    def allocate(self, leave_type, days):
        allocation = frappe.get_doc(
            {
                "doctype": "Leave Allocation",
                "employee": self.employee,
                "leave_type": leave_type,
                "from_date": self.period_start,
                "to_date": self.period_end,
                "new_leaves_allocated": days,
            }
        ).insert(ignore_permissions=True)
        allocation.submit()
        return allocation

    def file_leave(self, leave_type=PAID_LEAVE, start=10, days=2, **fields):
        """Insert a Leave Application the way the add-leave forms do: no leave_balance sent."""
        return frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": self.employee,
                "leave_type": leave_type,
                "from_date": add_days(today(), start),
                "to_date": add_days(today(), start + days - 1),
                "leave_approver": "Administrator",
                "status": "Open",
                "description": "balance test",
                **fields,
            }
        ).insert(ignore_permissions=True)

    def stored_balance(self, name):
        return frappe.db.get_value("Leave Application", name, "leave_balance")

    def approve(self, leave):
        leave.status = "Approved"
        leave.save(ignore_permissions=True)
        leave.submit()

    def test_api_created_leave_stores_balance(self):
        leave = self.file_leave()
        self.assertEqual(self.stored_balance(leave.name), 10)

    def test_unpaid_leave_stores_zero(self):
        # Even when a client sends a value
        leave = self.file_leave(leave_type=UNPAID_LEAVE, leave_balance=5)
        self.assertEqual(self.stored_balance(leave.name), 0)

    def test_draft_recomputes_when_leave_type_changes(self):
        leave = self.file_leave()
        leave.leave_type = SMALL_LEAVE
        leave.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(leave.name), 5)

    def test_approval_keeps_the_balance_at_application_time(self):
        first = self.file_leave(days=2)
        second = self.file_leave(start=20, days=2)
        self.assertEqual(self.stored_balance(second.name), 10)
        # The ledger moves while `first` is still open
        self.approve(second)
        # A save that touches none of the balance fields keeps the snapshot (a recompute would say 8)
        first.description = "edited while open"
        first.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(first.name), 10)
        self.approve(first)
        self.assertEqual(self.stored_balance(first.name), 10)
        # A new application sees both deductions
        self.assertEqual(self.stored_balance(self.file_leave(start=30).name), 6)

    def test_new_application_inserted_submitted_stores_balance(self):
        leave = self.file_leave(days=2, status="Approved", docstatus=1)
        self.assertEqual(leave.docstatus, 1)
        self.assertEqual(self.stored_balance(leave.name), 10)
        self.assertEqual(self.stored_balance(self.file_leave(start=20).name), 8)

    def test_lookup_failure_does_not_block_the_save(self):
        def fail_for_storing(*args, **kwargs):
            # HRMS's own balance validation calls the same function with for_consumption=True
            if kwargs.get("for_consumption"):
                return frappe._dict(leave_balance=10, leave_balance_for_consumption=10)
            # The way HRMS fails, e.g. validate_leave_access: the message is queued before the raise
            frappe.throw("lookup boom")

        with patch(
            "hrms.hr.doctype.leave_application.leave_application.get_leave_balance_on",
            side_effect=fail_for_storing,
        ):
            leave = self.file_leave()
        self.assertEqual(self.stored_balance(leave.name), 0)
        # The save went through, so the client must not be shown the lookup's message
        self.assertFalse([m for m in frappe.get_message_log() if "lookup boom" in str(m.get("message"))])
