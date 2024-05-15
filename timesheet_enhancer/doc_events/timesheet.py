def validate(doc, method=None):
    pass
    # TODO: Will be implemented later
    # from frappe.utils import add_days, getdate

    # if not doc.get("time_logs"):
    #     return
    # today = getdate()
    # past_date = getdate(add_days(today, -3))

    # for data in doc.get("time_logs"):
    #     fromtime = getdate(data.from_time)
    #     totime = getdate(data.to_time)
    #     if not past_date <= fromtime <= today:
    #         throw(_(f"You can't save time entry for {fromtime}"))
    #     if not past_date <= totime <= today:
    #         throw(_(f"You can't save time entry for {totime}"))


def before_save(doc, method=None):
    from frappe.utils import get_datetime

    if not doc.get("time_logs"):
        return
    for key, data in enumerate(doc.get("time_logs")):
        from_time = get_datetime(data.from_time).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        to_time = get_datetime(data.to_time).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        doc.time_logs[key].from_time = from_time
        doc.time_logs[key].to_time = to_time
