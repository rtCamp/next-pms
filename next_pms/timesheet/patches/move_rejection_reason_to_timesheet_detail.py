import frappe

from next_pms.install import setup_timesheet_rejection_reason_field


def execute():
    """Move rejection reasons from Timesheet to its Timesheet Detail rows.

    Creates the row-level custom field, stamps each parent's stored reason onto
    all of its rows, deletes the parent-level custom field, and re-anchors the
    weekly rejection reason field that used to sit after it.
    """
    setup_timesheet_rejection_reason_field()

    timesheets = frappe.get_all(
        "Timesheet",
        filters={"custom_rejection_reason": ["is", "set"], "docstatus": ["!=", 2]},
        fields=["name", "custom_rejection_reason"],
    )
    for timesheet in timesheets:
        frappe.db.set_value(
            "Timesheet Detail",
            {"parent": timesheet.name},
            "custom_rejection_reason",
            timesheet.custom_rejection_reason,
            update_modified=False,
        )

    parent_field = frappe.db.get_value("Custom Field", {"dt": "Timesheet", "fieldname": "custom_rejection_reason"})
    if parent_field:
        frappe.delete_doc("Custom Field", parent_field, force=True)

    frappe.db.set_value(
        "Custom Field",
        {"dt": "Timesheet", "fieldname": "custom_weekly_rejection_reason"},
        "insert_after",
        "note",
    )
    frappe.clear_cache(doctype="Timesheet")
    frappe.clear_cache(doctype="Timesheet Detail")
