import frappe
from frappe.utils import flt


def execute():
    """Park the hours of every draft time entry that carries a rejection reason, so work rejected
    before rejected_hours existed stops counting."""
    parents = frappe.get_all(
        "Timesheet Detail",
        filters={"docstatus": 0, "custom_rejection_reason": ["is", "set"], "hours": [">", 0]},
        pluck="parent",
        distinct=True,
    )
    for name in parents:
        doc = frappe.get_doc("Timesheet", name)
        for row in doc.time_logs:
            if row.custom_rejection_reason and flt(row.hours):
                row.rejected_hours = row.hours
                row.hours = 0
        doc.ignore_backdated_validation = True
        try:
            doc.save(ignore_permissions=True)
        except frappe.ValidationError:
            # A document that no longer passes its own validation is left as it was.
            frappe.log_error(title=f"Could not park rejected hours on {name}")
