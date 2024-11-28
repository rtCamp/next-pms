import frappe
from frappe import _, throw
from frappe.utils import (
    add_days,
    get_first_day_of_week,
    get_last_day_of_week,
    getdate,
    nowdate,
)

from .employee import get_employee_daily_working_norm, get_employee_from_user, get_employee_working_hours
from .utils import (
    get_holidays,
    get_leaves_for_employee,
    get_week_dates,
    is_timesheet_manager,
    is_timesheet_user,
)

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(employee: str, start_date=now, max_week: int = 4):
    """Get timesheet data for the given employee for the given number of weeks."""
    user_roles = frappe.get_roles()

    if not employee:
        employee = get_employee_from_user()
    if frappe.session.user != "Administrator":
        if not frappe.has_permission("Employee", "read", employee) and (
            "Timesheet Manager" not in user_roles and "Timesheet User" not in user_roles
        ):
            throw(
                _("You don't have permission to access this employee's timesheet."),
                frappe.PermissionError,
            )

    def generate_week_data(start_date, max_week, employee=None, leaves=None, holidays=None):
        data = {}
        daily_norm = get_employee_daily_working_norm(employee)
        for i in range(max_week):
            week_dates = get_week_dates(start_date)
            week_key = week_dates["key"]
            tasks, total_hours, status = {}, 0, "Not Submitted"
            if employee:
                holiday_dates = [holiday["holiday_date"] for holiday in holidays] if holidays else []
                tasks, total_hours = get_timesheet(week_dates["dates"], employee)
                status = get_timesheet_state(
                    start_date=week_dates["dates"][0],
                    end_date=week_dates["dates"][-1],
                    employee=employee,
                )
                leave_total = 0
                week_leaves = [
                    leave
                    for leave in leaves
                    if leave["from_date"] <= week_dates["dates"][-1] and leave["to_date"] >= week_dates["dates"][0]
                ]
                for leave in week_leaves:
                    if leave["half_day"]:
                        leave_total += daily_norm / 2
                    else:
                        num_days = 0
                        for date in week_dates["dates"]:
                            if date not in holiday_dates and leave["from_date"] <= date <= leave["to_date"]:
                                num_days += 1
                        leave_total += daily_norm * num_days

                if daily_norm * 5 == leave_total:
                    status = "Approved"
            data[week_key] = {
                **week_dates,
                "total_hours": total_hours,
                "tasks": tasks,
                "status": status,
            }
            start_date = add_days(getdate(week_dates["start_date"]), -1)
        return data

    hour_detail = get_employee_working_hours(employee)
    res = {**hour_detail}

    if not employee and frappe.session.user == "Administrator":
        res["data"] = generate_week_data(start_date, max_week)
        res["holidays"] = []
        res["leaves"] = []
        return res

    if not frappe.db.exists("Employee", employee):
        throw(_("No employee found for current user."), frappe.DoesNotExistError)

    holidays = get_holidays(
        employee,
        add_days(start_date, -max_week * 7),
        add_days(start_date, max_week * 7),
    )

    leaves = get_leaves_for_employee(
        add_days(start_date, -max_week * 7),
        add_days(start_date, max_week * 7),
        employee,
    )
    res["leaves"] = leaves
    res["holidays"] = holidays
    res["data"] = generate_week_data(start_date, max_week, employee, leaves, holidays)
    return res


@frappe.whitelist()
def save(date: str, description: str, task: str, hours: float = 0, employee: str = None):
    """create time entry in Timesheet Detail child table."""
    if not employee:
        employee = get_employee_from_user()
    if not task:
        throw(_("Task is mandatory."), frappe.MandatoryError)

    project = frappe.get_value("Task", task, "project")

    parent = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", getdate(date)],
            "end_date": ["<=", getdate(date)],
            "parent_project": project,
            "docstatus": ["!=", 2],
        },
        "name",
    )
    create_timesheet_detail(date, hours, description, task, employee, parent)
    return _("New Timesheet created successfully.")


@frappe.whitelist()
def delete(parent: str, name: str):
    """Delete single time entry from timesheet doctype."""
    parent_doc = frappe.get_doc("Timesheet", parent)
    parent_doc.flags.ignore_permissions = is_timesheet_manager()
    for log in parent_doc.time_logs:
        if log.name == name:
            parent_doc.remove(log)
    if not parent_doc.time_logs:
        parent_doc.delete()
    else:
        parent_doc.save()
    return _("Time entry deleted successfully.")


@frappe.whitelist()
def submit_for_approval(start_date: str, notes: str = None, employee: str = None):
    from next_pms.timesheet.tasks.reminder_on_approval_request import (
        send_approval_reminder,
    )

    from .utils import update_weekly_status_of_timesheet

    if not employee:
        employee = get_employee_from_user()
    reporting_manager = frappe.get_value("Employee", employee, "reports_to")

    if not reporting_manager:
        throw(_("Reporting Manager not found for the employee."))
    reporting_manager_name = frappe.get_value("Employee", reporting_manager, "employee_name")

    start_date = get_first_day_of_week(start_date)
    end_date = get_last_day_of_week(start_date)

    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": 0,
        },
        ignore_permissions=is_timesheet_manager(),
    )
    if not timesheets:
        throw(_("No timesheet found for the given week."))

    for timesheet in timesheets:
        frappe.db.set_value("Timesheet", timesheet.name, "custom_approval_status", "Approval Pending")
    update_weekly_status_of_timesheet(employee, start_date)
    send_approval_reminder(employee, reporting_manager, start_date, end_date, notes)
    return f"Timesheet has been sent for Approval to {reporting_manager_name}."


@frappe.whitelist()
def update_timesheet_detail(
    name: str,
    parent: str,
    hours: float,
    description: str,
    task: str,
    date: str | None = None,
    is_billable: bool = False,
):
    parent_doc = frappe.get_doc("Timesheet", parent)
    parent_doc.flags.ignore_permissions = is_timesheet_manager()
    for log in parent_doc.time_logs:
        if not name:
            continue
        if log.name == name:
            log.hours = hours
            log.description = description
            log.is_billable = is_billable
    if not name:
        parent_doc.append(
            "time_logs",
            {
                "task": task,
                "hours": hours,
                "description": description,
                "from_time": getdate(date),
                "to_time": getdate(date),
                "project": frappe.get_value("Task", task, "project"),
                "is_billable": is_billable,
            },
        )
    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=True)
    else:
        parent_doc.save()
        parent_doc.reload()

        if parent_doc.total_hours == 0:
            parent_doc.delete(ignore_permissions=True)

    return _("Time entry updated successfully.")


def create_timesheet_detail(
    date: str,
    hours: float,
    description: str,
    task: str,
    employee: str,
    parent: str | None = None,
):
    if parent:
        timesheet = frappe.get_doc("Timesheet", parent)
    else:
        timesheet = frappe.get_doc({"doctype": "Timesheet", "employee": employee})

    project, custom_is_billable = frappe.get_value("Task", task, ["project", "custom_is_billable"])

    timesheet.update({"parent_project": project})
    timesheet.append(
        "time_logs",
        {
            "task": task,
            "hours": hours,
            "description": description,
            "from_time": getdate(date),
            "to_time": getdate(date),
            "project": project,
            "is_billable": custom_is_billable,
        },
    )
    timesheet.flags.ignore_permissions = is_timesheet_manager()
    timesheet.save()


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
    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": ["in", dates],
            "docstatus": ["!=", 2],
        },
        ignore_permissions=is_timesheet_user() or is_timesheet_manager(),
    )
    if not timesheets:
        return [data, total_hours]

    timesheet_docs = [frappe.get_doc("Timesheet", ts.name) for ts in timesheets]
    task_ids = [log.task for ts in timesheet_docs for log in ts.time_logs if log.task]
    task_details = frappe.get_all(
        "Task",
        filters={"name": ["in", task_ids]},
        fields=[
            "name",
            "subject",
            "project.project_name as project_name",
            "project",
            "custom_is_billable",
            "expected_time",
            "actual_time",
            "status",
        ],
    )
    task_details_dict = {task["name"]: task for task in task_details}
    for timesheet in timesheet_docs:
        total_hours += timesheet.total_hours
        for log in timesheet.time_logs:
            if not log.task:
                continue
            task = task_details_dict.get(log.task)
            if not task:
                continue
            task_name = task["name"]
            if task_name not in data:
                data[task_name] = {
                    "name": task_name,
                    "subject": task["subject"],
                    "data": [],
                    "is_billable": task["custom_is_billable"],
                    "project_name": task["project_name"],
                    "project": task["project"],
                    "expected_time": task["expected_time"],
                    "actual_time": task["actual_time"],
                    "status": task["status"],
                }
            data[task_name]["data"].append(log.as_dict())

    return [data, total_hours]


def get_timesheet_state(employee: str, start_date: str, end_date: str):
    statuses = frappe.db.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", getdate(start_date)],
            "end_date": ["<=", getdate(end_date)],
        },
        "custom_weekly_approval_status",
    )
    for status in statuses:
        if status.custom_weekly_approval_status:
            return status.custom_weekly_approval_status
    return "Not Submitted"


@frappe.whitelist()
def get_remaining_hour_for_employee(employee: str, date: str):
    """Return the working hours for the given employee on the given date."""
    from .employee import get_employee_working_hours

    working_hours = get_employee_working_hours(employee)
    if not working_hours.get("working_frequency") == "Per Day":
        working_hours.update({"working_hour": working_hours.get("working_hour") / 5})

    date = getdate(date)
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": date,
            "end_date": date,
        },
        fields=["total_hours"],
    )
    total_hours = 0
    for timesheet in timesheets:
        total_hours += timesheet.total_hours

    leaves = get_leaves_for_employee(
        add_days(date, -4 * 7),
        add_days(date, 4 * 7),
        employee,
    )
    data = [leave for leave in leaves if leave.get("from_date") <= date <= leave.get("to_date")]

    if data:
        for d in data:
            if d.get("half_day") and d.get("half_day_date") == date:
                total_hours += working_hours.get("working_hour") / 2
            else:
                total_hours += working_hours.get("working_hour")
    return working_hours.get("working_hour") - total_hours


@frappe.whitelist()
def get_timesheet_details(date: str, task: str, employee: str):
    logs = frappe.get_list(
        "Timesheet",
        fields=[
            "time_logs.name",
            "time_logs.hours",
            "time_logs.description",
            "time_logs.task",
            "time_logs.from_time as date",
            "time_logs.parent",
            "time_logs.is_billable",
        ],
        filters={
            "start_date": ["=", getdate(date)],
            "employee": employee,
        },
        ignore_permissions=is_timesheet_user() or is_timesheet_manager(),
    )
    logs = [log for log in logs if log["task"] == task]
    subject, project_name = frappe.get_value("Task", task, ["subject", "project.project_name"])

    return {
        "task": subject,
        "project": project_name,
        "data": logs,
    }


@frappe.whitelist()
def bulk_update_timesheet_detail(data):
    for entry in data:
        if isinstance(entry, str):
            entry = frappe.parse_json(entry)
        update_timesheet_detail(
            entry.get("name"),
            entry.get("parent"),
            entry.get("hours"),
            entry.get("description"),
            entry.get("task"),
            entry.get("date"),
            entry.get("is_billable"),
        )
    return _("Time entry updated successfully.")
