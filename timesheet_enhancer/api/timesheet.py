import frappe
from frappe.utils import add_days, getdate, nowdate

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(employee: str, start_date=now, max_week: int = 4):
    data = {}
    for i in range(max_week):
        current_week = True if i == 0 else False

        week_dates = get_week_dates(start_date, current_week=current_week)
        data[week_dates["key"]] = week_dates
        data[week_dates["key"]]["tasks"] = get_timesheet(week_dates["dates"], employee)
        start_date = week_dates["start_date"]

    return data


def get_timesheet(dates: list, employee: str):
    data = {}

    for date in dates:
        name = frappe.db.exists(
            "Timesheet",
            {
                "employee": str(employee),
                "start_date": getdate(date),
                "end_date": getdate(date),
            },
        )
        if not name:
            continue
        timesheet = frappe.get_doc("Timesheet", name)
        for log in timesheet.time_logs:
            subject = frappe.get_value("Task", log.task, "subject")
            if not subject:
                continue
            if subject not in data:
                data[subject] = []

            data[subject].append(log.as_dict())
    return data


def get_week_dates(date=now, current_week: bool = False):
    dates = []
    data = {}

    today = getdate(date)
    today_weekday = today.weekday()

    start_date = (
        add_days(today, -7) if not current_week else add_days(today, -today_weekday)
    )
    end_date = add_days(start_date, 6)

    key = (
        f'{start_date.strftime("%b %d")} - {end_date.strftime("%b %d")}'
        if not current_week
        else "This Week"
    )

    data = {"start_date": start_date, "end_date": end_date, "key": key}
    while start_date <= end_date:
        dates.append(start_date)
        start_date = add_days(start_date, 1)
    data["dates"] = dates
    return data
