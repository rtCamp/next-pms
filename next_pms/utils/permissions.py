from next_pms.permissions.capabilities import has_capability

OWNER_REQUIRED_PTYPES = frozenset({"write", "delete", "share"})


def has_owner_gated_permission(doc_owner: str | None, ptype: str, user: str) -> bool:
    """Below project_admin, Projects page users may write, delete or share only when they are
    the document's assigned owner."""
    if has_capability("project_admin", user) or ptype not in OWNER_REQUIRED_PTYPES:
        return True
    if has_capability("projects_page", user):
        return (doc_owner or "").lower() == user.lower()
    return True
