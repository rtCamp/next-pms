import frappe
from frappe import _, throw
from frappe.utils import (
    add_days,
    get_first_day_of_week,
    get_last_day_of_week,
    getdate,
    nowdate,
)

from next_pms.api.utils import error_logger
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.utils.constant import EMP_TIMESHEET

from .employee import (
    get_employee_daily_working_norm,
    get_employee_from_user,
    get_employee_working_hours,
    validate_current_employee,
)
from .utils import (
    apply_role_permission_for_doctype,
    employee_has_higher_access,
    get_holidays,
    get_week_dates,
    has_write_access,
)


@frappe.whitelist()
@error_logger
def get_timesheet_data(employee: str, start_date=None, max_week: int = 4):
    """Get timesheet data for the given employee for the given number of weeks."""
    if not employee:
        employee = get_employee_from_user(throw_exception=frappe.session.user != "Administrator")
    if not start_date:
        start_date = nowdate()
    apply_role_permission_for_doctype(["Timesheet User", "Timesheet Manager"], "Employee", "read", employee)

    def generate_week_data(start_date, max_week, employee=None, leaves=None, holidays=None):
        data = {}
        daily_norm = get_employee_daily_working_norm(employee)

        cache_key = f"{EMP_TIMESHEET}::{employee}"
        for i in range(max_week):
            week_dates = get_week_dates(start_date)
            week_key = week_dates["key"]

            week_cache_key = f"{week_dates['start_date']}::{week_dates['end_date']}"
            week_data = frappe.cache().hget(cache_key, week_cache_key)

            if week_data:
                start_date = add_days(getdate(week_dates["start_date"]), -1)
                data[week_key] = week_data
                continue

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
            frappe.cache().hset(cache_key, week_cache_key, data[week_key])
            start_date = add_days(getdate(week_dates["start_date"]), -1)
        return data

    hour_detail = get_employee_working_hours(employee)
    res = {**hour_detail}

    if not employee and frappe.session.user == "Administrator":
        res["data"] = generate_week_data(start_date, max_week)
        res["holidays"] = []
        res["leaves"] = []
        return res

    holidays = get_holidays(
        employee,
        add_days(start_date, -max_week * 7),
        add_days(start_date, max_week * 7),
    )

    leaves = get_employee_leaves(
        start_date=add_days(start_date, -max_week * 7),
        end_date=add_days(start_date, max_week * 7),
        employee=employee,
    )
    res["leaves"] = leaves
    res["holidays"] = holidays
    res["data"] = generate_week_data(start_date, max_week, employee, leaves, holidays)
    return res


@frappe.whitelist()
@error_logger
def save(date: str, description: str, task: str, hours: float = 0, employee: str = None):
    """create time entry in Timesheet Detail child table."""
    if not employee:
        employee = get_employee_from_user()
    if not task:
        throw(_("Task is mandatory for creating time entry."), frappe.MandatoryError)

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
    ignore_permissions = employee_has_higher_access(employee, ptype="write")
    timesheet.save(ignore_permissions=ignore_permissions)
    return _("New Timesheet created successfully.")


@frappe.whitelist()
@error_logger
def delete(parent: str, name: str):
    """Delete single time entry from timesheet doctype."""
    employee = get_employee_from_user()
    ignore_permissions = employee_has_higher_access(employee, ptype="write")
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if log.name == name:
            parent_doc.remove(log)
    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=ignore_permissions)
    else:
        parent_doc.save(ignore_permissions=ignore_permissions)
    return _("Time entry deleted successfully.")


@frappe.whitelist()
@error_logger
def submit_for_approval(start_date: str, notes: str = None, employee: str = None, approver: str = None):
    from next_pms.timesheet.doc_events.timesheet import flush_cache, publish_timesheet_update
    from next_pms.timesheet.tasks.reminder_on_approval_request import (
        send_approval_reminder,
    )

    if not employee:
        employee = get_employee_from_user()
    if not approver:
        reporting_manager = frappe.get_value("Employee", employee, "reports_to")
        if not reporting_manager:
            throw(_("Reporting Manager is not set for the employee."))
    else:
        reporting_manager = approver

    if not frappe.db.exists("Employee", reporting_manager):
        throw(_("Reporting Manager does not exist."), frappe.DoesNotExistError)
    reporting_manager_name = frappe.get_value("Employee", reporting_manager, "employee_name")

    start_date = get_first_day_of_week(start_date)
    end_date = get_last_day_of_week(start_date)

    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": ["!=", 2],
        },
        fields=["name", "docstatus"],
        ignore_permissions=employee_has_higher_access(employee, ptype="read"),
    )
    if not timesheets:
        throw(_("No timesheet found for the given week."), frappe.DoesNotExistError)

    draft_timesheets = [ts for ts in timesheets if ts.docstatus == 0]
    for timesheet in draft_timesheets:
        frappe.db.set_value("Timesheet", timesheet.name, "custom_approval_status", "Approval Pending")

    for timesheet in timesheets:
        frappe.db.set_value(
            "Timesheet",
            timesheet.name,
            "custom_weekly_approval_status",
            "Approval Pending",
        )
    frappe.db.commit()  # nosemgrep Need to do as we need to publish status changes.

    doc = frappe._dict({"employee": employee, "start_date": start_date, "end_date": end_date})
    flush_cache(doc)
    publish_timesheet_update(employee=employee, start_date=start_date)

    send_approval_reminder(employee, reporting_manager, start_date, end_date, notes)

    return _("Timesheet has been sent for Approval to {0}.").format(reporting_manager_name)


@frappe.whitelist()
def update_timesheet_detail(
    name: str,
    parent: str,
    hours: float,
    description: str,
    task: str,
    date: str | None = None,
    is_billable: bool | None = None,
):
    parent_doc = frappe.get_doc("Timesheet", parent)
    ignore_permissions = employee_has_higher_access(parent_doc.employee, ptype="write")
    logs_to_remove = []
    new_logs = []
    task_project = frappe.get_value("Task", task, "project")

    for log in parent_doc.time_logs:
        if not name or log.name != name:
            continue

        if task_project and task_project != parent_doc.parent_project:
            logs_to_remove.append(log)
            new_logs.append(
                {
                    "task": task,
                    "hours": hours,
                    "description": description,
                    "date": date,
                    "employee": parent_doc.employee,
                }
            )
            continue

        log.hours = hours
        log.description = description
        log.task = task
        # Only update value of billable if user has write access
        if has_write_access() and is_billable is not None:
            log.is_billable = is_billable
        if getdate(log.from_time) != getdate(date):
            logs_to_remove.append(log)
            new_logs.append(
                {
                    "task": task,
                    "hours": hours,
                    "description": description,
                    "date": date,
                    "employee": parent_doc.employee,
                }
            )

    for log in logs_to_remove:
        parent_doc.time_logs.remove(log)

    if not name:
        if parent_doc.start_date <= getdate(date) <= parent_doc.end_date:
            log = {
                "task": task,
                "hours": hours,
                "description": description,
                "from_time": getdate(date),
                "to_time": getdate(date),
                "project": task_project,
            }
            if has_write_access() and is_billable is not None:
                log["is_billable"] = is_billable
            else:
                log["is_billable"] = frappe.get_value("Task", task, "custom_is_billable")

            parent_doc.append("time_logs", log)
        else:
            new_logs.append(
                {
                    "task": task,
                    "hours": hours,
                    "description": description,
                    "date": date,
                    "employee": parent_doc.employee,
                }
            )

    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=ignore_permissions)
    else:
        parent_doc.save(ignore_permissions=ignore_permissions)

    if new_logs:
        for log in new_logs:
            save(**log)
    return _("Time entry updated successfully.")


def get_timesheet(dates: list, employee: str):
    from next_pms.timesheet.utils.constant import ALLOWED_TIMESHET_DETAIL_FIELDS

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

    # Get parent timesheet names first
    timesheet_names = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": ["in", dates],
            "docstatus": ["!=", 2],
        },
        pluck="name",
        ignore_permissions=employee_has_higher_access(employee, ptype="read"),
    )

    if not timesheet_names:
        return [data, total_hours]

    # Fetch all timesheet detail records with needed fields in one query
    timesheet_logs = frappe.get_all(
        "Timesheet Detail",
        filters={
            "parent": ["in", timesheet_names],
        },
        fields=ALLOWED_TIMESHET_DETAIL_FIELDS,
    )

    if not timesheet_logs:
        return [data, total_hours]

    task_ids = [ts.get("task") for ts in timesheet_logs if ts.get("task")]
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
            "_liked_by",
        ],
    )
    task_details_dict = {task["name"]: task for task in task_details}
    for log in timesheet_logs:
        total_hours += log.get("hours", 0)
        if not log.get("task"):
            continue
        task = task_details_dict.get(log.get("task"))
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
                "_liked_by": task["_liked_by"],
            }

        data[task_name]["data"].append({field: log.get(field) for field in ALLOWED_TIMESHET_DETAIL_FIELDS})

    return [data, total_hours]


@validate_current_employee(ptype="read")
def get_timesheet_state(employee: str, start_date: str, end_date: str):
    status = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", getdate(start_date)],
            "end_date": ["<=", getdate(end_date)],
            "docstatus": ["!=", 2],
        },
        "custom_weekly_approval_status",
    )
    if status:
        return status
    return "Not Submitted"


@frappe.whitelist()
@validate_current_employee(ptype="write")
def get_remaining_hour_for_employee(employee: str, date: str):
    """Return the working hours for the given employee on the given date."""
    from .employee import get_employee_working_hours

    working_hours = get_employee_working_hours(employee)
    if not working_hours.get("working_frequency") == "Per Day":
        working_hours.update({"working_hour": working_hours.get("working_hour") / 5})

    date = getdate(date)
    timesheet_hours = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": date,
            "end_date": date,
            "docstatus": ["!=", 2],
        },
        pluck="total_hours",
    )
    total_hours = sum(timesheet_hours)

    leaves = get_employee_leaves(
        start_date=add_days(date, -4 * 7),
        end_date=add_days(date, 4 * 7),
        employee=employee,
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
@validate_current_employee(ptype="read")
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
            "docstatus": ["=", 0],
        },
        ignore_permissions=employee_has_higher_access(employee, ptype="read"),
    )
    logs = [log for log in logs if log["task"] == task]
    subject, project_name = frappe.get_value("Task", task, ["subject", "project.project_name"])

    return {
        "task": subject,
        "project": project_name,
        "data": logs,
    }


@frappe.whitelist()
@error_logger
def bulk_update_timesheet_detail(data):
    for entry in data:
        if isinstance(entry, str):
            entry = frappe.parse_json(entry)
        update_timesheet_detail(**entry)
    return _("Time entries updated successfully.")


@frappe.whitelist()
def bulk_save(timesheet_entries):
    """
    Create multiple time entries in Timesheet Detail child table.

    :param timesheet_entries: List of dictionaries containing timesheet entry details
    Each dictionary should have keys:
    - date (str, mandatory)
    - description (str, mandatory)
    - task (str, mandatory)
    - hours (float, optional, default=0)
    - employee (str, optional)

    """
    if not isinstance(timesheet_entries, list):
        throw(_("Input must be a list of timesheet entries."), frappe.ValidationError)

    for entry in timesheet_entries:
        date = entry.get("date")
        description = entry.get("description")
        task = entry.get("task")
        hours = entry.get("hours", 0)
        employee = entry.get("employee")

        save(
            date=date,
            description=description,
            task=task,
            hours=hours,
            employee=employee,
        )

    return _("Event Timesheet created successfully.")
