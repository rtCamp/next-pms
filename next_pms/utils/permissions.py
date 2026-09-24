import frappe

OWNER_GATED_ROLES = frozenset({"Timesheet Manager", "Projects User"})
UNRESTRICTED_ROLES = frozenset({"System Manager", "Projects Manager", "Delivery Manager", "Delivery User"})
OWNER_REQUIRED_PTYPES = frozenset({"write", "delete", "share"})


def has_owner_gated_permission(doc_owner: str | None, ptype: str, user: str) -> bool:
    """Owner-gated roles may write, delete or share only when they are the document's assigned owner."""
    roles = frappe.get_roles(user)

    if UNRESTRICTED_ROLES.intersection(roles):
        return True
    if ptype not in OWNER_REQUIRED_PTYPES:
        return True
    if OWNER_GATED_ROLES.intersection(roles):
        return (doc_owner or "").lower() == user.lower()
    return True
