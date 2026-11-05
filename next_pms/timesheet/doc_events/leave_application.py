# A change to any of these on a draft recomputes the stored balance
LEAVE_BALANCE_FIELDS = ("employee", "leave_type", "from_date", "to_date")


def before_validate(doc, method=None):
    # Before HRMS's validate, which reads leave_balance for its insufficient-balance message
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

    HRMS sets `leave_balance` only client-side (Desk form, mobile app), so API-created
    applications stayed at 0. Computed here with the Desk form's call for a new application or
    a draft whose employee, leave type or dates changed; other saves leave it as sent. A stored
    0 is filled on the next save while the application is Open. A failed lookup is logged and
    never blocks the save.
    """
    import frappe
    from hrms.hr.doctype.leave_application.leave_application import is_lwp

    # The saved state: submit() sets docstatus = 1 before this hook runs
    saved = None if doc.is_new() else doc.get_doc_before_save()
    if saved and saved.docstatus != 0:
        return
    if not all(doc.get(field) for field in LEAVE_BALANCE_FIELDS):
        return
    if saved and not any(doc.has_value_changed(field) for field in LEAVE_BALANCE_FIELDS):
        # Left as sent, like HRMS; a stored 0 is filled while the application is still Open
        if saved.leave_balance or doc.docstatus != 0 or doc.status != "Open":
            return
    if is_lwp(doc.leave_type):
        # No allocation; the Desk form shows 0 too
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
        # Drop the message a frappe.throw inside the lookup queued; the save goes through
        del frappe.local.message_log[messages_before:]
        if saved and doc.leave_balance == saved.leave_balance:
            # Belongs to the fields before this change
            doc.leave_balance = 0


def get_leave_balance_before(employee, leave_type, from_date, to_date, leave_application=None):
    """The Desk form's lookup; `leave_application` (HRMS >= v16.20) is passed only when accepted."""
    import inspect

    from hrms.hr.doctype.leave_application.leave_application import get_leave_balance_on

    kwargs = {"consider_all_leaves_in_the_allocation_period": True}
    if "leave_application" in inspect.signature(get_leave_balance_on).parameters:
        kwargs["leave_application"] = leave_application
    return get_leave_balance_on(employee, leave_type, from_date, to_date, **kwargs)
