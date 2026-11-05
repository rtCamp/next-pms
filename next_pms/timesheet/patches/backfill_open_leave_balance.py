"""Fill `leave_balance` on Open drafts filed before the server-side setter.

Stores the balance before the application as of now, what the Desk form would show the
approver. Decided applications are left alone: their value cannot be rebuilt once the ledger
has moved on.
"""

import frappe
from frappe.utils import flt, update_progress_bar


def execute():
    from next_pms.timesheet.doc_events.leave_application import get_leave_balance_before

    lwp_types = set(frappe.get_all("Leave Type", filters={"is_lwp": 1}, pluck="name"))
    rows = frappe.get_all(
        "Leave Application",
        filters={"docstatus": 0, "status": "Open", "leave_balance": 0},
        fields=["name", "employee", "leave_type", "from_date", "to_date"],
        order_by="from_date, name",
    )
    rows = [row for row in rows if row.leave_type not in lwp_types]

    for index, row in enumerate(rows):
        try:
            balance = flt(
                get_leave_balance_before(
                    row.employee, row.leave_type, row.from_date, row.to_date, leave_application=row.name
                )
            )
            if balance:
                frappe.db.set_value("Leave Application", row.name, "leave_balance", balance, update_modified=False)
        except Exception:
            frappe.log_error(
                title=f"Leave balance backfill failed for Leave Application {row.name}",
                message=frappe.get_traceback(),
            )
        update_progress_bar("Backfilling leave balance on open leave applications", index, len(rows))
