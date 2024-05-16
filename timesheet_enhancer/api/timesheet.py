import frappe
from frappe import _, throw
from frappe.utils import add_days, getdate, nowdate

from timesheet_enhancer.api.utils import get_employee_from_user

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


@frappe.whitelist()
def save(
    date: str,
    description: str,
    task: str,
    name: str = None,
    hours: float = 0,
    parent: str = None,
    is_update: bool = False,
):
    if is_update and not name:
        throw(_("Timesheet name is required for update"))
    if is_update:
        update_timesheet_detail(name, parent, hours, description, task)
        return True

    if not is_update:
        employee = get_employee_from_user()
        parent = frappe.db.get_value(
            "Timesheet",
            {
                "employee": employee,
                "start_date": [">=", getdate(date)],
                "end_date": ["<=", getdate(date)],
            },
            "name",
        )
        if parent:
            existing_log = frappe.db.get_value(
                "Timesheet Detail", {"parent": parent, "task": task}, "name"
            )
            if existing_log:
                update_timesheet_detail(existing_log, parent, hours, description, task)
                return True
        create_timesheet_detail(date, hours, description, task, employee, parent)
        return True


def update_timesheet_detail(
    name: str, parent: str, hours: float, description: str, task: str
):
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if log.name != name:
            continue
        if log.task != task:
            throw(_("No matching task found for update."))
        log.hours = hours
        log.description = description
    parent_doc.save()


def create_timesheet_detail(
    date: str,
    hours: float,
    description: str,
    task: str,
    employee: str,
    parent: str = None,
):
    if not parent:
        timehseet = frappe.get_doc({"doctype": "Timesheet", "employee": employee})
    else:
        timehseet = frappe.get_doc("Timesheet", parent)
    timehseet.append(
        "time_logs",
        {
            "task": task,
            "hours": hours,
            "description": description,
            "from_time": date,
            "to_time": date,
        },
    )
    timehseet.save()


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
            subject, task_name = frappe.get_value("Task", log.task, ["subject", "name"])
            if not subject:
                continue
            if subject not in data:
                data[subject] = {"name": task_name, "data": []}

            data[subject]["data"].append(log.as_dict())
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
