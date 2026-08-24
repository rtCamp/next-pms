import frappe
from frappe.utils import get_first_day_of_week

from next_pms.timesheet.api.utils import update_weekly_status_of_timesheet


def execute():
    """Free timesheets left in "Processing Timesheet" by an approval job that never finished.

    The approval API used to park every selected day in that status and commit before enqueueing
    the job that does the work. A job that then died - on the backdated-entry check, on a queue
    timeout, on a worker restart - rolled back its own writes but not that parking commit, so the
    week kept a status the UI renders read-only and neither the reviewer nor the employee could
    touch it again (#2075).

    The API now refuses such a week up front and the job restores what it parked, so this only
    has to clear what is already on record. Forward-only: it repairs the rows that are stuck
    right now and reconstructs nothing else.
    """
    stuck = frappe.get_all(
        "Timesheet",
        filters={"custom_approval_status": "Processing Timesheet", "docstatus": 0},
        fields=["name", "employee", "start_date", "custom_rejection_reason"],
        order_by="employee, start_date",
    )

    # A week can also be left with only its weekly field parked - the day statuses of an
    # untouched day are fine, but the week still reads as processing.
    weekly_stuck = frappe.get_all(
        "Timesheet",
        filters={"custom_weekly_approval_status": "Processing Timesheet", "docstatus": 0},
        fields=["employee", "start_date"],
    )

    if not stuck and not weekly_stuck:
        return

    for timesheet in stuck:
        # Parking never wrote custom_rejection_reason - only a rejection that committed does -
        # so a stuck row still carrying one was Rejected before the job took it. Everything else
        # goes back to Approval Pending: the status a day must have held to be actionable, and
        # the one that puts the week back in front of the reviewer.
        status = "Rejected" if (timesheet.custom_rejection_reason or "").strip() else "Approval Pending"
        frappe.db.set_value("Timesheet", timesheet.name, "custom_approval_status", status)

    # Rows in a partially stuck week disagree about the weekly status, so re-derive it per week
    # rather than per row - the same call the Timesheet's own on_update makes.
    weeks = {(row.employee, get_first_day_of_week(row.start_date)) for row in stuck + weekly_stuck}

    print(f"Restoring {len(stuck)} timesheet(s) stuck in Processing Timesheet across {len(weeks)} week(s).")
    for employee, start_date in sorted(weeks):
        update_weekly_status_of_timesheet(employee, start_date)
