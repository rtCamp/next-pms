def execute():
    from frappe import get_all, get_doc

    timesheets = get_all("Timesheet", filters={"docstatus": 0})
    for timesheet in timesheets:
        ts = get_doc("Timesheet", timesheet.name)
        for data in ts.get("time_logs"):
            if data.hours == 0:
                ts.remove(data)
        if not ts.time_logs:
            ts.delete()
        else:
            ts.save()
