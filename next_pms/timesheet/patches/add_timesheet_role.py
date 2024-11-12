import frappe


def execute():
    add_role()


def add_role():
    roles = ["Timesheet Manager", "Timesheet User"]

    for role in roles:
        if not frappe.db.exists("Role", role):
            role = frappe.get_doc({"doctype": "Role", "role_name": role, "is_custom": 1})
            role.insert(ignore_permissions=True)
            frappe.db.commit()
            print(f"Role {role.role_name} created successfully.")
        else:
            print(f"Role {role} already exists.")
