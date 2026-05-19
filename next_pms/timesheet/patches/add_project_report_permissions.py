import frappe
from frappe.permissions import add_permission, update_permission_property


def execute():
    # Delivery Manager — permlevel 3 read + write on Project, can enable report generation
    delivery_manager_exists = frappe.db.get_value(
        "Custom DocPerm",
        filters={"role": "Delivery Manager", "parent": "Project", "permlevel": 3},
    )
    if delivery_manager_exists is None:
        add_permission("Project", "Delivery Manager", 3)
    for perm_key, perm_val in {"read": 1, "write": 1, "export": 1}.items():
        update_permission_property("Project", "Delivery Manager", 3, perm_key, perm_val)

    # Projects Manager — permlevel 3 read only on Project, can generate report but cannot enable report generation
    projects_manager_exists = frappe.db.get_value(
        "Custom DocPerm",
        filters={"role": "Projects Manager", "parent": "Project", "permlevel": 3},
    )
    if projects_manager_exists is None:
        add_permission("Project", "Projects Manager", 3)
    for perm_key, perm_val in {"read": 1, "write": 0, "export": 1}.items():
        update_permission_property("Project", "Projects Manager", 3, perm_key, perm_val)
