# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.api.dashboard import (
    get_active_projects_count,
    get_allocation_heatmap,
    get_at_risk_projects_count,
    get_calendar_timeline_items,
    get_employees_on_leave,
    get_forecast_breakdown,
    get_leadership_kpis,
    get_members_without_allocation,
    get_my_projects_summary,
    get_non_billable_hours,
    get_outstanding_timesheets,
    get_team_timesheets,
    get_time_utilisation,
    get_timesheets_to_review,
)

USERS = {
    "test.pl.dashboard@example.com": ["PMS Leadership"],
    "test.pm.dashboard@example.com": ["Projects Manager"],
    "test.pu.dashboard@example.com": ["Projects User"],
    "test.sm.dashboard@example.com": ["System Manager"],
    "test.dm.dashboard@example.com": ["Delivery Manager"],
    "test.du.dashboard@example.com": ["Delivery User"],
    "test.norole.dashboard@example.com": [],
}
LEADERSHIP_USERS = {"test.pl.dashboard@example.com", "test.sm.dashboard@example.com"}
MANAGER_DASHBOARD_USERS = LEADERSHIP_USERS | {"test.pm.dashboard@example.com", "test.pu.dashboard@example.com"}

SAMPLE_DATE_FROM = "2026-01-01"
SAMPLE_DATE_TO = "2026-01-31"
KPI_CUR_START = "2026-01-01"
KPI_CUR_END = "2026-03-31"
KPI_PREV_START = "2025-10-01"
KPI_PREV_END = "2025-12-31"
CAPABILITY_ERROR = "You are not permitted to perform this action."


class TestDashboardPermissions(IntegrationTestCase):
    """Leadership endpoints need leadership_dashboard (PMS Leadership, System Manager);
    the rest need a manager-dashboard capability (Projects User and above). Legacy
    Timesheet and Delivery roles grant nothing."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        for email, roles in USERS.items():
            if not frappe.db.exists("User", email):
                frappe.get_doc(
                    {
                        "doctype": "User",
                        "email": email,
                        "first_name": email.split("@")[0],
                        "user_type": "System User",
                        "send_welcome_email": 0,
                    }
                ).insert(ignore_permissions=True)
            frappe.get_doc("User", email).add_roles(*roles)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _assert_gate(self, cases, allowed_users):
        for user in USERS:
            frappe.set_user(user)
            for func, args in cases:
                with self.subTest(user=user, endpoint=func.__name__):
                    try:
                        func(*args)
                        blocked = False
                    except frappe.PermissionError as exc:
                        blocked = CAPABILITY_ERROR in str(exc)
                    self.assertEqual(blocked, user not in allowed_users)

    def test_leadership_endpoints(self):
        self._assert_gate(self._restricted_cases(), LEADERSHIP_USERS)

    def test_manager_dashboard_endpoints(self):
        self._assert_gate(self._all_roles_cases(), MANAGER_DASHBOARD_USERS)

    def test_allocation_widgets_scope_to_reports_below_leadership(self):
        everyone = get_members_without_allocation()["members"]
        frappe.set_user("test.pl.dashboard@example.com")
        self.assertEqual(get_members_without_allocation()["members"], everyone)
        frappe.set_user("test.pu.dashboard@example.com")
        scoped = get_members_without_allocation()
        self.assertEqual(scoped["members"], [])
        self.assertEqual(scoped["count"], 0)

    @staticmethod
    def _restricted_cases():
        return [
            (get_active_projects_count, []),
            (get_non_billable_hours, []),
            (get_time_utilisation, []),
            (get_forecast_breakdown, []),
            (
                get_leadership_kpis,
                [KPI_CUR_START, KPI_CUR_END, KPI_PREV_START, KPI_PREV_END],
            ),
        ]

    @staticmethod
    def _all_roles_cases():
        return [
            (get_at_risk_projects_count, []),
            (get_timesheets_to_review, []),
            (get_members_without_allocation, []),
            (get_outstanding_timesheets, []),
            (get_my_projects_summary, []),
            (get_employees_on_leave, []),
            (get_team_timesheets, []),
            (get_allocation_heatmap, [SAMPLE_DATE_FROM, SAMPLE_DATE_TO]),
            (get_calendar_timeline_items, [SAMPLE_DATE_FROM, SAMPLE_DATE_TO]),
        ]


class TestDashboardManagedProjects(IntegrationTestCase):
    """Below leadership, project widgets follow every manager field, not only Project Manager."""

    ENGINEER = "test.em.managed-projects@example.com"

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("User", cls.ENGINEER):
            frappe.get_doc(
                {"doctype": "User", "email": cls.ENGINEER, "first_name": "Managed Projects EM", "send_welcome_email": 0}
            ).insert(ignore_permissions=True)
        frappe.get_doc("User", cls.ENGINEER).add_roles("Projects User")
        cls.engineered = cls._project("Managed Projects EM", custom_engineering_manager=cls.ENGINEER)
        cls.other = cls._project("Managed Projects Other")
        cls.legacy_pm = cls._project("Managed Projects Legacy PM")
        frappe.db.set_value("Project", cls.legacy_pm, "custom_project_manager", cls.ENGINEER)

    @staticmethod
    def _project(name, **values):
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": f"{name} {frappe.generate_hash(length=6)}",
                    "custom_billing_type": "Non-Billable",
                    "is_active": "Yes",
                    "status": "Open",
                    "custom_project_rag_status": "Red",
                    **values,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_managed_projects_cover_every_manager_field(self):
        from next_pms.permissions.scope import get_managed_projects

        managed = get_managed_projects(self.ENGINEER)
        self.assertIn(self.engineered, managed)
        self.assertIn(self.legacy_pm, managed)
        self.assertNotIn(self.other, managed)

    def test_at_risk_count_includes_engineering_manager_projects(self):
        frappe.set_user(self.ENGINEER)
        self.assertEqual(get_at_risk_projects_count(project=self.engineered), 1)
        self.assertEqual(get_at_risk_projects_count(project=self.other), 0)

    def test_my_projects_summary_includes_engineering_manager_projects(self):
        frappe.set_user(self.ENGINEER)
        names = {row["name"] for row in get_my_projects_summary()}
        self.assertIn(self.engineered, names)
        self.assertNotIn(self.other, names)
