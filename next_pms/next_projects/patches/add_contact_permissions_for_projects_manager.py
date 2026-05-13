import frappe
from frappe.permissions import add_permission, update_permission_property


def execute():
    role = "Projects Manager"
    doctype = "Contact"
    permlevel = 0

    permissions = {
        "select": 1,
        "read": 1,
        "write": 1,
        "create": 1,
        "delete": 1,
        "print": 1,
        "email": 1,
        "report": 1,
        "import": 1,
        "export": 1,
        "share": 1,
    }

    permission_exists = frappe.db.get_value(
        "Custom DocPerm",
        filters={"role": role, "parent": doctype, "permlevel": permlevel},
    )

    if permission_exists is None:
        add_permission(doctype, role, permlevel)

    for perm_key, perm_val in permissions.items():
        update_permission_property(doctype, role, permlevel, perm_key, perm_val)

    frappe.db.commit()
