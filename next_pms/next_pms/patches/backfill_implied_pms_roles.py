import frappe

from next_pms.permissions.capabilities import IMPLIED_ROLES, get_implied_roles


def execute() -> None:
    """Give existing users the roles their PMS role now stacks on. The User validate hook
    adds them on the next save, and until then the manager DocPerm rows, which list only
    what the role below lacks, leave those users without the base rights."""
    users = frappe.get_all(
        "Has Role",
        filters={
            "parenttype": "User",
            "role": ["in", list(IMPLIED_ROLES)],
            "parent": ["not in", frappe.STANDARD_USERS],
        },
        pluck="parent",
        distinct=True,
    )
    for name in users:
        user = frappe.get_doc("User", name)
        held = {row.role for row in user.roles}
        missing = get_implied_roles(held) - held
        for role in sorted(missing):
            user.append("roles", {"role": role}).db_insert()
        if missing:
            frappe.clear_cache(user=name)
