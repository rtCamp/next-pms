import frappe
from frappe import _, throw
from frappe.utils import add_days, get_first_day, get_last_day, getdate, nowdate
from hrms.hr.utils import get_holiday_dates_for_employee

from timesheet_enhancer.api.utils import (
    get_employee_from_user,
    get_employee_working_hours,
    get_leaves_for_employee,
    get_week_dates,
)

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(employee: str, start_date=now, max_week: int = 4):
    """Get timesheet data for the given employee for the given number of weeks."""

    if not employee:
        employee = get_employee_from_user()
    if not frappe.db.exists("Employee", employee):
        throw(_("Employee not found."))

    hour_detail = get_employee_working_hours(employee)
    res = {**hour_detail}
    data = {}
    for i in range(max_week):
        current_week = True if start_date == now else False

        week_dates = get_week_dates(start_date, current_week=current_week)
        data[week_dates["key"]] = week_dates
        tasks, total_hours = get_timesheet(week_dates["dates"], employee)
        data[week_dates["key"]]["total_hours"] = total_hours
        data[week_dates["key"]]["tasks"] = tasks
        leaves = get_leaves_for_employee(
            week_dates["start_date"], week_dates["end_date"], employee
        )
        data[week_dates["key"]]["leaves"] = leaves
        data[week_dates["key"]]["holidays"] = get_holiday_dates_for_employee(
            employee, week_dates["start_date"], week_dates["end_date"]
        )
        data[week_dates["key"]]["status"] = get_timesheet_state(
            week_dates["dates"], employee
        )
        start_date = add_days(getdate(week_dates["start_date"]), -1)
    res["data"] = data
    return res


@frappe.whitelist()
def get_employee_holidays_and_leave_dates(employee: str):
    """Returns the list of holidays and leaves dates after combining for the given employee."""
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
    employee: str = None,
):
    """Updates/create time entry in Timesheet Detail child table."""
    if not employee:
        employee = get_employee_from_user()
    if is_update and not name:
        throw(_("Timesheet is required for update"))
    if is_update:
        update_timesheet_detail(name, parent, hours, description, task)
        return _("Timesheet updated successfully.")

    if not name and not task:
        throw(_("Task is required for new entry."))

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


@frappe.whitelist()
def delete(parent: str, name: str):
    """Delete single time entry from timesheet doctype."""
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if log.name == name:
            parent_doc.remove(log)
    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=True)
    else:
        parent_doc.save()
    return _("Timesheet deleted successfully.")


@frappe.whitelist()
def submit_for_approval(
    start_date: str, end_date: str, notes: str, employee: str = None
):
    if not employee:
        employee = get_employee_from_user()
    #  get the timesheet for whole week.
    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": 0,
        },
    )
    if not timesheets:
        throw(_("No timesheet found for the given week."))
    for timesheet in timesheets:
        doc = frappe.get_doc("Timesheet", timesheet["name"])
        doc.note = notes
        doc.custom_approval_status = "Approval Pending"
        doc.save()
    return _("Timesheet submitted for approval.")


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
    """Return the time entry from Timesheet Detail child table based on the list of dates and for the given employee.
    example:
        {
            "Task 1": {
                "name": "TS-00001",
                "data": [
                    {
                        "task": "Task 1",
                        "name": "TS-00001",
                        "hours": 8,
                        "description": "Task 1 description",
                        "from_time": "2021-08-01",
                        "to_time": "2021-08-01",
                    },
                    ...
                ]
            },
            ...
        }
    """
    data = {}
    total_hours = 0
    for date in dates:
        date = date
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
            if not log.task:
                continue
            subject, task_name, project_name = frappe.get_value(
                "Task", log.task, ["subject", "name", "project.project_name"]
            )
            if not subject:
                continue
            if subject not in data:
                data[subject] = {
                    "name": task_name,
                    "data": [],
                    "project_name": project_name,
                }

            data[subject]["data"].append(log.as_dict())
    return [data, total_hours]


def get_timesheet_state(dates: list, employee: str):

    res = "Not Submitted"
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "start_date": [">=", getdate(dates[0])],
            "end_date": ["<=", getdate(dates[-1])],
            "employee": employee,
        },
        fields=["custom_approval_status"],
    )
    if len(timesheets) == 0:
        return res
    approved = 0
    submitted = 0

    for timesheet in timesheets:
        state = timesheet.get("custom_approval_status")
        approved += 1 if state == "Approved" else 0
        submitted += 1 if state == "Approval Pending" else 0

    if approved == 0 and submitted == 0:
        return res
    if approved > submitted:
        res = "Approved"
    else:
        res = "Approval Pending"
    return res
