from typing import NamedTuple

import frappe
from frappe.core.doctype.doctype.doctype import validate_permissions_for_doctype
from frappe.permissions import setup_custom_perms, std_rights

from next_pms.permissions.capabilities import (
    EMPLOYEE,
    PMS_LEADERSHIP,
    PMS_ROLES,
    PROJECTS_MANAGER,
    PROJECTS_USER,
    SYSTEM_MANAGER,
)

LEGACY_PMS_ROLES = ("Timesheet Manager", "Timesheet User", "Delivery Manager", "Delivery User")


class PermKey(NamedTuple):
    role: str
    permlevel: int = 0
    if_owner: int = 0


class PermRule(NamedTuple):
    key: PermKey
    rights: tuple[str, ...]


def rule(role: str, rights: str, permlevel: int = 0, if_owner: int = 0) -> PermRule:
    """`rights` is a space-separated list of DocPerm columns, e.g. "read write export"."""
    return PermRule(PermKey(role, permlevel, if_owner), tuple(rights.split()))


# Custom DocPerm rows that earlier next_pms code wrote on doctypes it does not own. These are
# removed; the doctype's standard row for the same key comes back unless PERMISSION_MAP replaces it.
PMS_SET_KEYS: dict[str, tuple[PermKey, ...]] = {
    "Timesheet": (
        PermKey(EMPLOYEE),
        PermKey(PROJECTS_USER),
        PermKey(PROJECTS_USER, 1),
        PermKey(PROJECTS_MANAGER),
        PermKey(PROJECTS_MANAGER, 1),
        PermKey(PMS_LEADERSHIP),
        PermKey(PMS_LEADERSHIP, 1),
        PermKey("Accounts User"),
        PermKey("Accounts User", 1),
        PermKey("HR User"),
    ),
    "Project": (
        PermKey(EMPLOYEE, if_owner=1),
        PermKey("Desk User", 1),
        *(
            PermKey(role, level)
            for role in (PROJECTS_USER, "Timesheet User", "Timesheet Manager")
            for level in (0, 1, 2)
        ),
        *(
            PermKey(role, level)
            for role in (PROJECTS_MANAGER, PMS_LEADERSHIP, "Delivery Manager", SYSTEM_MANAGER)
            for level in (0, 1, 2, 3)
        ),
    ),
    "Task": (
        PermKey(EMPLOYEE),
        PermKey(EMPLOYEE, if_owner=1),
        PermKey(PROJECTS_MANAGER),
        PermKey(PROJECTS_MANAGER, 1),
        PermKey(PMS_LEADERSHIP),
        PermKey(PMS_LEADERSHIP, 1),
        PermKey(PROJECTS_USER),
        PermKey(PROJECTS_USER, 1),
        PermKey("Delivery Manager"),
        PermKey("Delivery User"),
    ),
    "Customer": (
        PermKey(PROJECTS_USER),
        PermKey(PROJECTS_MANAGER),
        PermKey(PMS_LEADERSHIP),
        PermKey("Delivery Manager"),
        PermKey(SYSTEM_MANAGER),
    ),
    "Role": (PermKey("Delivery Manager"),),
    "Designation": (PermKey(PROJECTS_MANAGER),),
    "Territory": (PermKey(PROJECTS_MANAGER),),
    "ToDo": (PermKey(SYSTEM_MANAGER),),
}

_TIMESHEET_REVIEWER = "read write create delete submit cancel amend report export share print email"
_FULL = "select read write create delete report export import share print email"

# Rows next_pms grants on doctypes it does not own. Frappe unions the rows of every role a user
# holds, and Projects Manager and PMS Leadership users also hold the role below them (see
# IMPLIED_ROLES), so those roles only list the rights the role below lacks. Timesheet rows are
# narrowed further by next_pms.timesheet.permission (own / reports / own projects; only Projects
# Manager and above write someone else's timesheet).
PERMISSION_MAP: dict[str, tuple[PermRule, ...]] = {
    "Timesheet": (
        rule(EMPLOYEE, "read write create delete"),
        rule(PROJECTS_USER, "read write create delete submit cancel amend report share print email"),
        rule(PROJECTS_MANAGER, "read export"),
        rule(PROJECTS_MANAGER, "read write export", permlevel=1),
        rule(SYSTEM_MANAGER, f"select import {_TIMESHEET_REVIEWER}"),
        rule(SYSTEM_MANAGER, "read write export", permlevel=1),
        rule("Accounts User", "read write create delete submit cancel amend report email"),
        rule("Accounts User", "read write", permlevel=1),
        rule("HR User", "read write create delete submit cancel amend report export share print email"),
    ),
    # Projects User reads permlevel 2 (project financials) but cannot edit it; cost and invoice
    # burn are hidden in the app by the view_cost_and_invoice_burn capability instead.
    "Project": (
        rule(EMPLOYEE, "select read", if_owner=1),
        rule("Desk User", "read", permlevel=1),
        rule(PROJECTS_USER, "read write create delete report export share print email"),
        rule(PROJECTS_USER, "read export", permlevel=1),
        rule(PROJECTS_USER, "read export", permlevel=2),
        rule(PROJECTS_USER, "read", permlevel=3),
        rule(PROJECTS_MANAGER, "select read create import"),
        rule(PROJECTS_MANAGER, "read write", permlevel=1),
        rule(PROJECTS_MANAGER, "read write", permlevel=2),
        rule(PROJECTS_MANAGER, "read export", permlevel=3),
        rule(PMS_LEADERSHIP, "read"),
        rule(PMS_LEADERSHIP, "read write", permlevel=3),
        rule(SYSTEM_MANAGER, _FULL),
        *(rule(SYSTEM_MANAGER, "read write export", permlevel=level) for level in (1, 2, 3)),
    ),
    "Task": (
        rule(EMPLOYEE, "read write create"),
        rule(EMPLOYEE, "read write create delete", if_owner=1),
        rule(PROJECTS_USER, "select read write create delete report share print email"),
        rule(PROJECTS_USER, "read write export", permlevel=1),
        rule(PROJECTS_MANAGER, "read create export import"),
        rule(SYSTEM_MANAGER, _FULL),
        rule(SYSTEM_MANAGER, "read write export", permlevel=1),
    ),
    "Customer": (
        rule(PROJECTS_USER, "select read"),
        rule(PROJECTS_MANAGER, "read export"),
        rule(SYSTEM_MANAGER, "select read"),
    ),
    "Role": (rule(PMS_LEADERSHIP, "select"),),
    "Designation": (rule(PROJECTS_MANAGER, "select read"),),
    "Department": (rule(PMS_LEADERSHIP, "select"),),
    "Project Type": (rule(PMS_LEADERSHIP, "select"),),
    "Territory": (
        rule(PROJECTS_USER, "select read"),
        rule(PMS_LEADERSHIP, "select read write"),
    ),
    "ToDo": (rule(SYSTEM_MANAGER, "read write create delete report export share print email"),),
}

# Doctypes next_pms owns: their JSON is the source for PMS roles, so Custom DocPerm rows for
# those roles are removed while rows other apps or admins added for other roles are kept.
OWNED_DOCTYPES: tuple[str, ...] = (
    "PMS Growth Initiative",
    "PMS Growth Initiative Category",
    "PMS Growth Initiative Status",
    "Project Status Update",
    "Project Status Update Template",
    "Project Status Update Template Category",
    "Project Time Report Frequency",
    "Risk",
    "Risk Category",
    "Risk Level",
    "Risk Status",
    "Project Phase",
    "Project Timeline Item",
    "Project Timeline Item Category",
    "Technology",
    "Delivery Accelerator",
    "Resource Allocation",
    "NextPMS Notifications",
    "PMS View Setting",
    "PMS User Setting",
    "PMS Project Update Subscription",
    "Timesheet Settings",
    "Host",
)


ROLE_PROFILES: dict[str, tuple[str, ...]] = {
    "PMS Employee": (EMPLOYEE,),
    "PMS Engineering Manager": (EMPLOYEE, PROJECTS_USER),
    "PMS Project Manager": (EMPLOYEE, PROJECTS_USER, PROJECTS_MANAGER),
    "PMS Leadership": (EMPLOYEE, PROJECTS_USER, PROJECTS_MANAGER, PMS_LEADERSHIP),
}


def create_pms_roles() -> None:
    if not frappe.db.exists("Role", PMS_LEADERSHIP):
        frappe.get_doc({"doctype": "Role", "role_name": PMS_LEADERSHIP, "desk_access": 1}).insert(
            ignore_permissions=True
        )


def create_pms_role_profiles() -> None:
    for name, roles in ROLE_PROFILES.items():
        if not frappe.db.exists("Role Profile", name):
            frappe.get_doc(
                {"doctype": "Role Profile", "role_profile": name, "roles": [{"role": role} for role in roles]}
            ).insert(ignore_permissions=True)
            continue

        profile = frappe.get_doc("Role Profile", name)
        held = {row.role for row in profile.roles}
        missing = [role for role in roles if role not in held]
        if missing:
            for role in missing:
                profile.append("roles", {"role": role})
            profile.save(ignore_permissions=True)


def apply_permissions() -> None:
    create_pms_roles()
    create_pms_role_profiles()
    for doctype in sorted(set(PMS_SET_KEYS) | set(PERMISSION_MAP)):
        apply_doctype_permissions(doctype)
    for doctype in OWNED_DOCTYPES:
        reset_owned_doctype_permissions(doctype)


def apply_doctype_permissions(doctype: str) -> None:
    setup_custom_perms(doctype)
    rules = {r.key: r.rights for r in PERMISSION_MAP.get(doctype, ())}
    existing_roles = set(frappe.get_all("Role", pluck="name"))

    for key in {*PMS_SET_KEYS.get(doctype, ()), *rules}:
        _delete_custom_perms(doctype, key)
        if key.role not in existing_roles:
            continue
        if key in rules:
            _insert_custom_perm(doctype, key, {**dict.fromkeys(std_rights, 0), **dict.fromkeys(rules[key], 1)})
        elif standard := _standard_rights(doctype, key):
            _insert_custom_perm(doctype, key, standard)

    validate_permissions_for_doctype(doctype)


def reset_owned_doctype_permissions(doctype: str) -> None:
    pms_roles = (*PMS_ROLES, *LEGACY_PMS_ROLES)
    if not frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": ["in", pms_roles]}):
        return

    frappe.db.delete("Custom DocPerm", {"parent": doctype, "role": ["in", pms_roles]})
    if frappe.db.exists("Custom DocPerm", {"parent": doctype}):
        for standard in frappe.get_all(
            "DocPerm",
            filters={"parent": doctype, "role": ["in", pms_roles]},
            fields=["role", "permlevel", "if_owner", *std_rights],
        ):
            key = PermKey(standard.pop("role"), standard.pop("permlevel"), standard.pop("if_owner"))
            _insert_custom_perm(doctype, key, standard)

    validate_permissions_for_doctype(doctype)


def _delete_custom_perms(doctype: str, key: PermKey) -> None:
    frappe.db.delete("Custom DocPerm", {"parent": doctype, **key._asdict()})


def _standard_rights(doctype: str, key: PermKey) -> dict | None:
    return frappe.db.get_value("DocPerm", {"parent": doctype, **key._asdict()}, std_rights, as_dict=True)


def _insert_custom_perm(doctype: str, key: PermKey, rights: dict) -> None:
    # ignore_permissions: runs from install / patch context to write role permissions
    frappe.get_doc(
        {
            "doctype": "Custom DocPerm",
            "parent": doctype,
            "parenttype": "DocType",
            "parentfield": "permissions",
            **key._asdict(),
            **rights,
        }
    ).insert(ignore_permissions=True)
