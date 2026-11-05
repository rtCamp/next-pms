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
    (workflow transition, submit) does not move it, and neither does the Desk form, which
    recomputes the field on a half-day toggle. A stored 0 is treated as missing and filled on the
    next save while the application is still open, never by the decision itself, the rule the
    backfill patch follows. A failed lookup is logged and never blocks the save.
    """
    import frappe
    from hrms.hr.doctype.leave_application.leave_application import is_lwp

    # The saved state, not the in-memory one: submit() sets docstatus = 1 before this hook runs,
    # and a draft changed and submitted in one request still needs the new balance. A new
    # application inserted already submitted is at its application time too, and its ledger
    # entry is only created after validate
    saved = None if doc.is_new() else doc.get_doc_before_save()
    if saved and saved.docstatus != 0:
        return
    if not all(doc.get(field) for field in LEAVE_BALANCE_FIELDS):
        return
    if saved and not any(doc.has_value_changed(field) for field in LEAVE_BALANCE_FIELDS):
        if saved.leave_balance or doc.docstatus != 0 or doc.status != "Open":
            doc.leave_balance = saved.leave_balance
            return
    if is_lwp(doc.leave_type):
        # No allocation to draw on; the Desk form shows 0 for these too
        doc.leave_balance = 0
        return
    messages_before = len(frappe.get_message_log())
    try:
        doc.leave_balance = get_leave_balance_before(
            doc.employee,
            doc.leave_type,
            doc.from_date,
            doc.to_date,
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
        if saved and doc.leave_balance == saved.leave_balance:
            # The value belongs to the fields before this change; leave it to be filled next time
            doc.leave_balance = 0


def get_leave_balance_before(employee, leave_type, from_date, to_date, leave_application=None):
    """The Desk form's balance lookup: every leave in the allocation period counts.

    `leave_application` lets HRMS grant the lookup to a user who can read this application but
    not the Employee, the way its own balance validation does. HRMS before v16.20 (still allowed
    by pyproject.toml and used by the e2e workflow) rejects the argument, so it is passed only
    when the installed version takes it.
    """
    import inspect

    from hrms.hr.doctype.leave_application.leave_application import get_leave_balance_on

    kwargs = {"consider_all_leaves_in_the_allocation_period": True}
    if "leave_application" in inspect.signature(get_leave_balance_on).parameters:
        kwargs["leave_application"] = leave_application
    return get_leave_balance_on(employee, leave_type, from_date, to_date, **kwargs)
