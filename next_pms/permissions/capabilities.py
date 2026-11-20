from collections.abc import Iterable
from typing import Literal

import frappe
from frappe import _

Scope = Literal["own", "reports", "reports_and_own_projects", "all"]

OWN: Scope = "own"
REPORTS: Scope = "reports"
REPORTS_AND_OWN_PROJECTS: Scope = "reports_and_own_projects"
ALL: Scope = "all"

_SCOPE_RANK: dict[Scope, int] = {OWN: 0, REPORTS: 1, REPORTS_AND_OWN_PROJECTS: 2, ALL: 3}

EMPLOYEE = "Employee"
PROJECTS_USER = "Projects User"
PROJECTS_MANAGER = "Projects Manager"
PMS_LEADERSHIP = "PMS Leadership"
SYSTEM_MANAGER = "System Manager"

PMS_ROLES = (EMPLOYEE, PROJECTS_USER, PROJECTS_MANAGER, PMS_LEADERSHIP, SYSTEM_MANAGER)

# Non-PMS roles that keep their pre-capability access to employee and timesheet data.
HR_ROLES = frozenset({"HR User", "HR Manager"})

IMPLIED_ROLES = {PMS_LEADERSHIP: PROJECTS_MANAGER, PROJECTS_MANAGER: PROJECTS_USER}


def get_implied_roles(roles: Iterable[str]) -> set[str]:
    """Every role the given roles stack on top of, transitively."""
    implied = set()
    for role in roles:
        while role in IMPLIED_ROLES:
            role = IMPLIED_ROLES[role]
            implied.add(role)
    return implied


def _grant(scope: Scope, *roles: str) -> dict[str, Scope]:
    return dict.fromkeys(roles, scope)


_EVERYONE = PMS_ROLES
_REVIEWERS = (PROJECTS_USER, PROJECTS_MANAGER, PMS_LEADERSHIP, SYSTEM_MANAGER)
_MANAGERS = (PROJECTS_MANAGER, PMS_LEADERSHIP, SYSTEM_MANAGER)
_LEADERSHIP = (PMS_LEADERSHIP, SYSTEM_MANAGER)

CAPABILITIES: dict[str, dict[str, Scope]] = {
    "open_app": _grant(ALL, *_EVERYONE),
    "edit_others_time": _grant(ALL, SYSTEM_MANAGER),
    "view_others_timesheets": {PROJECTS_USER: REPORTS_AND_OWN_PROJECTS, **_grant(ALL, *_MANAGERS)},
    "approve_week": {PROJECTS_USER: REPORTS, **_grant(ALL, *_MANAGERS)},
    "approve_project_timesheets": {PROJECTS_USER: REPORTS_AND_OWN_PROJECTS, **_grant(ALL, *_MANAGERS)},
    "be_timesheet_approver": {PROJECTS_USER: REPORTS_AND_OWN_PROJECTS, **_grant(ALL, *_MANAGERS)},
    "team_timesheet_pages": {PROJECTS_USER: REPORTS_AND_OWN_PROJECTS, **_grant(ALL, *_MANAGERS)},
    "view_employee_details": {PROJECTS_USER: REPORTS, **_grant(ALL, *_MANAGERS)},
    "manager_dashboard": _grant(REPORTS, *_REVIEWERS),
    "approve_leaves": _grant(REPORTS, *_REVIEWERS),
    "leadership_dashboard": _grant(ALL, *_LEADERSHIP),
    "allocation_widgets": {**_grant(REPORTS, PROJECTS_USER, PROJECTS_MANAGER), **_grant(ALL, *_LEADERSHIP)},
    "projects_page": _grant(ALL, *_REVIEWERS),
    "view_project_financials": _grant(ALL, *_REVIEWERS),
    "view_cost_and_invoice_burn": _grant(ALL, *_MANAGERS),
    "edit_project_billing": _grant(ALL, *_MANAGERS),
    "project_admin": _grant(ALL, *_MANAGERS),
    "view_allocations": _grant(ALL, *_EVERYONE),
    "manage_allocations": _grant(ALL, *_REVIEWERS),
    "manage_ai_allocations": _grant(ALL, *_LEADERSHIP),
    "view_resource_cost": _grant(ALL, *_MANAGERS),
    "view_team_leaves": {PROJECTS_USER: REPORTS, **_grant(ALL, *_MANAGERS)},
    "system_settings": _grant(ALL, *_LEADERSHIP),
    "public_views": _grant(ALL, *_MANAGERS),
    "filter_lookups": _grant(ALL, *_REVIEWERS),
    "notifications": _grant(ALL, *_EVERYONE),
}


MANAGER_FIELD_ROLES: dict[str, tuple[str, ...]] = {
    "custom_project_manager": (PROJECTS_USER, SYSTEM_MANAGER),
    "custom_engineering_manager": (PROJECTS_USER, SYSTEM_MANAGER),
    "custom_account_manager_": (PROJECTS_USER, SYSTEM_MANAGER),
}


def get_project_manager_fields() -> list[str]:
    """Manager fields present on Project; the account manager field comes from the rtcamp app."""
    meta = frappe.get_meta("Project")
    return [fieldname for fieldname in MANAGER_FIELD_ROLES if meta.has_field(fieldname)]


def get_missing_manager_role(fieldname: str, user: str) -> str | None:
    """The least role `user` needs to approve timesheets as the project's `fieldname`, or None
    when they already hold one that qualifies."""
    qualifying_roles = MANAGER_FIELD_ROLES[fieldname]
    if user == "Administrator" or set(frappe.get_roles(user)) & set(qualifying_roles):
        return None
    return qualifying_roles[0]


def _widest_scope(grants: dict[str, Scope], roles: set[str]) -> Scope | None:
    scopes = [grants[role] for role in roles if role in grants]
    return max(scopes, key=_SCOPE_RANK.__getitem__, default=None)


def _resolve(user: str | None) -> tuple[bool, set[str]]:
    user = user or frappe.session.user
    return user == "Administrator", set(frappe.get_roles(user))


def capability_scope(capability: str, user: str | None = None) -> Scope | None:
    """The widest scope `user` holds for `capability` across their roles, or None."""
    is_admin, roles = _resolve(user)
    return ALL if is_admin else _widest_scope(CAPABILITIES[capability], roles)


def has_capability(capability: str, user: str | None = None) -> bool:
    return capability_scope(capability, user) is not None


def require_capability(capability: str) -> Scope:
    """Raise PermissionError unless the session user holds `capability`; return its scope."""
    scope = capability_scope(capability)
    if scope is None:
        frappe.throw(_("You are not permitted to perform this action."), frappe.PermissionError)
    return scope


def get_user_capabilities(user: str | None = None) -> dict[str, Scope]:
    is_admin, roles = _resolve(user)
    if is_admin:
        return dict.fromkeys(CAPABILITIES, ALL)
    capabilities = {}
    for capability, grants in CAPABILITIES.items():
        if scope := _widest_scope(grants, roles):
            capabilities[capability] = scope
    return capabilities
