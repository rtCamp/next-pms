from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import get_first_day, get_last_day

from next_pms.mcp_tools import capacity, project_health, timesheet_summary

NO_ROLES_USER = "next-mcp-tools@example.com"


class TestMCPTools(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("User", NO_ROLES_USER):
            frappe.get_doc(
                {"doctype": "User", "email": NO_ROLES_USER, "first_name": "MCP Tools", "send_welcome_email": 0}
            ).insert(ignore_permissions=True)
        cls.project = frappe.db.get_value("Project", {}, "name")

    def tearDown(self):
        frappe.set_user("Administrator")
        super().tearDown()

    def test_hook_lists_the_tools_for_rtcamp_mcp(self):
        paths = frappe.get_hooks("rtcamp_mcp_tools", app_name="next_pms")
        self.assertEqual([frappe.get_attr(path) for path in paths], [timesheet_summary, capacity, project_health])

    def test_timesheet_summary_validates_its_arguments(self):
        with self.assertRaisesRegex(frappe.ValidationError, "group_by"):
            timesheet_summary(from_date="2025-08-01", to_date="2025-08-31", group_by="colour")
        with self.assertRaisesRegex(frappe.ValidationError, "after"):
            timesheet_summary(from_date="2025-09-01", to_date="2025-08-01")
        with self.assertRaisesRegex(frappe.ValidationError, "at most"):
            timesheet_summary(from_date="2024-01-01", to_date="2025-08-01")

    def test_timesheet_summary_needs_the_report_for_anyone_but_the_user(self):
        frappe.set_user(NO_ROLES_USER)
        with self.assertRaises(frappe.PermissionError):
            timesheet_summary(from_date="2025-08-01", to_date="2025-08-31")

    def test_own_hours_match_the_timesheet_overview_report(self):
        timesheet = frappe.get_all(
            "Timesheet", filters={"docstatus": ["<", 2]}, fields=["employee", "start_date"], limit=1
        )
        if not timesheet:
            self.skipTest("no Timesheet on this site")
        employee, day = timesheet[0].employee, timesheet[0].start_date
        args = {"from_date": str(get_first_day(day)), "to_date": str(get_last_day(day)), "employee": employee}
        from_report = timesheet_summary(**args)

        # A user who may not run the report gets their own hours from their timesheet entries.
        frappe.set_user(NO_ROLES_USER)
        with patch("next_pms.mcp_tools.get_employee_from_user", return_value=employee):
            own = timesheet_summary(**args)

        self.assertGreater(from_report["total_hours"], 0)
        self.assertEqual(own, from_report)

    def test_capacity_uses_the_resource_management_access_check(self):
        frappe.set_user(NO_ROLES_USER)
        with self.assertRaises(frappe.PermissionError):
            capacity(from_date="2025-08-01", to_date="2025-08-31")

    def test_project_health_includes_project_tracking(self):
        if not self.project:
            self.skipTest("no Project on this site")
        self.assertIn("hours_utilised", project_health(self.project)["tracking"])

    def test_project_health_checks_permission(self):
        if not self.project:
            self.skipTest("no Project on this site")
        frappe.set_user(NO_ROLES_USER)
        with self.assertRaises(frappe.PermissionError):
            project_health(self.project)
