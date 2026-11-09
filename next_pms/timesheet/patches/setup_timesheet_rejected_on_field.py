import frappe
from frappe.query_builder.functions import Date

from next_pms.install import setup_timesheet_rejected_on_field


def execute():
    """Add Rejected On, date the drafts already sitting in Rejected from their last change so they
    get the correction window too, and store the window's default on sites that predate it."""
    setup_timesheet_rejected_on_field()

    timesheet = frappe.qb.DocType("Timesheet")
    (
        frappe.qb.update(timesheet)
        .set(timesheet.custom_rejected_on, Date(timesheet.modified))
        .where(timesheet.docstatus == 0)
        .where(timesheet.custom_approval_status == "Rejected")
        .where(timesheet.custom_rejected_on.isnull())
    ).run()

    if not frappe.db.exists(
        "Singles", {"doctype": "Timesheet Settings", "field": "allow_rejected_timesheet_edit_till"}
    ):
        frappe.db.set_single_value("Timesheet Settings", "allow_rejected_timesheet_edit_till", 3)
