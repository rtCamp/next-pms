# The fields the stored balance depends on; a change to any of them on a draft recomputes it,
# which is when the Desk form recomputes too
LEAVE_BALANCE_FIELDS = ("employee", "leave_type", "from_date", "to_date")


def before_validate(doc, method=None):
    # Before the controller's validate: HRMS's balance validation reads leave_balance for its
    # insufficient-balance message on leave types that allow a negative balance
    set_leave_balance(doc)


def on_update(doc, method=None):
    flush_cache(doc)
    publish_updates(doc)


def on_cancel(doc, method=None):
    flush_cache(doc)
    publish_updates(doc)


def on_trash(doc, method=None):
    flush_cache(doc)


def after_delete(doc, method=None):
    publish_updates(doc)


def publish_updates(doc):
    from frappe.utils import add_days, getdate

    from next_pms.timesheet.api.utils import get_week_dates
    from next_pms.timesheet.doc_events.timesheet import publish_timesheet_update

    week_starts = set()
    current, end = getdate(doc.from_date), getdate(doc.to_date)
    while current <= end:
        week_starts.add(get_week_dates(current)["start_date"])
        current = add_days(current, 7)
    week_starts.add(get_week_dates(end)["start_date"])

    for week_start in sorted(week_starts):
        publish_timesheet_update(doc.employee, week_start)


def flush_cache(doc):
    import frappe

    from next_pms.resource_management.api.utils.query import get_employee_leaves
    from next_pms.timesheet.utils.constant import EMP_TIMESHEET

    get_employee_leaves.clear_cache()

    frappe.cache().delete_keys(f"{EMP_TIMESHEET}::{doc.employee}")


def set_leave_balance(doc):
    """Store the balance before this application, whichever client filed it.

    HRMS keeps `leave_balance` ("Leave Balance Before Application") as a client-side field: the
    Desk form and the mobile app compute it with get_leave_balance_on and send it along, and the
    server never sets it. A Leave Application created through the API, which is what the
    add-leave forms do, stayed at 0, and so did the HR emails built from the document. Computing
    it here, with the same call and arguments as the Desk form, gives every client the same value.

    Recomputed only for a new application or a draft changed in one of the fields the balance
    depends on, so the value stays the balance at the time of application: the approver's save
    (workflow transition, submit) does not move it. A failed lookup is logged and never blocks the
    save; the field keeps whatever it had.
    """
    import frappe
    from hrms.hr.doctype.leave_application.leave_application import get_leave_balance_on, is_lwp

    # An existing application being submitted keeps its snapshot; a new one inserted already
    # submitted is still at its application time, and its ledger entry is only created after
    # validate
    if doc.docstatus != 0 and not doc.is_new():
        return
    if not all(doc.get(field) for field in LEAVE_BALANCE_FIELDS):
        return
    if not doc.is_new() and not any(doc.has_value_changed(field) for field in LEAVE_BALANCE_FIELDS):
        return
    if is_lwp(doc.leave_type):
        # No allocation to draw on; the Desk form shows 0 for these too
        doc.leave_balance = 0
        return
    messages_before = len(frappe.get_message_log())
    try:
        doc.leave_balance = get_leave_balance_on(
            doc.employee,
            doc.leave_type,
            doc.from_date,
            doc.to_date,
            consider_all_leaves_in_the_allocation_period=True,
            # Lets HRMS grant the lookup to a user who can read this application but not the
            # Employee, the same way its own balance validation does
            leave_application=None if doc.is_new() else doc.name,
        )
    except Exception:
        frappe.log_error(
            title=f"Could not store the leave balance on Leave Application {doc.name or '(new)'}",
            message=frappe.get_traceback(),
        )
        # A frappe.throw inside the lookup queued its message before raising; the save goes
        # through, so the client must not be shown it as an error
        del frappe.local.message_log[messages_before:]
