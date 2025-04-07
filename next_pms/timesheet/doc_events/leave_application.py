def before_save(doc, mehod=None):
    flush_cache(doc)


def flush_cache(doc):
    import frappe

    from next_pms.timesheet.utils.constant import EMP_TIMESHEET

    frappe.cache().hdel_keys(f"{EMP_TIMESHEET}::{doc.employee}")
