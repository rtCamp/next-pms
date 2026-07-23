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

DELIVERY_MANAGER_USER = "test.dm.dashboard@example.com"
DELIVERY_USER_USER = "test.du.dashboard@example.com"
PROJECTS_MANAGER_USER = "test.pm.dashboard@example.com"
PROJECTS_USER_USER = "test.pu.dashboard@example.com"
NO_ROLE_USER = "test.norole.dashboard@example.com"

SAMPLE_DATE_FROM = "2026-01-01"
SAMPLE_DATE_TO = "2026-01-31"
KPI_CUR_START = "2026-01-01"
KPI_CUR_END = "2026-03-31"
KPI_PREV_START = "2025-10-01"
KPI_PREV_END = "2025-12-31"


class TestDashboardPermissions(IntegrationTestCase):
    """Verify the role-based access rules on every dashboard endpoint.

    Restricted (Delivery Manager / Delivery User only):
        get_leadership_kpis, get_active_projects_count, get_non_billable_hours,
        get_time_utilisation, get_forecast_breakdown.

    All four roles (Delivery Manager, Delivery User, Projects Manager, Projects User):
        all remaining dashboard endpoints.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._make_user(DELIVERY_MANAGER_USER, ["Delivery Manager"])
        cls._make_user(DELIVERY_USER_USER, ["Delivery User"])
        cls._make_user(PROJECTS_MANAGER_USER, ["Projects Manager"])
        cls._make_user(PROJECTS_USER_USER, ["Projects User"])
        cls._make_user(NO_ROLE_USER, [])
        frappe.clear_cache()

    @classmethod
    def _make_user(cls, email, roles):
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
        user = frappe.get_doc("User", email)
        for role in roles:
            user.add_roles(role)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _assert_permitted(self, func, *args):
        """Assert that the only_for gate does not block the current user."""
        try:
            func(*args)
        except frappe.PermissionError as exc:
            if "This action is only allowed for" in str(exc):
                self.fail(f"{func.__name__} role gate blocked user {frappe.session.user}: {exc}")

    def _assert_forbidden(self, func, *args):
        """Assert that the only_for gate blocks the current user."""
        with self.assertRaises(
            frappe.PermissionError,
            msg=f"{func.__name__} should have raised PermissionError for user {frappe.session.user}",
        ) as ctx:
            func(*args)
        self.assertIn(
            "This action is only allowed for",
            str(ctx.exception),
            f"{func.__name__} should have been blocked by only_for() for user {frappe.session.user}",
        )

    # Restricted endpoints - Delivery Manager and Delivery User only

    def test_restricted_endpoints_deny_projects_manager(self):
        frappe.set_user(PROJECTS_MANAGER_USER)
        for func, args in self._restricted_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_forbidden(func, *args)

    def test_restricted_endpoints_deny_projects_user(self):
        frappe.set_user(PROJECTS_USER_USER)
        for func, args in self._restricted_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_forbidden(func, *args)

    def test_restricted_endpoints_deny_no_role_user(self):
        frappe.set_user(NO_ROLE_USER)
        for func, args in self._restricted_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_forbidden(func, *args)

    def test_restricted_endpoints_allow_delivery_manager(self):
        frappe.set_user(DELIVERY_MANAGER_USER)
        for func, args in self._restricted_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    def test_restricted_endpoints_allow_delivery_user(self):
        frappe.set_user(DELIVERY_USER_USER)
        for func, args in self._restricted_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    # All-roles endpoints — any of the four PMS roles

    def test_all_roles_endpoints_deny_no_role_user(self):
        frappe.set_user(NO_ROLE_USER)
        for func, args in self._all_roles_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_forbidden(func, *args)

    def test_all_roles_endpoints_allow_delivery_manager(self):
        frappe.set_user(DELIVERY_MANAGER_USER)
        for func, args in self._all_roles_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    def test_all_roles_endpoints_allow_delivery_user(self):
        frappe.set_user(DELIVERY_USER_USER)
        for func, args in self._all_roles_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    def test_all_roles_endpoints_allow_projects_manager(self):
        frappe.set_user(PROJECTS_MANAGER_USER)
        for func, args in self._all_roles_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    def test_all_roles_endpoints_allow_projects_user(self):
        frappe.set_user(PROJECTS_USER_USER)
        for func, args in self._all_roles_cases():
            with self.subTest(endpoint=func.__name__):
                self._assert_permitted(func, *args)

    # Helpers

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
