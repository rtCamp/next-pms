import frappe
from frappe.tests import IntegrationTestCase
from hrms.overrides.employee_project import EmployeeProject

from next_pms.project_currency.overrides.project import ProjectOverwrite
from next_pms.project_currency.overrides.task import TaskOverride
from next_pms.project_currency.overrides.timesheet import TimesheetOverwrite

PROJECT_METHODS = (
    "validate",
    "update_project_currency",
    "validate_overlap_project_billing",
    "validate_project_budget",
    "update_costing",
    "update_sales_amount",
    "update_billed_amount",
    "update_purchase_costing",
    "update_expense_claim",
    "update_project_cost_rate",
    "update_retainer_project_budget",
    "calculate_estimated_profit",
)

TIMESHEET_METHODS = (
    "calculate_hours",
    "update_task_and_project",
    "update_billing_hours",
    "validate_time_logs",
    "validate_mandatory_fields",
    "update_cost",
    "set_base_rates",
    "get_activity_costing_rate",
    "get_activity_billing_rate",
)

TASK_METHODS = ("update_time_and_costing",)


class TestOverrideWiring(IntegrationTestCase):
    """Whatever hook wires them in (override today, extend later), the controller Frappe builds
    for each doctype must contain our class and run our methods.

    Deliberately not asserted: the exact controller class, and whether hrms's classes are in the
    MRO. Both change, by design, when the hooks move to extend_doctype_class."""

    def assert_methods_resolve_to(self, doctype, override_class, methods):
        controller = type(frappe.get_doc({"doctype": doctype}))

        self.assertTrue(issubclass(controller, override_class), f"{doctype} controller lost {override_class}")
        for method in methods:
            with self.subTest(doctype=doctype, method=method):
                self.assertIs(getattr(controller, method), override_class.__dict__[method])

    def test_project_controller_runs_project_overwrite(self):
        self.assert_methods_resolve_to("Project", ProjectOverwrite, PROJECT_METHODS)

    def test_project_controller_keeps_hrms_gross_margin(self):
        """update_costing calls hrms's calculate_gross_margin, so hrms must stay underneath."""
        controller = type(frappe.get_doc({"doctype": "Project"}))

        self.assertTrue(issubclass(controller, EmployeeProject))
        self.assertIs(controller.calculate_gross_margin, EmployeeProject.__dict__["calculate_gross_margin"])

    def test_timesheet_controller_runs_timesheet_overwrite(self):
        self.assert_methods_resolve_to("Timesheet", TimesheetOverwrite, TIMESHEET_METHODS)

    def test_timesheet_has_backdated_validation_flag(self):
        """Timesheet doc_events read this attribute; without it every save raises AttributeError."""
        self.assertIs(frappe.get_doc({"doctype": "Timesheet"}).ignore_backdated_validation, False)

    def test_task_controller_runs_task_override(self):
        self.assert_methods_resolve_to("Task", TaskOverride, TASK_METHODS)
