import frappe
from frappe.utils import flt, getdate

from next_pms.tests.project_currency.overrides.fixtures import (
    DATE,
    HOURLY_COST_USD,
    NEXT_WEEK,
    USD_CUSTOMER,
    WEEK_AFTER_NEXT,
    OverrideTestCase,
    capture_costing,
    run_costing,
)

BILLING_RATE_USD = 10


class TestTaskOverride(OverrideTestCase):
    """Pins TaskOverride.update_time_and_costing, which the Task validate doc_event runs on
    every Task save, and the full Timesheet → costing job → Task and Project chain."""

    def setUp(self):
        super().setUp()
        self.project = self.make_project(
            customer=USD_CUSTOMER,
            custom_billing_type="Time and Material",
            custom_default_hourly_billing_rate=BILLING_RATE_USD,
        )
        self.task = self.make_task(self.project.name)

    def log(self, hours, date=DATE, task=None, submit=False, cancel=False):
        timesheet = self.make_timesheet(
            self.project.name, (task or self.task).name, [{"hours": hours, "is_billable": 1}], date=date
        )
        if submit or cancel:
            with capture_costing():
                submitted = frappe.get_doc("Timesheet", timesheet.name)
                submitted.submit()
                if cancel:
                    frappe.get_doc("Timesheet", timesheet.name).cancel()
        return timesheet

    def test_save_rolls_up_draft_and_submitted_rows_in_transaction_currency(self):
        self.log(2, date=DATE)
        self.log(3, date=NEXT_WEEK, submit=True)

        task = frappe.get_doc("Task", self.task.name)
        task.save(ignore_permissions=True)

        self.assertEqual(flt(task.actual_time), 5.0)
        self.assertEqual(flt(task.total_costing_amount), 5 * HOURLY_COST_USD)
        self.assertEqual(flt(task.total_billing_amount), 5 * BILLING_RATE_USD)
        self.assertEqual(getdate(task.act_start_date), getdate(DATE))
        self.assertEqual(getdate(task.act_end_date), getdate(NEXT_WEEK))

    def test_rows_of_cancelled_timesheets_drop_out(self):
        self.log(2, date=DATE)
        self.log(7, date=WEEK_AFTER_NEXT, cancel=True)

        task = frappe.get_doc("Task", self.task.name)
        task.save(ignore_permissions=True)

        self.assertEqual(flt(task.actual_time), 2.0)
        self.assertEqual(getdate(task.act_end_date), getdate(DATE))

    def test_open_task_is_saved_as_working(self):
        """Even with no time logged, and already on insert."""
        task = self.make_task(self.project.name, status="Open")
        self.assertEqual(frappe.db.get_value("Task", task.name, "status"), "Working")

        frappe.db.set_value("Task", task.name, "status", "Open")
        task = frappe.get_doc("Task", task.name)
        task.save(ignore_permissions=True)
        self.assertEqual(task.status, "Working")

    def test_other_statuses_are_left_alone(self):
        for status, fields in (("Pending Review", {}), ("Completed", {"completed_on": DATE})):
            with self.subTest(status=status):
                task = frappe.get_doc("Task", self.task.name)
                task.update({"status": status, **fields})
                task.save(ignore_permissions=True)

                self.assertEqual(frappe.db.get_value("Task", task.name, "status"), status)

    def test_timesheet_save_reaches_task_and_project_through_costing_job(self):
        other_task = self.make_task(self.project.name)

        with capture_costing() as calls:
            timesheet = self.build_timesheet(self.project.name, self.task.name, [{"hours": 2, "is_billable": 1}])
            timesheet.insert(ignore_permissions=True)
        run_costing(calls)

        self.assert_rollup(self.task.name, hours=2)
        self.assert_rollup(other_task.name, hours=0)
        self.assert_project_rollup(hours=2)

        timesheet = frappe.get_doc("Timesheet", timesheet.name)
        timesheet.ignore_backdated_validation = True
        timesheet.time_logs[0].task = other_task.name
        with capture_costing() as calls:
            timesheet.save(ignore_permissions=True)
        run_costing(calls)

        self.assert_rollup(self.task.name, hours=0)
        self.assert_rollup(other_task.name, hours=2)
        self.assert_project_rollup(hours=2)

        with capture_costing() as calls:
            frappe.delete_doc("Timesheet", timesheet.name, ignore_permissions=True)
        run_costing(calls)

        self.assert_rollup(other_task.name, hours=0)
        self.assert_project_rollup(hours=0)

    def assert_rollup(self, task, hours):
        saved = frappe.db.get_value(
            "Task", task, ["actual_time", "total_costing_amount", "total_billing_amount"], as_dict=True
        )
        self.assertEqual(flt(saved.actual_time), hours)
        self.assertEqual(flt(saved.total_costing_amount), hours * HOURLY_COST_USD)
        self.assertEqual(flt(saved.total_billing_amount), hours * BILLING_RATE_USD)

    def assert_project_rollup(self, hours):
        saved = frappe.db.get_value(
            "Project",
            self.project.name,
            ["actual_time", "total_costing_amount", "total_billable_amount", "custom_estimated_profit"],
            as_dict=True,
        )
        self.assertEqual(flt(saved.actual_time), hours)
        self.assertEqual(flt(saved.total_costing_amount), hours * HOURLY_COST_USD)
        self.assertEqual(flt(saved.total_billable_amount), hours * BILLING_RATE_USD)
        self.assertEqual(flt(saved.custom_estimated_profit), hours * (BILLING_RATE_USD - HOURLY_COST_USD))
