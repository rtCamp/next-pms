import frappe
from frappe.permissions import std_rights
from frappe.tests import IntegrationTestCase

from next_pms.permissions.docperms import PERMISSION_MAP, apply_permissions

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


def _effective_rights(doctype: str, roles: tuple[str, ...]) -> dict[tuple[int, int], str]:
    granted: dict[tuple[int, int], set[str]] = {}
    rows = frappe.get_all(
        "Custom DocPerm",
        filters={"parent": doctype, "role": ["in", [*roles, "All", "Desk User"]]},
        fields=["permlevel", "if_owner", *std_rights],
    )
    for row in rows:
        granted.setdefault((row.permlevel, row.if_owner), set()).update(right for right in std_rights if row[right])
    return {key: " ".join(sorted(rights)) for key, rights in sorted(granted.items())}


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
        for role in ("Projects User", "Projects Manager"):
            self.assertTrue(perms[role].read, role)
            self.assertFalse(perms[role].write, role)
        self.assertTrue(perms["PMS Leadership"].read)
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
