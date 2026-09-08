import frappe
from frappe.utils import flt


def execute():
    """Park the hours of rows rejected before rejected_hours existed, so they stop counting.
    Only drafts still marked Rejected qualify: a resubmitted day keeps stale reasons on rows the
    employee has already corrected, and rows without a reason were logged after the rejection."""
    names = frappe.get_all("Timesheet", filters={"docstatus": 0, "custom_approval_status": "Rejected"}, pluck="name")
    for name in names:
        doc = frappe.get_doc("Timesheet", name)
        rejected_rows = [row for row in doc.time_logs if row.custom_rejection_reason and flt(row.hours)]
        if not rejected_rows:
            continue
        for row in rejected_rows:
            row.rejected_hours = row.hours
            row.hours = 0
        doc.ignore_backdated_validation = True
        try:
            doc.save(ignore_permissions=True)
        except frappe.ValidationError:
            # A document that no longer passes its own validation is left as it was.
            frappe.log_error(title=f"Could not park rejected hours on {name}")
