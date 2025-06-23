import frappe
from frappe.utils import update_progress_bar


def execute():
    target_fieldnames = ["custom_region", "custom_type_of_work"]

    custom_fields = frappe.get_all(
        "Custom Field",
        filters={"dt": "Project", "fieldname": ["in", target_fieldnames], "module": "Next PMS"},
        pluck="name",
    )

    total = len(custom_fields)

    for i, custom_field_name in enumerate(custom_fields):
        update_progress_bar("Removing Custom Fields", i, total)
        frappe.delete_doc("Custom Field", custom_field_name, force=True)

    update_progress_bar("Removing Custom Fields", total, total)
