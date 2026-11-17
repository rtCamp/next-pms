import frappe

from next_pms.permissions.capabilities import REPORTS_AND_OWN_PROJECTS, has_capability
from next_pms.permissions.scope import EmployeeScope, get_employee_scope

# Roles outside PMS that keep reading and editing every timesheet, as they did before.
UNRESTRICTED_ROLES = frozenset({"HR User", "HR Manager", "Accounts User"})
READ_PTYPES = frozenset({"read", "select", "report", "export", "print", "email", "share"})


def _is_unrestricted_user(user: str) -> bool:
    return user == "Administrator" or bool(UNRESTRICTED_ROLES.intersection(frappe.get_roles(user)))


def _can_read(scope: EmployeeScope, doc) -> bool:
    if doc.employee == scope.employee or doc.employee in scope.reports:
        return True
    return scope.scope == REPORTS_AND_OWN_PROJECTS and doc.parent_project in scope.managed_projects


def get_permission_query_conditions(user: str | None = None) -> str:
    user = user or frappe.session.user
    if _is_unrestricted_user(user):
        return ""
    scope = get_employee_scope("view_others_timesheets", user)
    if scope.is_unrestricted:
        return ""

    employees = [e for e in (scope.employee, *scope.reports) if e]
    conditions = (
        [f"`tabTimesheet`.`employee` in ({', '.join(frappe.db.escape(e) for e in employees)})"] if employees else []
    )
    if scope.scope == REPORTS_AND_OWN_PROJECTS and scope.managed_projects:
        projects = ", ".join(frappe.db.escape(p) for p in scope.managed_projects)
        conditions.append(f"`tabTimesheet`.`parent_project` in ({projects})")
    return f"({' or '.join(conditions)})" if conditions else "1=0"


def has_permission(doc, ptype: str | None = None, user: str | None = None, debug: bool = False) -> bool:
    user = user or frappe.session.user
    if _is_unrestricted_user(user) or not doc.get("employee"):
        return True
    scope = get_employee_scope("view_others_timesheets", user)
    if ptype in READ_PTYPES:
        return scope.is_unrestricted or _can_read(scope, doc)
    return doc.employee == scope.employee or has_capability("edit_others_time", user)
