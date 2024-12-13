import frappe
from frappe.permissions import add_permission, update_permission_property


def execute():
    role_permissions = {
        "Projects Manager": {
            "0": {
                "if_owner": 0,
                "select": 1,
                "create": 1,
                "cancel": 1,
                "export": 1,
                "read": 1,
                "delete": 1,
                "write": 1,
                "print": 1,
                "import": 1,
                "share": 1,
            }
        },
        "Projects User": {
            "0": {
                "if_owner": 0,
                "select": 1,
                "create": 1,
                "cancel": 1,
                "export": 1,
                "read": 1,
                "delete": 1,
                "write": 1,
                "print": 1,
                "import": 1,
                "share": 1,
            }
        },
        "Employee ": {"0": {"read": 1}},
    }

    doctype_perm_list = {}
    for role, permissions in role_permissions.items():
        print("Updating permissions for: ", role)
        doctype_perm_list = {role: {"Resource Allocation": permissions}}
        add_permission_doctype_with_perm_level(doctype_perm_list)

    frappe.db.commit()


def add_permission_doctype_with_perm_level(doctype_perm_list):
    for role, role_data in doctype_perm_list.items():
        for doctype, permissions in role_data.items():
            # Update the property
            for perm_lvl, perms in permissions.items():
                permission_exists = frappe.db.get_value(
                    "Custom DocPerm",
                    filters={"role": role, "parent": doctype, "permlevel": perm_lvl},
                )

                if permission_exists is None:
                    add_permission(doctype, role, perm_lvl)

                for perm_key, Perm_val in perms.items():
                    update_permission_property(doctype, role, perm_lvl, perm_key, Perm_val)
