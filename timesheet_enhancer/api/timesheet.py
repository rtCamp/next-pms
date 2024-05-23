import frappe
from frappe import _, throw
from frappe.utils import add_days, get_first_day, get_last_day, getdate, nowdate

from timesheet_enhancer.api.utils import get_employee_from_user, get_leaves_for_employee

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(employee: str, start_date=now, max_week: int = 4):
    if not employee:
        employee = get_employee_from_user()
    data = {}
    for i in range(max_week):
        current_week = True if i == 0 else False

        week_dates = get_week_dates(employee, start_date, current_week=current_week)
        data[week_dates["key"]] = week_dates
        tasks, total_hours = get_timesheet(week_dates["dates"], employee)
        data[week_dates["key"]]["total_hours"] = total_hours
        data[week_dates["key"]]["tasks"] = tasks
        leaves = get_leaves_for_employee(
            week_dates["start_date"], week_dates["end_date"], employee
        )
        data[week_dates["key"]]["leaves"] = leaves
        start_date = week_dates["start_date"]

    return data


@frappe.whitelist()
def get_employee_holidays_and_leave_dates(employee: str):
    from hrms.hr.utils import get_holiday_dates_for_employee

    start_date = get_first_day(nowdate())
    end_date = get_last_day(nowdate())

    dates = get_holiday_dates_for_employee(employee, start_date, end_date)

    leave_applications = frappe.get_list(
        "Leave Application",
        filters={
            "employee": employee,
            "status": ["IN", ["Open", "Approved"]],
            "half_day": False,
        },
        fields=["from_date", "to_date"],
    )

    leaves_dates = []
    for entry in leave_applications:
        leaves_dates.append(entry["from_date"])
        leaves_dates.append(entry["to_date"])

    dates.extend(leaves_dates)
    return list(set(dates))


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
    employee = get_employee_from_user()
    if is_update and not name:
        throw(_("Timesheet name is required for update"))
    if is_update:
        update_timesheet_detail(name, parent, hours, description, task)
        return _("Timesheet updated successfully.")

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
            return _("Timesheet updated successfully.")
    create_timesheet_detail(date, hours, description, task, employee, parent)
    return _("New Timesheet created successfully.")


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
    total_hours = 0
    for element in dates:
        date = element["date"]
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
        total_hours += timesheet.total_hours
        for log in timesheet.time_logs:
            subject, task_name = frappe.get_value("Task", log.task, ["subject", "name"])
            if not subject:
                continue
            if subject not in data:
                data[subject] = {"name": task_name, "data": []}

            data[subject]["data"].append(log.as_dict())
    return [data, total_hours]


def get_week_dates(employee: str, date=now, current_week: bool = False):
    from hrms.hr.utils import get_holiday_dates_for_employee

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
    holidays = get_holiday_dates_for_employee(employee, start_date, end_date)
    while start_date <= end_date:
        if str(start_date) in holidays:
            dates.append({"date": start_date, "is_holiday": True})
        else:
            dates.append({"date": start_date, "is_holiday": False})
        start_date = add_days(start_date, 1)
    data["dates"] = dates
    return data
