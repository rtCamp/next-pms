import frappe

FIELDS_TO_REMOVE = ("custom_costing__billing", "custom_project_details")


def execute():
    """Drop redundant custom Project Tab Breaks ('Costing & Billing', 'Project Tracking')."""
    removed = []
    for fieldname in FIELDS_TO_REMOVE:
        cf_name = frappe.db.get_value(
            "Custom Field",
            {"dt": "Project", "fieldname": fieldname},
            "name",
        )
        if not cf_name:
            continue
        frappe.delete_doc("Custom Field", cf_name, force=True, ignore_permissions=True)
        removed.append(fieldname)
    if not removed:
        return
    frappe.db.commit()
    frappe.clear_cache(doctype="Project")
    print(f"Removed {len(removed)} redundant Project Tab Break(s): {', '.join(removed)}")
