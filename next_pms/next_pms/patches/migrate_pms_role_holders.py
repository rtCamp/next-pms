import frappe

from next_pms.permissions.capabilities import (
    IMPLIED_ROLES,
    PMS_LEADERSHIP,
    PROJECTS_USER,
    get_implied_roles,
)
from next_pms.permissions.docperms import ROLE_PROFILES

LEGACY_ROLE_MAP = {"Delivery Manager": PMS_LEADERSHIP, "Timesheet Manager": PROJECTS_USER}

# Each PMS profile keyed by the highest role it grants, highest first.
PROFILE_BY_TOP_ROLE = {roles[-1]: name for name, roles in reversed(ROLE_PROFILES.items())}


def execute() -> None:
    """Move Delivery Manager and Timesheet Manager holders onto the PMS roles, never below a PMS
    role they already hold, and give every PMS role holder the roles it stacks on. Users whose
    roles come from role profiles get the PMS profile for their highest role, since a profile save
    drops roles no profile lists; everyone else gets the roles directly, so no one is moved onto
    profiles. Runs before retire_timesheet_roles deletes the Timesheet Manager assignments."""
    users = frappe.get_all(
        "Has Role",
        filters={
            "parenttype": "User",
            "role": ["in", [*LEGACY_ROLE_MAP, *IMPLIED_ROLES]],
            "parent": ["not in", frappe.STANDARD_USERS],
        },
        pluck="parent",
        distinct=True,
    )
    for name in users:
        if _migrate_user(frappe.get_doc("User", name)):
            frappe.clear_cache(user=name)


def _migrate_user(user) -> bool:
    held = {row.role for row in user.roles}
    mapped = {LEGACY_ROLE_MAP[role] for role in LEGACY_ROLE_MAP if role in held}
    wanted = held | mapped
    changed = False

    if mapped and user.role_profiles:
        profile = next(PROFILE_BY_TOP_ROLE[role] for role in PROFILE_BY_TOP_ROLE if role in wanted)
        if profile not in {row.role_profile for row in user.role_profiles}:
            user.append("role_profiles", {"role_profile": profile}).db_insert()
            changed = True
        wanted.update(
            frappe.get_all("Has Role", filters={"parenttype": "Role Profile", "parent": profile}, pluck="role")
        )

    wanted |= get_implied_roles(wanted)
    for role in sorted(wanted - held):
        user.append("roles", {"role": role}).db_insert()
        changed = True
    return changed
