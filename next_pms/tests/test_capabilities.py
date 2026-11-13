from unittest.mock import patch

import frappe
from frappe.tests import UnitTestCase

from next_pms.permissions.capabilities import (
    ALL,
    CAPABILITIES,
    EMPLOYEE,
    PMS_LEADERSHIP,
    PROJECTS_MANAGER,
    PROJECTS_USER,
    REPORTS,
    REPORTS_AND_OWN_PROJECTS,
    SYSTEM_MANAGER,
    capability_scope,
    get_user_capabilities,
    has_capability,
    require_capability,
)


def _as_roles(*roles):
    return patch("next_pms.permissions.capabilities.frappe.get_roles", return_value=["All", *roles])


class TestCapabilities(UnitTestCase):
    def test_employee_only_holds_self_service_capabilities(self):
        with _as_roles(EMPLOYEE):
            self.assertEqual(
                set(get_user_capabilities("someone@example.com")),
                {"open_app", "view_allocations", "notifications"},
            )

    def test_projects_user_scopes(self):
        with _as_roles(EMPLOYEE, PROJECTS_USER):
            self.assertEqual(capability_scope("view_others_timesheets", "pu@example.com"), REPORTS_AND_OWN_PROJECTS)
            self.assertEqual(capability_scope("approve_week", "pu@example.com"), REPORTS)
            self.assertEqual(capability_scope("view_project_financials", "pu@example.com"), ALL)
            self.assertFalse(has_capability("view_cost_and_invoice_burn", "pu@example.com"))
            self.assertFalse(has_capability("view_resource_cost", "pu@example.com"))
            self.assertFalse(has_capability("edit_others_time", "pu@example.com"))

    def test_widest_scope_wins_across_roles(self):
        with _as_roles(PROJECTS_USER, PROJECTS_MANAGER):
            self.assertEqual(capability_scope("view_others_timesheets", "pm@example.com"), ALL)

    def test_leadership_owns_settings_and_ai_allocations(self):
        with _as_roles(EMPLOYEE, PMS_LEADERSHIP):
            for capability in ("leadership_dashboard", "system_settings", "manage_ai_allocations"):
                self.assertEqual(capability_scope(capability, "pl@example.com"), ALL)
        with _as_roles(EMPLOYEE, PROJECTS_MANAGER):
            self.assertFalse(has_capability("leadership_dashboard", "pm@example.com"))

    def test_only_system_manager_edits_others_time(self):
        holders = {role for role, scope in CAPABILITIES["edit_others_time"].items() if scope}
        self.assertEqual(holders, {SYSTEM_MANAGER})

    def test_legacy_roles_grant_nothing(self):
        with _as_roles("Timesheet Manager", "Timesheet User", "Delivery Manager", "Delivery User"):
            self.assertEqual(get_user_capabilities("legacy@example.com"), {})

    def test_administrator_holds_everything(self):
        self.assertEqual(set(get_user_capabilities("Administrator")), set(CAPABILITIES))

    def test_require_capability_raises_without_it(self):
        session_user = frappe.session.user
        frappe.session.user = "emp@example.com"
        try:
            with _as_roles(EMPLOYEE), self.assertRaises(frappe.PermissionError):
                require_capability("projects_page")
        finally:
            frappe.session.user = session_user
