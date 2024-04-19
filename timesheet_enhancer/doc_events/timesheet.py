def validate(doc, method=None):
    from frappe import _, throw
    from frappe.utils import add_days, getdate

    today = getdate()
    past_date = getdate(add_days(today, -3))
    for data in doc.get("time_logs"):
        fromtime = getdate(data.from_time)
        totime = getdate(data.to_time)
        if not past_date <= fromtime <= today:
            throw(_(f"You can't save time entry for {fromtime}"))
        if not past_date <= totime <= today:
            throw(_(f"You can't save time entry for {totime}"))
