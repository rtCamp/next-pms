from unittest.mock import patch

import frappe
from frappe.utils import add_days, flt, nowdate

from next_pms.project_currency.billing_rate import BILLING_RATE_COST_MULTIPLIER
from next_pms.tests.project_currency.overrides.fixtures import (
    COMPANY,
    CTC_INR,
    DATE,
    HOURLY_COST_INR,
    HOURLY_COST_USD,
    INR_CUSTOMER,
    INR_TO_USD,
    USD_CUSTOMER,
    USD_TO_INR,
    OverrideTestCase,
    capture_costing,
    insert_bare,
)

ACTIVITY = "Override Test Activity"
DISABLED_ACTIVITY = "Override Test Disabled Activity"


class TestTimesheetOverride(OverrideTestCase):
    """Pins what TimesheetOverwrite computes today: hours, billing hours, rates in the
    project's currency, base amounts, and handing costing off to the background job."""

    def setUp(self):
        super().setUp()
        self.project = self.make_project()
        self.task = self.make_task(self.project.name)

    def timesheet(self, rows, project=None, task=None, **fields):
        project = project or self.project
        task = task or self.make_task(project.name)
        return self.make_timesheet(project.name, task.name, rows, **fields)

    def activity_type(self, name, disabled=0):
        if not frappe.db.exists("Activity Type", name):
            frappe.get_doc({"doctype": "Activity Type", "activity_type": name}).insert()
        frappe.db.set_value("Activity Type", name, "disabled", disabled)
        return name

    def promotion(self, promotion_date, revised_ctc, salary_currency="INR", new_currency=None):
        details = [{"property": "Salary Currency", "fieldname": "salary_currency", "new": new_currency}]
        insert_bare(
            "Employee Promotion",
            employee=self.employee,
            docstatus=1,
            promotion_date=promotion_date,
            revised_ctc=revised_ctc,
            salary_currency=salary_currency,
            children={"promotion_details": details} if new_currency else None,
        )

    def test_resave_keeps_hours_although_rows_span_no_time(self):
        """before_save moves from/to to midnight, so recomputing hours from them would give 0."""
        timesheet = self.timesheet([{"hours": 3}])
        row = timesheet.time_logs[0]
        self.assertEqual(row.from_time, row.to_time)

        timesheet = frappe.get_doc("Timesheet", timesheet.name)
        timesheet.ignore_backdated_validation = True
        with capture_costing():
            timesheet.save(ignore_permissions=True)

        self.assertEqual(flt(timesheet.time_logs[0].hours), 3.0)
        self.assertEqual(flt(timesheet.total_hours), 3.0)

    def test_billable_row_billing_hours_forced_to_hours(self):
        timesheet = self.timesheet(
            [
                {"hours": 4, "is_billable": 1, "billing_hours": 1},
                {"hours": 2, "is_billable": 0, "billing_hours": 2},
            ]
        )

        billable, non_billable = timesheet.time_logs
        self.assertEqual(flt(billable.billing_hours), 4.0)
        self.assertEqual(flt(non_billable.billing_hours), 0.0)

    def test_billing_hours_above_hours_warn_and_are_capped(self):
        with patch.object(frappe, "msgprint") as msgprint:
            timesheet = self.timesheet([{"hours": 2, "is_billable": 1, "billing_hours": 6}])

        self.assertEqual(flt(timesheet.time_logs[0].billing_hours), 2.0)
        warnings = [c.args[0] for c in msgprint.call_args_list if c.kwargs.get("indicator") == "orange"]
        self.assertTrue(any("Billing Hours are more than Actual Hours" in w for w in warnings))

    def test_disabled_activity_type_is_accepted(self):
        self.activity_type(DISABLED_ACTIVITY, disabled=1)

        timesheet = self.timesheet([{"hours": 1, "activity_type": DISABLED_ACTIVITY}])

        self.assertEqual(timesheet.time_logs[0].activity_type, DISABLED_ACTIVITY)

    def test_submit_without_activity_type(self):
        timesheet = self.timesheet([{"hours": 1}])

        with capture_costing():
            frappe.get_doc("Timesheet", timesheet.name).submit()

        self.assertEqual(frappe.db.get_value("Timesheet", timesheet.name, "docstatus"), 1)

    def test_header_fields_come_from_the_project(self):
        project = self.make_project(customer=USD_CUSTOMER)

        timesheet = self.timesheet([{"hours": 1}], project=project, customer=INR_CUSTOMER, currency="INR")

        self.assertEqual(timesheet.customer, USD_CUSTOMER)
        self.assertEqual(timesheet.company, COMPANY)
        self.assertEqual(timesheet.currency, "USD")
        self.assertEqual(flt(timesheet.exchange_rate), USD_TO_INR)

    def test_costing_rate_from_employee_ctc(self):
        timesheet = self.timesheet([{"hours": 3}])

        row = timesheet.time_logs[0]
        self.assertEqual(timesheet.currency, "INR")
        self.assertEqual(flt(timesheet.exchange_rate), 1.0)
        self.assertEqual(flt(row.costing_rate), HOURLY_COST_INR)
        self.assertEqual(flt(row.costing_amount), 3 * HOURLY_COST_INR)
        self.assertEqual(flt(timesheet.total_costing_amount), 3 * HOURLY_COST_INR)

    def test_costing_rate_from_latest_promotion_on_or_before_the_timesheet(self):
        self.promotion("2026-01-01", CTC_INR / 2)
        self.promotion("2026-07-01", CTC_INR * 2)
        self.promotion(add_days(DATE, 1), CTC_INR * 5)

        timesheet = self.timesheet([{"hours": 1}])

        self.assertEqual(flt(timesheet.time_logs[0].costing_rate), HOURLY_COST_INR * 2)

    def test_promotion_salary_currency_comes_from_its_property_history(self):
        """Employee Promotion.salary_currency keeps the pre-promotion currency; the new one is
        only on the promotion_details row."""
        self.promotion("2026-07-01", CTC_INR * INR_TO_USD, salary_currency="INR", new_currency="USD")

        timesheet = self.timesheet([{"hours": 1}])

        self.assertEqual(flt(timesheet.time_logs[0].costing_rate), HOURLY_COST_INR)

    def test_costing_rate_converted_to_timesheet_currency(self):
        project = self.make_project(customer=USD_CUSTOMER)

        timesheet = self.timesheet([{"hours": 2}], project=project)

        row = timesheet.time_logs[0]
        self.assertEqual(flt(row.costing_rate), HOURLY_COST_USD)
        self.assertEqual(flt(row.costing_amount), 2 * HOURLY_COST_USD)

    def test_time_and_material_uses_newest_billing_team_rate_valid_today(self):
        """valid_from is compared with today, not with the timesheet's date: a rate that
        starts after the timesheet's day but before today still applies."""
        project = self.make_project(
            custom_billing_type="Time and Material",
            custom_default_hourly_billing_rate=25,
            custom_project_billing_team=[
                {"employee": self.employee, "valid_from": "2026-01-01", "hourly_billing_rate": 40},
                {"employee": self.employee, "valid_from": add_days(DATE, 1), "hourly_billing_rate": 70},
                {"employee": self.employee, "valid_from": add_days(nowdate(), 30), "hourly_billing_rate": 99},
            ],
        )

        timesheet = self.timesheet([{"hours": 2, "is_billable": 1}], project=project)

        row = timesheet.time_logs[0]
        self.assertEqual(flt(row.billing_rate), 70.0)
        self.assertEqual(flt(row.billing_amount), 140.0)

    def test_billing_rate_converted_from_project_currency(self):
        project = self.make_project(
            customer=USD_CUSTOMER,
            custom_billing_type="Time and Material",
            custom_project_billing_team=[
                {"employee": self.employee, "valid_from": "2026-01-01", "hourly_billing_rate": 800},
            ],
        )
        frappe.db.set_value("Project", project.name, "custom_currency", "INR")

        timesheet = self.timesheet([{"hours": 1, "is_billable": 1}], project=project)

        self.assertEqual(timesheet.currency, "USD")
        self.assertEqual(flt(timesheet.time_logs[0].billing_rate), 800 * INR_TO_USD)

    def test_time_and_material_without_team_row_uses_project_default_rate(self):
        project = self.make_project(custom_billing_type="Time and Material", custom_default_hourly_billing_rate=25)

        timesheet = self.timesheet([{"hours": 2, "is_billable": 1}], project=project)

        self.assertEqual(flt(timesheet.time_logs[0].billing_rate), 25.0)

    def test_no_billing_rate_takes_a_multiple_of_costing_rate(self):
        for billing_type in ("Time and Material", "Fixed Cost", "Retainer", "Non-Billable"):
            with self.subTest(billing_type=billing_type):
                project = self.make_project(custom_billing_type=billing_type)

                timesheet = self.timesheet([{"hours": 2, "is_billable": 1}], project=project)

                row = timesheet.time_logs[0]
                self.assertEqual(flt(row.billing_rate), BILLING_RATE_COST_MULTIPLIER * HOURLY_COST_INR)
                self.assertEqual(flt(row.billing_amount), 2 * BILLING_RATE_COST_MULTIPLIER * HOURLY_COST_INR)

    def test_fixed_cost_and_retainer_ignore_billing_team(self):
        for billing_type in ("Fixed Cost", "Retainer"):
            with self.subTest(billing_type=billing_type):
                project = self.make_project(
                    custom_billing_type=billing_type,
                    custom_default_hourly_billing_rate=45,
                    custom_project_billing_team=[
                        {"employee": self.employee, "valid_from": "2026-01-01", "hourly_billing_rate": 99},
                    ],
                )

                timesheet = self.timesheet([{"hours": 1, "is_billable": 1}], project=project)

                self.assertEqual(flt(timesheet.time_logs[0].billing_rate), 45.0)

    def test_non_billable_row_has_no_billing_even_with_activity_type(self):
        project = self.make_project(custom_billing_type="Time and Material", custom_default_hourly_billing_rate=25)
        activity_type = self.activity_type(ACTIVITY)

        timesheet = self.timesheet([{"hours": 2, "is_billable": 0, "activity_type": activity_type}], project=project)

        row = timesheet.time_logs[0]
        self.assertEqual((flt(row.billing_rate), flt(row.billing_amount)), (0.0, 0.0))
        self.assertEqual(flt(row.costing_amount), 2 * HOURLY_COST_INR)

    def test_base_amounts_use_exchange_rate_to_global_currency(self):
        project = self.make_project(
            customer=USD_CUSTOMER, custom_billing_type="Time and Material", custom_default_hourly_billing_rate=10
        )

        timesheet = self.timesheet([{"hours": 2, "is_billable": 1}], project=project)

        row = timesheet.time_logs[0]
        self.assertEqual(flt(row.base_billing_rate), 10 * USD_TO_INR)
        self.assertEqual(flt(row.base_billing_amount), 20 * USD_TO_INR)
        self.assertEqual(flt(row.base_costing_rate), HOURLY_COST_USD * USD_TO_INR)
        self.assertEqual(flt(row.base_costing_amount), 2 * HOURLY_COST_USD * USD_TO_INR)
        self.assertEqual(flt(timesheet.total_billable_amount), 20.0)
        self.assertEqual(flt(timesheet.base_total_billable_amount), 20 * USD_TO_INR)
        self.assertEqual(flt(timesheet.base_total_costing_amount), 2 * HOURLY_COST_USD * USD_TO_INR)

    def test_update_cost_requires_parent_project(self):
        timesheet = self.build_timesheet(self.project.name, self.task.name, [{"hours": 1}])
        timesheet.parent_project = None

        with self.assertRaisesRegex(frappe.ValidationError, "Project is mandatory"):
            timesheet.update_cost()

    def test_save_hands_current_and_previous_rows_to_costing_job_once(self):
        other_task = self.make_task(self.project.name)
        timesheet = frappe.get_doc("Timesheet", self.timesheet([{"hours": 3}], task=self.task).name)
        timesheet.ignore_backdated_validation = True
        timesheet.time_logs[0].task = other_task.name
        with capture_costing() as calls:
            timesheet.save(ignore_permissions=True)

        self.assertEqual(calls, [([other_task.name, self.task.name], [self.project.name])])
        self.assertFalse(flt(frappe.db.get_value("Task", self.task.name, "actual_time")))
        self.assertFalse(flt(frappe.db.get_value("Task", other_task.name, "actual_time")))

    def test_submit_and_cancel_hand_off_to_costing_job(self):
        timesheet = self.timesheet([{"hours": 2}], task=self.task)
        expected = [([self.task.name], [self.project.name])]

        with capture_costing() as calls:
            frappe.get_doc("Timesheet", timesheet.name).submit()
        self.assertEqual(calls, expected)

        with capture_costing() as calls:
            frappe.get_doc("Timesheet", timesheet.name).cancel()
        self.assertEqual(calls, expected)

        self.assertFalse(flt(frappe.db.get_value("Task", self.task.name, "actual_time")))

    def test_doc_events_run_with_default_backdated_flag(self):
        timesheet = self.build_timesheet(self.project.name, self.task.name, [{"hours": 1}])
        del timesheet.ignore_backdated_validation
        self.assertIs(timesheet.ignore_backdated_validation, False)

        with capture_costing() as calls:
            timesheet.insert(ignore_permissions=True)
            frappe.delete_doc("Timesheet", timesheet.name, ignore_permissions=True)

        self.assertEqual(len(calls), 2)
        self.assertFalse(frappe.db.exists("Timesheet", timesheet.name))

    def test_status_follows_docstatus(self):
        timesheet = self.timesheet([{"hours": 1}])
        self.assertEqual(timesheet.status, "Draft")

        with capture_costing():
            submitted = frappe.get_doc("Timesheet", timesheet.name)
            submitted.submit()
            self.assertEqual(submitted.status, "Submitted")
            cancelled = frappe.get_doc("Timesheet", timesheet.name)
            cancelled.cancel()

        self.assertEqual(frappe.db.get_value("Timesheet", timesheet.name, "status"), "Cancelled")
