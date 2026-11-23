import frappe

from next_pms.permissions.capabilities import EMPLOYEE, has_capability

CONTRACTOR = "Contractor"


def _get_shared_project_names(user: str, roles: set[str]) -> list[str]:
    """Contractors see only individual shares; everyone else also sees projects shared with everyone."""
    filters = [["everyone", "=", 0]] if CONTRACTOR in roles else None
    return sorted(frappe.share.get_shared("Project", user, filters=filters))


def get_accessible_project_names(user: str | None = None) -> list[str] | None:
    """Projects whose tasks `user` may see and log time on, or None when every project they
    can read is fine: anyone without the Projects page gets the projects shared with them."""
    user = user or frappe.session.user
    if user == "Administrator":
        return None
    roles = set(frappe.get_roles(user))
    if CONTRACTOR not in roles and has_capability("projects_page", user):
        return None
    return _get_shared_project_names(user, roles)


def _roles_listing_all_projects() -> set[str]:
    return {
        perm.role
        for perm in frappe.get_meta("Project").permissions
        if not perm.permlevel and not perm.if_owner and (perm.select or perm.read)
    }


def get_project_scope(user: str | None = None) -> list[str] | None:
    """Projects `user` may list and open, or None when their Project permissions apply as they
    are. Users whose Project access comes from the Employee role alone are limited to the
    projects shared with them or with everyone."""
    user = user or frappe.session.user
    if user == "Administrator" or set(frappe.get_roles(user)) & (_roles_listing_all_projects() - {EMPLOYEE}):
        return None
    return sorted(frappe.share.get_shared("Project", user))


def get_permission_query_conditions(user: str | None = None) -> str:
    names = get_project_scope(user)
    if names is None:
        return ""
    if not names:
        return "1=0"
    return f"`tabProject`.`name` in ({', '.join(frappe.db.escape(name) for name in names)})"


def has_permission(doc, ptype: str | None = None, user: str | None = None, debug: bool = False) -> bool:
    names = get_project_scope(user)
    return names is None or doc.name in names
