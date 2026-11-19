import frappe
from frappe.permissions import std_rights
from frappe.tests import IntegrationTestCase

from next_pms.permissions.docperms import (
    OWNED_DOCTYPES,
    PERMISSION_MAP,
    ROLE_PROFILES,
    apply_permissions,
    create_pms_role_profiles,
)

PROJECTS_USER_STACK = ("Employee", "Projects User")
PROJECTS_MANAGER_STACK = (*PROJECTS_USER_STACK, "Projects Manager")
LEADERSHIP_STACK = (*PROJECTS_MANAGER_STACK, "PMS Leadership")

# What each stacked persona held when every role carried its own full rows: stacking the roles
# must keep it, keyed by (permlevel, if_owner).
EFFECTIVE_RIGHTS = {
    "Timesheet": {
        PROJECTS_USER_STACK: {
            (0, 0): "amend cancel create delete email print read report share submit write",
        },
        PROJECTS_MANAGER_STACK: {
            (0, 0): "amend cancel create delete email export print read report share submit write",
            (1, 0): "export read write",
        },
        LEADERSHIP_STACK: {
            (0, 0): "amend cancel create delete email export print read report share submit write",
            (1, 0): "export read write",
        },
    },
    "Project": {
        PROJECTS_USER_STACK: {
            (0, 0): "create delete email export print read report select share write",
            (0, 1): "read select",
            (1, 0): "export read",
            (2, 0): "export read",
            (3, 0): "read",
        },
        PROJECTS_MANAGER_STACK: {
            (0, 0): "create delete email export import print read report select share write",
            (0, 1): "read select",
            (1, 0): "export read write",
            (2, 0): "export read write",
            (3, 0): "export read",
        },
        LEADERSHIP_STACK: {
            (0, 0): "create delete email export import print read report select share write",
            (0, 1): "read select",
            (1, 0): "export read write",
            (2, 0): "export read write",
            (3, 0): "export read write",
        },
    },
    "Task": {
        PROJECTS_USER_STACK: {
            (0, 0): "create delete email print read report select share write",
            (0, 1): "create delete read write",
            (1, 0): "export read write",
        },
        PROJECTS_MANAGER_STACK: {
            (0, 0): "create delete email export import print read report select share write",
            (0, 1): "create delete read write",
            (1, 0): "export read write",
        },
        LEADERSHIP_STACK: {
            (0, 0): "create delete email export import print read report select share write",
            (0, 1): "create delete read write",
            (1, 0): "export read write",
        },
    },
}


_FULL = "create delete email export print read report share write"
_FULL_SELECT = "create delete email export print read report select share write"
_VIEW = "email export print read report share"

# The personas of EFFECTIVE_RIGHTS (Projects User, Projects Manager, PMS Leadership stack) for the
# doctypes next_pms owns, whose rows come from the doctype JSON.
OWNED_EFFECTIVE_RIGHTS = {
    "PMS Growth Initiative": (
        {(0, 0): "create email export print read report share write", (1, 0): _VIEW},
        {(0, 0): _FULL, (1, 0): _VIEW},
        {(0, 0): _FULL, (1, 0): _VIEW},
    ),
    "PMS Growth Initiative Category": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "PMS Growth Initiative Status": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Project Status Update": (
        {(0, 0): "create delete read select share write"},
        {(0, 0): "create delete export read select share write"},
        {(0, 0): "create delete export read select share write"},
    ),
    "Project Status Update Template": (
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Project Status Update Template Category": (
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Project Time Report Frequency": (
        {(0, 0): _FULL},
        {(0, 0): _FULL},
        {(0, 0): _FULL},
    ),
    "Risk": (
        {(0, 0): "create email export print read report share write", (1, 0): _VIEW},
        {(0, 0): _FULL, (1, 0): _VIEW},
        {(0, 0): _FULL, (1, 0): _VIEW},
    ),
    "Risk Category": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Risk Level": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Risk Status": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Project Phase": (
        {},
        {(0, 0): _FULL},
        {(0, 0): _FULL},
    ),
    "Project Timeline Item": (
        {(0, 0): _FULL},
        {(0, 0): _FULL},
        {(0, 0): _FULL},
    ),
    "Project Timeline Item Category": (
        {(0, 0): "select"},
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT},
    ),
    "Technology": (
        {(0, 0): "read"},
        {(0, 0): _FULL},
        {(0, 0): _FULL},
    ),
    "Resource Allocation": (
        {(0, 0): _FULL_SELECT},
        {(0, 0): _FULL_SELECT, (2, 0): "delete email export print read report share write"},
        {(0, 0): _FULL_SELECT, (2, 0): "delete email export print read report share write"},
    ),
    "NextPMS Notifications": (
        {(0, 0): "email export print read report share write", (1, 0): _VIEW},
        {(0, 0): "email export print read report share write", (1, 0): _VIEW},
        {(0, 0): "email export print read report share write", (1, 0): _VIEW},
    ),
    "PMS View Setting": (
        {(0, 1): "create delete read write"},
        {(0, 1): "create delete read select write"},
        {(0, 1): "create delete read select write"},
    ),
    "PMS User Setting": (
        {(0, 1): "read write"},
        {(0, 1): "read write"},
        {(0, 1): "read write"},
    ),
    "PMS Project Update Subscription": (
        {},
        {(0, 0): "read report"},
        {(0, 0): "read report"},
    ),
    "Timesheet Settings": (
        {},
        {},
        {(0, 0): "email print read share write"},
    ),
    "Host": (
        {(0, 0): "read select"},
        {(0, 0): "read select"},
        {(0, 0): "read select write"},
    ),
}


STACKS = (PROJECTS_USER_STACK, PROJECTS_MANAGER_STACK, LEADERSHIP_STACK)


def _effective_rights(doctype: str, roles: tuple[str, ...]) -> dict[tuple[int, int], str]:
    granted: dict[tuple[int, int], set[str]] = {}
    table = "Custom DocPerm" if frappe.db.exists("Custom DocPerm", {"parent": doctype}) else "DocPerm"
    rows = frappe.get_all(
        table,
        filters={"parent": doctype, "role": ["in", [*roles, "All", "Desk User"]]},
        fields=["permlevel", "if_owner", *std_rights],
    )
    for row in rows:
        granted.setdefault((row.permlevel, row.if_owner), set()).update(right for right in std_rights if row[right])
    return {key: " ".join(sorted(rights)) for key, rights in sorted(granted.items())}


def _granted(rows: list[dict], role: str, permlevel: int, if_owner: int) -> set[str]:
    """Rights `role` already grants for rows at (permlevel, if_owner): an unrestricted row covers an owner-only one."""
    return {
        right
        for row in rows
        if row.role == role and row.permlevel == permlevel and row.if_owner in (0, if_owner)
        for right in std_rights
        if row[right]
    }


def _rows(doctype: str, **filters) -> list[dict]:
    return frappe.get_all(
        "Custom DocPerm",
        filters={"parent": doctype, **filters},
        fields=["role", "permlevel", "if_owner", "select", "read", "write", "create", "delete"],
        order_by="role, permlevel, if_owner",
    )


class TestApplyPermissions(IntegrationTestCase):
    def setUp(self):
        apply_permissions()

    def test_rows_from_the_map_are_written_once(self):
        for doctype, rules in PERMISSION_MAP.items():
            for rule in rules:
                if not frappe.db.exists("Role", rule.key.role):
                    continue
                rows = _rows(doctype, **rule.key._asdict())
                with self.subTest(doctype=doctype, key=rule.key):
                    self.assertEqual(len(rows), 1)
                    self.assertEqual(bool(rows[0].read), "read" in rule.rights)
                    self.assertEqual(bool(rows[0].write), "write" in rule.rights)

    def test_is_idempotent(self):
        before = {doctype: _rows(doctype) for doctype in PERMISSION_MAP}
        apply_permissions()
        self.assertEqual(before, {doctype: _rows(doctype) for doctype in PERMISSION_MAP})

    def test_erpnext_standard_rows_come_back_for_removed_pms_rows(self):
        for doctype in ("Project", "Customer"):
            with self.subTest(doctype=doctype):
                rows = _rows(doctype, role="Delivery Manager", permlevel=0)
                self.assertEqual(len(rows), 1)
                self.assertTrue(rows[0].select)
                self.assertFalse(rows[0].write)
        self.assertFalse(_rows("Project", role="Delivery Manager", permlevel=2))
        self.assertFalse(_rows("Project", role="Timesheet Manager"))

    def test_stacked_roles_keep_the_rights_each_persona_had_with_full_rows(self):
        for doctype, personas in EFFECTIVE_RIGHTS.items():
            for roles, expected in personas.items():
                with self.subTest(doctype=doctype, roles=roles):
                    self.assertEqual(_effective_rights(doctype, roles), expected)

    def test_manager_roles_only_list_what_the_role_below_lacks(self):
        self.assertFalse(_rows("Timesheet", role="PMS Leadership"))
        self.assertFalse(_rows("Task", role="PMS Leadership"))
        self.assertFalse(_rows("Customer", role="PMS Leadership"))
        self.assertFalse(_rows("Territory", role="Projects Manager"))
        self.assertFalse(_rows("Project", role="PMS Leadership", permlevel=1))
        self.assertFalse(_rows("Project", role="PMS Leadership", permlevel=2))
        [row] = _rows("Task", role="Projects Manager", permlevel=0)
        self.assertFalse(row.write)

    def test_territory_is_readable_below_leadership_and_editable_by_leadership(self):
        [row] = _rows("Territory", role="Projects User", permlevel=0)
        self.assertTrue(row.read)
        self.assertFalse(row.write)
        [row] = _rows("Territory", role="PMS Leadership", permlevel=0)
        self.assertTrue(row.read)
        self.assertTrue(row.write)

    def test_host_is_readable_below_leadership_and_editable_by_leadership(self):
        perms = {perm.role: perm for perm in frappe.get_meta("Host").permissions}
        self.assertTrue(perms["Projects User"].read)
        self.assertFalse(perms["Projects User"].write)
        self.assertNotIn("Projects Manager", perms)
        self.assertTrue(perms["PMS Leadership"].write)

    def test_projects_user_reads_the_report_generation_flag_but_cannot_edit_it(self):
        [row] = _rows("Project", role="Projects User", permlevel=3)
        self.assertTrue(row.read)
        self.assertFalse(row.write)

    def test_projects_user_reads_project_financials_but_cannot_edit_them(self):
        [row] = _rows("Project", role="Projects User", permlevel=2)
        self.assertTrue(row.read)
        self.assertFalse(row.write)

    def test_rows_of_other_roles_are_left_alone(self):
        frappe.db.delete("Custom DocPerm", {"parent": "Project", "role": "Accounts Manager", "permlevel": 1})
        frappe.get_doc(
            {
                "doctype": "Custom DocPerm",
                "parent": "Project",
                "parenttype": "DocType",
                "parentfield": "permissions",
                "role": "Accounts Manager",
                "permlevel": 1,
                "read": 1,
            }
        ).insert(ignore_permissions=True)
        apply_permissions()
        self.assertEqual(len(_rows("Project", role="Accounts Manager", permlevel=1)), 1)

    def test_employee_cannot_create_projects(self):
        rows = _rows("Project", role="Employee", permlevel=0, if_owner=1)
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0].create)

    def test_employee_can_delete_only_own_tasks(self):
        any_task = _rows("Task", role="Employee", permlevel=0, if_owner=0)
        own_task = _rows("Task", role="Employee", permlevel=0, if_owner=1)
        self.assertEqual(len(any_task), 1)
        self.assertEqual(len(own_task), 1)
        self.assertFalse(any_task[0].delete)
        self.assertTrue(own_task[0].delete)

    def test_owned_doctypes_keep_the_rights_each_stacked_persona_has(self):
        for doctype, expected in OWNED_EFFECTIVE_RIGHTS.items():
            for roles, rights in zip(STACKS, expected, strict=True):
                with self.subTest(doctype=doctype, roles=roles):
                    self.assertEqual(_effective_rights(doctype, roles), rights)

    def test_owned_doctypes_are_all_pinned(self):
        self.assertEqual(set(OWNED_EFFECTIVE_RIGHTS), set(OWNED_DOCTYPES))

    def test_owned_doctype_manager_rows_do_not_repeat_the_role_below(self):
        for doctype in OWNED_DOCTYPES:
            rows = frappe.get_all(
                "DocPerm", filters={"parent": doctype}, fields=["role", "permlevel", "if_owner", *std_rights]
            )
            for role, below in (
                ("Projects Manager", ("Projects User",)),
                ("PMS Leadership", ("Projects User", "Projects Manager")),
            ):
                has_higher_level = any(row.role == role and row.permlevel > 0 for row in rows)
                for row in (row for row in rows if row.role == role):
                    rights = {right for right in std_rights if row[right]}
                    repeated = rights & {
                        right for lower in below for right in _granted(rows, lower, row.permlevel, row.if_owner)
                    }
                    level_zero_anchor = has_higher_level and row.permlevel == 0 and rights == {"read"}
                    with self.subTest(doctype=doctype, role=role, permlevel=row.permlevel, if_owner=row.if_owner):
                        self.assertTrue(rights)
                        self.assertTrue(not repeated or level_zero_anchor, repeated)


class TestRoleProfiles(IntegrationTestCase):
    def setUp(self):
        for name in ROLE_PROFILES:
            frappe.delete_doc("Role Profile", name, force=True, ignore_missing=True, ignore_permissions=True)
        create_pms_role_profiles()

    def _roles(self, name: str) -> list[str]:
        return [row.role for row in frappe.get_doc("Role Profile", name).roles]

    def test_each_profile_has_exactly_its_roles(self):
        for name, roles in ROLE_PROFILES.items():
            with self.subTest(profile=name):
                self.assertCountEqual(self._roles(name), roles)

    def test_rerun_changes_nothing(self):
        modified = {name: frappe.db.get_value("Role Profile", name, "modified") for name in ROLE_PROFILES}
        create_pms_role_profiles()
        for name, roles in ROLE_PROFILES.items():
            with self.subTest(profile=name):
                self.assertCountEqual(self._roles(name), roles)
                self.assertEqual(frappe.db.get_value("Role Profile", name, "modified"), modified[name])

    def test_missing_role_is_restored_and_admin_added_role_kept(self):
        profile = frappe.get_doc("Role Profile", "PMS Project Manager")
        profile.roles = [row for row in profile.roles if row.role != "Projects User"]
        profile.append("roles", {"role": "Blogger"})
        profile.save(ignore_permissions=True)

        create_pms_role_profiles()

        self.assertCountEqual(self._roles("PMS Project Manager"), (*ROLE_PROFILES["PMS Project Manager"], "Blogger"))
