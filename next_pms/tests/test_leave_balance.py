"""`leave_balance` ("Leave Balance Before Application") stored server-side for every client."""

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
        # Other apps' hooks queue notification jobs for the test records
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
        # HRMS >= 16.5x resolves holidays through Holiday List Assignment
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
        """Insert like the add-leave forms do: no leave_balance sent."""
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
        # A save touching none of the balance fields keeps the snapshot (a recompute would say 8)
        first.description = "edited while open"
        first.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(first.name), 10)
        self.approve(first)
        self.assertEqual(self.stored_balance(first.name), 10)
        # A new application sees both deductions
        self.assertEqual(self.stored_balance(self.file_leave(start=30).name), 6)

    def test_draft_changed_and_submitted_in_one_request_recomputes(self):
        # submit() sets docstatus = 1 before the hook runs; the saved state is still a draft
        leave = self.file_leave()
        leave.leave_type = SMALL_LEAVE
        leave.status = "Approved"
        leave.submit()
        self.assertEqual(self.stored_balance(leave.name), 5)

    def test_client_sent_value_does_not_overwrite_the_snapshot(self):
        first = self.file_leave()
        self.approve(self.file_leave(start=20))
        # The Desk form recomputes the field on a half-day toggle and sends the new number
        first.half_day = 1
        first.half_day_date = first.from_date
        first.leave_balance = 8
        first.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(first.name), 10)

    def test_new_application_inserted_submitted_stores_balance(self):
        leave = self.file_leave(days=2, status="Approved", docstatus=1)
        self.assertEqual(leave.docstatus, 1)
        self.assertEqual(self.stored_balance(leave.name), 10)
        self.assertEqual(self.stored_balance(self.file_leave(start=20).name), 8)

    def test_lookup_failure_does_not_block_the_save(self):
        def fail_for_storing(*args, **kwargs):
            # HRMS's own validation calls this with for_consumption=True
            if kwargs.get("for_consumption"):
                return frappe._dict(leave_balance=10, leave_balance_for_consumption=10)
            # Like HRMS: message queued before the raise
            frappe.throw("lookup boom")

        with patch(
            "hrms.hr.doctype.leave_application.leave_application.get_leave_balance_on",
            side_effect=fail_for_storing,
        ):
            leave = self.file_leave()
        self.assertEqual(self.stored_balance(leave.name), 0)
        # The client must not be shown the lookup's message
        self.assertFalse([m for m in frappe.get_message_log() if "lookup boom" in str(m.get("message"))])
        # A stored 0 counts as missing: the next save while open fills it
        leave.description = "edited while open"
        leave.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(leave.name), 10)

    def test_zero_snapshot_is_not_filled_by_the_decision(self):
        def fail_for_storing(*args, **kwargs):
            if kwargs.get("for_consumption"):
                return frappe._dict(leave_balance=10, leave_balance_for_consumption=10)
            frappe.throw("lookup boom")

        with patch(
            "hrms.hr.doctype.leave_application.leave_application.get_leave_balance_on",
            side_effect=fail_for_storing,
        ):
            leave = self.file_leave()
        self.assertEqual(self.stored_balance(leave.name), 0)
        # The approver's save and submit keep the snapshot as it was, even an empty one
        self.approve(leave)
        self.assertEqual(self.stored_balance(leave.name), 0)

    def test_failed_recompute_after_a_change_does_not_keep_the_old_snapshot(self):
        leave = self.file_leave()
        self.assertEqual(self.stored_balance(leave.name), 10)

        def fail_for_storing(*args, **kwargs):
            if kwargs.get("for_consumption"):
                return frappe._dict(leave_balance=5, leave_balance_for_consumption=5)
            frappe.throw("lookup boom")

        with patch(
            "hrms.hr.doctype.leave_application.leave_application.get_leave_balance_on",
            side_effect=fail_for_storing,
        ):
            leave.leave_type = SMALL_LEAVE
            leave.save(ignore_permissions=True)
        # 10 belonged to the old leave type; the next save fills the right value
        self.assertEqual(self.stored_balance(leave.name), 0)
        leave.description = "edited while open"
        leave.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(leave.name), 5)

    def test_lookup_on_hrms_without_the_leave_application_argument(self):
        # HRMS before v16.20: get_leave_balance_on has no leave_application parameter
        def older_get_leave_balance_on(
            employee,
            leave_type,
            date,
            to_date=None,
            consider_all_leaves_in_the_allocation_period=False,
            for_consumption=False,
            **newer_controller_kwargs,
        ):
            if for_consumption:
                # The installed HRMS's own validation passes leave_application
                return frappe._dict(leave_balance=7, leave_balance_for_consumption=7)
            if newer_controller_kwargs:
                raise TypeError(f"unexpected keyword argument {next(iter(newer_controller_kwargs))!r}")
            return 3 if leave_type == SMALL_LEAVE else 7

        with patch(
            "hrms.hr.doctype.leave_application.leave_application.get_leave_balance_on",
            older_get_leave_balance_on,
        ):
            leave = self.file_leave()
            self.assertEqual(self.stored_balance(leave.name), 7)
            leave.leave_type = SMALL_LEAVE
            leave.save(ignore_permissions=True)
        self.assertEqual(self.stored_balance(leave.name), 3)

    def test_patch_fills_only_open_drafts(self):
        from next_pms.timesheet.patches.backfill_open_leave_balance import execute

        open_draft = self.file_leave()
        rejected_draft = self.file_leave(start=20)
        rejected_draft.status = "Rejected"
        rejected_draft.save(ignore_permissions=True)
        unpaid = self.file_leave(start=30, leave_type=UNPAID_LEAVE)
        for leave in (open_draft, rejected_draft, unpaid):
            frappe.db.set_value("Leave Application", leave.name, "leave_balance", 0)

        execute()

        self.assertEqual(self.stored_balance(open_draft.name), 10)
        self.assertEqual(self.stored_balance(rejected_draft.name), 0)
        self.assertEqual(self.stored_balance(unpaid.name), 0)
