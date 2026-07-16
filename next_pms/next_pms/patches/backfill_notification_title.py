import frappe

# Title maps 1:1 to the linked doctype, so we can derive it for legacy rows.
NOTIFICATION_TITLES = {
    "Project": "Project health update",
    "Timesheet": "Timesheets to review",
    "Risk": "Risk update",
    "Customer Feedback": "Client feedback available",
}


def execute():
    """Backfill the title of existing notifications created before the field existed.

    The title maps 1:1 to the linked doctype, so we set it per doctype for any
    row whose title is still empty.
    """
    for linked_doctype, title in NOTIFICATION_TITLES.items():
        frappe.db.set_value(
            "NextPMS Notifications",
            {"linked_doctype": linked_doctype, "title": ["in", ["", None]]},
            "title",
            title,
            update_modified=False,
        )
