import frappe

from next_pms.permissions.capabilities import HR_ROLES, REPORTS_AND_OWN_PROJECTS
from next_pms.permissions.scope import get_employee_scope

# Roles outside PMS that keep reading and editing every timesheet, as they did before.
UNRESTRICTED_ROLES = HR_ROLES | {"Accounts User"}
READ_PTYPES = frozenset({"read", "select", "report", "export", "print", "email", "share"})


def _is_unrestricted_user(user: str) -> bool:
    return user == "Administrator" or bool(UNRESTRICTED_ROLES.intersection(frappe.get_roles(user)))


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
    capability = "view_others_timesheets" if ptype in READ_PTYPES else "edit_others_time"
    return get_employee_scope(capability, user).allows_entry(doc.employee, doc.parent_project)
