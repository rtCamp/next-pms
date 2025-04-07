def on_update(doc, method):
    flush_cache(doc)


def flush_cache(doc):
    import frappe

    from next_pms.timesheet.utils.constant import EMP_WOKING_DETAILS

    if doc.has_value_changed("custom_working_hours") or doc.has_value_changed("custom_work_schedule"):
        frappe.cache().hdel(EMP_WOKING_DETAILS, doc.name)
