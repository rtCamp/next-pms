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
