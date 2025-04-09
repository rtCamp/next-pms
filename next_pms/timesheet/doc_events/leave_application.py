def on_update(doc, mehod=None):
    flush_cache(doc)


def on_cancel(doc, method=None):
    flush_cache(doc)


def on_trash(doc, method=None):
    flush_cache(doc)


def flush_cache(doc):
    import frappe

    from next_pms.resource_management.api.utils.query import get_employee_leaves
    from next_pms.timesheet.utils.constant import EMP_TIMESHEET

    get_employee_leaves.clear_cache()

    frappe.cache().delete_keys(f"{EMP_TIMESHEET}::{doc.employee}")
