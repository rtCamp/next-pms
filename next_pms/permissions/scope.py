from dataclasses import dataclass

import frappe

from next_pms.permissions.capabilities import (
    ALL,
    REPORTS,
    REPORTS_AND_OWN_PROJECTS,
    Scope,
    capability_scope,
)


@dataclass(frozen=True)
class EmployeeScope:
    """Which employees (and, for project-scoped capabilities, which projects) a user reaches
    through one capability. Without the capability the user reaches only themselves."""

    scope: Scope | None
    employee: str | None
    reports: frozenset[str] = frozenset()
    managed_projects: frozenset[str] = frozenset()
    project_members: frozenset[str] = frozenset()

    @property
    def is_unrestricted(self) -> bool:
        return self.scope == ALL

    def allows(self, employee: str | None, project: str | None = None) -> bool:
        if self.is_unrestricted:
            return True
        if employee and employee == self.employee:
            return True
        if self.scope in (REPORTS, REPORTS_AND_OWN_PROJECTS) and employee in self.reports:
            return True
        if self.scope == REPORTS_AND_OWN_PROJECTS:
            if project:
                return project in self.managed_projects
            return employee in self.project_members
        return False

    def employee_ids(self) -> set[str] | None:
        """Employees in scope, or None when the scope is unrestricted."""
        if self.is_unrestricted:
            return None
        return {e for e in (self.employee, *self.reports, *self.project_members) if e}


def get_employee_scope(capability: str, user: str | None = None) -> EmployeeScope:
    user = user or frappe.session.user
    scope = capability_scope(capability, user)
    employee = frappe.db.get_value("Employee", {"user_id": user})
    if scope == ALL or not employee or scope not in (REPORTS, REPORTS_AND_OWN_PROJECTS):
        return EmployeeScope(scope=scope, employee=employee)

    reports = frozenset(frappe.get_all("Employee", filters={"reports_to": employee}, pluck="name"))
    if scope == REPORTS:
        return EmployeeScope(scope=scope, employee=employee, reports=reports)

    managed_projects = frozenset(frappe.get_all("Project", filters={"custom_project_manager": user}, pluck="name"))
    return EmployeeScope(
        scope=scope,
        employee=employee,
        reports=reports,
        managed_projects=managed_projects,
        project_members=_get_project_members(managed_projects),
    )


def _get_project_members(projects: frozenset[str]) -> frozenset[str]:
    """Employees shared on any of `projects` or with time logged against one of them."""
    if not projects:
        return frozenset()
    shared_users = frappe.get_all(
        "DocShare",
        filters={"share_doctype": "Project", "share_name": ["in", list(projects)], "everyone": 0},
        pluck="user",
    )
    shared = frappe.get_all("Employee", filters={"user_id": ["in", shared_users]}, pluck="name") if shared_users else []
    logged = frappe.get_all(
        "Timesheet", filters={"parent_project": ["in", list(projects)]}, pluck="employee", distinct=True
    )
    return frozenset(shared) | frozenset(logged)
