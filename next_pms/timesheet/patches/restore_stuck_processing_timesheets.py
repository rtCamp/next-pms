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
        fields=["name", "employee", "start_date"],
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

    # Every parked day goes back to Approval Pending. Nothing on record identifies what a row
    # held before - parking used db.set_value, which writes no Version - and custom_rejection_reason
    # cannot stand in for it: submit_for_approval returns a rejected draft to Approval Pending
    # without clearing the reason, so a resubmitted day still carries a stale one. Approval Pending
    # is deterministic, and it is the status that puts the week back in front of the reviewer.
    for timesheet in stuck:
        frappe.db.set_value("Timesheet", timesheet.name, "custom_approval_status", "Approval Pending")

    # Rows in a partially stuck week disagree about the weekly status, so re-derive it per week
    # rather than per row - the same call the Timesheet's own on_update makes.
    weeks = {(row.employee, get_first_day_of_week(row.start_date)) for row in stuck + weekly_stuck}

    print(f"Restoring {len(stuck)} timesheet(s) stuck in Processing Timesheet across {len(weeks)} week(s).")
    for employee, start_date in sorted(weeks):
        update_weekly_status_of_timesheet(employee, start_date)
