import json

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
from next_pms.timesheet.utils.constant import ALLOWED_FILTER_FIELDS, EMP_TIMESHEET, FILTER_LOOKBACK_WEEKS

from .employee import (
    get_employee_daily_working_norm,
    get_employee_from_user,
    get_employee_working_hours,
    validate_current_employee,
)
from .utils import (
    apply_role_permission_for_doctype,
    build_filters,
    employee_has_higher_access,
    get_holidays,
    get_week_dates,
    has_write_access,
    parse_filters,
)


def _apply_qb_condition(query, doctype_ref, field_name, operator, value):
    """Apply a single desk-style filter condition to a query builder query."""
    field = getattr(doctype_ref, field_name)
    op = operator.lower().strip()

    if op == "=":
        return query.where(field == value)
    elif op == "!=":
        return query.where(field != value)
    elif op == "like":
        return query.where(field.like(value))
    elif op == "not like":
        return query.where(field.not_like(value))
    elif op == "in":
        return query.where(field.isin(value if isinstance(value, (list, tuple)) else [value]))
    elif op == "not in":
        return query.where(field.notin(value if isinstance(value, (list, tuple)) else [value]))
    elif op == ">=":
        return query.where(field >= value)
    elif op == "<=":
        return query.where(field <= value)
    elif op == ">":
        return query.where(field > value)
    elif op == "<":
        return query.where(field < value)
    elif op == "between":
        return query.where(field.between(value[0], value[1]))
    elif op == "is" and value == "set":
        return query.where(field.isnotnull() & (field != ""))
    elif op == "is" and value == "not set":
        return query.where(field.isnull() | (field == ""))
    else:
        frappe.throw(_("Unsupported filter operator '{0}'").format(operator))


def _compute_has_more(
    employee,
    start_date,
    approval_status=None,
    search=None,
    parsed_filters=None,
):
    """Check if there are more matching weeks beyond the current results.

    Builds a single query builder query that mirrors the filter chain used
    in generate_week_data(). Returns True if at least one older Timesheet
    exists that would pass all applied filters.

    Known limitations:
    - Leave-based "Approved" override (full-leave weeks) cannot be computed
      in SQL; has_more may under-report for that edge case.
    - approval_status is checked on the same Timesheet row as other filters,
      whereas the loop checks ANY timesheet in the week via get_timesheet_state().
    """
    from pypika import Criterion

    if not parsed_filters:
        parsed_filters = {dt: [] for dt in ALLOWED_FILTER_FIELDS}

    if approval_status:
        db_statuses = [s for s in approval_status if s != "Not Submitted"]
    else:
        db_statuses = None

    # JOIN detail/task tables when search or detail/task filters are active, so has_more
    # only returns True if older weeks actually contain matching data.
    needs_detail_join = bool(search or parsed_filters.get("Timesheet Detail") or parsed_filters.get("Task"))

    # --- Build query ---
    Timesheet = frappe.qb.DocType("Timesheet")
    query = (
        frappe.qb.from_(Timesheet)
        .select(Timesheet.name)
        .where(Timesheet.employee == employee)
        .where(Timesheet.start_date < getdate(start_date))
        .where(Timesheet.docstatus != 2)
    )

    if db_statuses:
        query = query.where(Timesheet.custom_weekly_approval_status.isin(db_statuses))

    for f in parsed_filters.get("Timesheet", []):
        query = _apply_qb_condition(query, Timesheet, f[0], f[1], f[2])

    if needs_detail_join:
        TimesheetDetail = frappe.qb.DocType("Timesheet Detail")
        Task = frappe.qb.DocType("Task")
        Project = frappe.qb.DocType("Project")

        query = (
            query.join(TimesheetDetail)
            .on(TimesheetDetail.parent == Timesheet.name)
            .join(Task)
            .on(Task.name == TimesheetDetail.task)
            .left_join(Project)
            .on(Project.name == Task.project)
        )

        for f in parsed_filters.get("Timesheet Detail", []):
            query = _apply_qb_condition(query, TimesheetDetail, f[0], f[1], f[2])

        for f in parsed_filters.get("Task", []):
            query = _apply_qb_condition(query, Task, f[0], f[1], f[2])

        if search:
            search_term = f"%{search}%"
            query = query.where(
                Criterion.any(
                    [
                        Task.subject.like(search_term),
                        Task.name.like(search_term),
                        Project.project_name.like(search_term),
                    ]
                )
            )

    query = query.limit(1)
    return bool(query.run())


@frappe.whitelist(methods=["GET"])
@error_logger
def get_timesheet_data(
    employee: str,
    start_date=None,
    max_week: int = 4,
    search: str | None = None,
    approval_status: str | list | None = None,
    filters: str | list | None = None,
    skip_empty_weeks: bool = False,
):
    """Get timesheet data for the given employee for the given number of weeks."""
    if not employee:
        employee = get_employee_from_user(throw_exception=frappe.session.user != "Administrator")
    if not start_date:
        start_date = nowdate()
    apply_role_permission_for_doctype(["Timesheet User", "Timesheet Manager"], "Employee", "read", employee)
    filter_lookback_weeks = FILTER_LOOKBACK_WEEKS
    # Parse approval_status from JSON string to list
    if isinstance(approval_status, str):
        try:
            approval_status = json.loads(approval_status)
        except (json.JSONDecodeError, ValueError):
            approval_status = [approval_status]

    # Parse generic filters
    parsed_filters = parse_filters(filters)
    has_filters = bool(search or approval_status or any(parsed_filters.values()))

    if isinstance(skip_empty_weeks, str):
        skip_empty_weeks = skip_empty_weeks.lower() in ("true", "1")

    def generate_week_data(start_date, max_week, employee=None, leaves=None, holidays=None):
        data = {}
        daily_norm = get_employee_daily_working_norm(employee)
        use_cache = not has_filters
        max_lookback = max(filter_lookback_weeks, max_week) if has_filters else max_week

        cache_key = f"{EMP_TIMESHEET}::{employee}"
        matching_weeks = 0
        weeks_checked = 0

        while matching_weeks < max_week and weeks_checked < max_lookback:
            weeks_checked += 1
            week_dates = get_week_dates(start_date)
            week_key = week_dates["key"]

            if use_cache:
                week_cache_key = f"{week_dates['start_date']}::{week_dates['end_date']}"
                week_data = frappe.cache().hget(cache_key, week_cache_key)

                if week_data:
                    start_date = add_days(getdate(week_dates["start_date"]), -1)
                    data[week_key] = week_data
                    matching_weeks += 1
                    continue

            tasks, total_hours, status = {}, 0, "Not Submitted"
            if employee:
                holiday_dates = [holiday["holiday_date"] for holiday in holidays] if holidays else []
                tasks, total_hours = get_timesheet(
                    week_dates["dates"], employee, search=search, parsed_filters=parsed_filters
                )
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

            should_skip_empty = has_filters and skip_empty_weeks
            should_skip_week = (should_skip_empty and not tasks) or (approval_status and status not in approval_status)
            if should_skip_week:
                start_date = add_days(getdate(week_dates["start_date"]), -1)
                continue

            data[week_key] = {
                **week_dates,
                "total_hours": total_hours,
                "tasks": tasks,
                "status": status,
            }
            matching_weeks += 1
            if use_cache:
                frappe.cache().hset(cache_key, week_cache_key, data[week_key])
            start_date = add_days(getdate(week_dates["start_date"]), -1)

        has_more = False
        if employee:
            has_more = _compute_has_more(
                employee=employee,
                start_date=start_date,
                approval_status=approval_status,
                search=search,
                parsed_filters=parsed_filters,
            )
        return data, has_more

    hour_detail = get_employee_working_hours(employee)
    res = {**hour_detail}

    if not employee and frappe.session.user == "Administrator":
        res["data"], res["has_more"] = generate_week_data(start_date, max_week)
        res["holidays"] = []
        res["leaves"] = []
        return res

    backward = max(filter_lookback_weeks, max_week) if has_filters else max_week

    holidays = get_holidays(
        employee,
        add_days(start_date, -backward * 7),
        add_days(start_date, backward * 7),
    )

    leaves = get_employee_leaves(
        start_date=add_days(start_date, -backward * 7),
        end_date=add_days(start_date, backward * 7),
        employee=employee,
    )
    res["leaves"] = leaves
    res["holidays"] = holidays
    res["data"], res["has_more"] = generate_week_data(start_date, max_week, employee, leaves, holidays)
    return res


@frappe.whitelist(methods=["POST"])
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


@frappe.whitelist(methods=["POST"])
@error_logger
def delete(parent: str, name: str):
    """Delete single time entry (child table entry) from timesheet doctype."""
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


@frappe.whitelist(methods=["POST"])
@error_logger
def submit_for_approval(start_date: str, notes: str = None, employee: str = None, approver: str = None):
    """Submit timesheet for approval for the given week."""
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


@frappe.whitelist(methods=["POST"])
def update_timesheet_detail(
    name: str,
    parent: str,
    hours: float,
    description: str,
    task: str,
    date: str | None = None,
    is_billable: bool | None = None,
):
    """Update time entry in Timesheet Detail child table."""
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


def get_timesheet(dates: list, employee: str, search: str | None = None, parsed_filters: dict | None = None):
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
    if not parsed_filters:
        parsed_filters = {dt: [] for dt in ALLOWED_FILTER_FIELDS}

    data = {}
    total_hours = 0

    # Get parent timesheet names first
    base_ts_filters = {
        "employee": employee,
        "start_date": ["in", dates],
        "docstatus": ["!=", 2],
    }
    ts_filters = build_filters(base_ts_filters, parsed_filters.get("Timesheet", []))

    timesheet_names = frappe.get_all(
        "Timesheet",
        filters=ts_filters,
        pluck="name",
        ignore_permissions=employee_has_higher_access(employee, ptype="read"),
    )

    if not timesheet_names:
        return [data, total_hours]

    # Fetch all timesheet detail records with needed fields in one query
    base_detail_filters = {"parent": ["in", timesheet_names]}
    detail_filters = build_filters(base_detail_filters, parsed_filters.get("Timesheet Detail", []))

    timesheet_logs = frappe.get_all(
        "Timesheet Detail",
        filters=detail_filters,
        fields=ALLOWED_TIMESHET_DETAIL_FIELDS,
    )

    if not timesheet_logs:
        return [data, total_hours]

    task_ids = [ts.get("task") for ts in timesheet_logs if ts.get("task")]

    # Build Task query filters
    base_task_filters = {"name": ["in", task_ids]}
    task_filters = build_filters(base_task_filters, parsed_filters.get("Task", []))

    task_details = frappe.get_all(
        "Task",
        filters=task_filters,
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
            "exp_end_date",
        ],
    )

    # Apply search filter on task details (in-memory, OR logic across multiple fields)
    if search:
        search_term = search.lower()
        task_details = [
            t
            for t in task_details
            if search_term in (t.get("subject") or "").lower()
            or search_term in (t.get("name") or "").lower()
            or search_term in (t.get("project_name") or "").lower()
        ]

    task_details_dict = {task["name"]: task for task in task_details}

    # Filter timesheet_logs to only include entries for matching tasks
    if search or parsed_filters.get("Task"):
        timesheet_logs = [log for log in timesheet_logs if log.get("task") in task_details_dict]

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
                "exp_end_date": task["exp_end_date"] or "",
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


@frappe.whitelist(methods=["GET"])
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


@frappe.whitelist(methods=["GET"])
@validate_current_employee(ptype="read")
def get_timesheet_details(date: str, task: str, employee: str):
    """Return the time entry details for the given date, task and employee."""
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


@frappe.whitelist(methods=["POST"])
@error_logger
def bulk_update_timesheet_detail(data):
    """Update multiple time entries in Timesheet Detail child table."""
    for entry in data:
        if isinstance(entry, str):
            entry = frappe.parse_json(entry)
        update_timesheet_detail(**entry)
    return _("Time entries updated successfully.")


@frappe.whitelist(methods=["POST"])
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
