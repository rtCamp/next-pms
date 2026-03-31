import json

from frappe import (
    DoesNotExistError,
    _,
    _dict,
    db,
    enqueue,
    get_all,
    get_doc,
    get_value,
    log_error,
    only_for,
    sendmail,
    session,
    throw,
    whitelist,
)
from frappe.utils.data import add_days, getdate

from next_pms.api.utils import error_logger
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.doc_events.timesheet import flush_cache, publish_timesheet_update
from next_pms.timesheet.utils.constant import ALLOWED_TIMESHET_DETAIL_FIELDS

from . import filter_employees
from .employee import get_employee_daily_working_norm, get_employee_working_hours
from .timesheet import _build_filters, get_timesheet_state, parse_filters
from .utils import employee_has_higher_access, get_holidays, get_week_dates


@whitelist(methods=["GET"])
@error_logger
def get_compact_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    employee_ids: list[str] | str | None = None,
    department=None,
    project=None,
    user_group=None,
    page_length=10,
    start=0,
    status_filter=None,
    status=None,
    reports_to: str | None = None,
    by_pass_access_check=False,
):
    """API to get the timesheet data in compact view format, it will return the timesheet data for the employees based on the filters provided. It will return the data in a format which can be used to render the compact view of the timesheet. If no filters are provided, it will return the timesheet data for all the employees for the current week and previous weeks based on the max_week parameter."""
    if not by_pass_access_check:
        only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates = []
    data = {}
    if status_filter and isinstance(status_filter, str):
        status_filter = json.loads(status_filter)

    for i in range(max_week):
        week = get_week_dates(date=date)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)

    dates.reverse()
    res = {"dates": dates}

    employees, total_count = filter_employee_by_timesheet_status(
        employee_name=employee_name,
        department=department,
        project=project,
        user_group=user_group,
        page_length=page_length,
        start=start,
        reports_to=reports_to,
        status=status,
        timesheet_status=status_filter,
        employee_ids=employee_ids,
        start_date=dates[0].get("start_date"),
        end_date=dates[-1].get("end_date"),
    )
    employee_names = [employee.name for employee in employees]

    # Get all the timesheet between the date range for the employees
    timesheet_data = get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_names],
            "start_date": [">=", dates[0].get("start_date")],
            "end_date": ["<=", dates[-1].get("end_date")],
            "docstatus": ["!=", 2],
        },
        fields=[
            "employee",
            "start_date",
            "end_date",
            "total_hours",
            "note",
            "custom_approval_status",
        ],
    )

    #  Group the timesheet data by employee in the dictionary
    timesheet_map = {}
    for ts in timesheet_data:
        if ts.employee not in timesheet_map:
            timesheet_map[ts.employee] = []
        timesheet_map[ts.employee].append(ts)

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        daily_working_hours = get_employee_daily_working_norm(employee.name)
        local_data = {**employee, **working_hours}
        employee_timesheets = timesheet_map.get(employee.name, [])

        status = get_timesheet_state(
            employee=employee.name,
            start_date=dates[0].get("start_date"),
            end_date=dates[-1].get("end_date"),
        )
        local_data["status"] = status
        local_data["data"] = []

        leaves = get_employee_leaves(
            start_date=add_days(dates[0].get("start_date"), -max_week * 7),
            end_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )
        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        for date_info in dates:
            for date in date_info.get("dates"):
                hour = 0
                on_leave = False

                for leave in leaves:
                    if leave["from_date"] <= date <= leave["to_date"]:
                        if leave.get("half_day") and leave.get("half_day_date") == date:
                            hour += daily_working_hours / 2
                        else:
                            hour += daily_working_hours
                        on_leave = True

                for holiday in holidays:
                    if date == holiday.holiday_date:
                        if not holiday.weekly_off:
                            hour = daily_working_hours
                        else:
                            hour = 0
                        on_leave = False
                total_hours = 0
                notes = ""
                for ts in employee_timesheets:
                    if ts.start_date == date and ts.end_date == date:
                        total_hours += ts.get("total_hours")
                        notes += ts.get("note", "")
                hour += total_hours

                local_data["data"].append(
                    {
                        "date": date,
                        "hour": hour,
                        "is_leave": on_leave,
                        "note": notes.replace("<br>", "\n"),
                    }
                )

        data[employee.name] = local_data

    res["data"] = data
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count

    return res


@whitelist(methods=["GET"])
@error_logger
def get_team_timesheet_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    employee_ids: list[str] | str | None = None,
    department=None,
    project=None,
    user_group=None,
    page_length=10,
    start=0,
    status_filter=None,
    status=None,
    reports_to: str | None = None,
    by_pass_access_check=False,
    search: str | None = None,
    filters: str | list | None = None,
):
    """API to get team timesheet data with task-level detail in a single request.
    Combines the compact view (daily hours per employee) with detailed timesheet
    entries (tasks, hours per day) to avoid N+1 API calls from the frontend."""
    if not by_pass_access_check:
        only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates = []
    data = {}
    if status_filter and isinstance(status_filter, str):
        status_filter = json.loads(status_filter)

    for i in range(max_week):
        week = get_week_dates(date=date)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)

    dates.reverse()
    res = {"dates": dates}

    employees, total_count = filter_employee_by_timesheet_status(
        employee_name=employee_name,
        department=department,
        project=project,
        user_group=user_group,
        page_length=page_length,
        start=start,
        reports_to=reports_to,
        status=status,
        timesheet_status=status_filter,
        employee_ids=employee_ids,
        start_date=dates[0].get("start_date"),
        end_date=dates[-1].get("end_date"),
    )
    employee_names = [employee.name for employee in employees]

    if not employee_names:
        res["data"] = {}
        res["total_count"] = 0
        res["has_more"] = False
        return res

    parsed_filters = parse_filters(filters)

    # Query 1: Bulk fetch all Timesheets for all employees in date range
    base_ts_filters = {
        "employee": ["in", employee_names],
        "start_date": [">=", dates[0].get("start_date")],
        "end_date": ["<=", dates[-1].get("end_date")],
        "docstatus": ["!=", 2],
    }
    ts_filters = _build_filters(base_ts_filters, parsed_filters.get("Timesheet", []))
    all_timesheets = get_all(
        "Timesheet",
        filters=ts_filters,
        fields=[
            "name",
            "employee",
            "start_date",
            "end_date",
            "total_hours",
            "note",
            "custom_approval_status",
        ],
    )

    timesheet_map = {}
    all_timesheet_names = []
    for ts in all_timesheets:
        timesheet_map.setdefault(ts.employee, []).append(ts)
        all_timesheet_names.append(ts.name)

    # Query 2: Bulk fetch all Timesheet Detail records
    all_logs = []
    detail_by_parent = {}
    if all_timesheet_names:
        base_detail_filters = {"parent": ["in", all_timesheet_names]}
        detail_filters = _build_filters(base_detail_filters, parsed_filters.get("Timesheet Detail", []))
        all_logs = get_all(
            "Timesheet Detail",
            filters=detail_filters,
            fields=ALLOWED_TIMESHET_DETAIL_FIELDS,
        )
        for log in all_logs:
            detail_by_parent.setdefault(log.parent, []).append(log)

    # Query 3: Bulk fetch all Task details
    task_details_dict = {}
    if all_logs:
        all_task_ids = list({log.task for log in all_logs if log.task})
        if all_task_ids:
            base_task_filters = {"name": ["in", all_task_ids]}
            task_filters = _build_filters(base_task_filters, parsed_filters.get("Task", []))
            all_tasks = get_all(
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

            if search:
                search_term = search.lower()
                all_tasks = [
                    t
                    for t in all_tasks
                    if search_term in (t.get("subject") or "").lower()
                    or search_term in (t.get("name") or "").lower()
                    or search_term in (t.get("project_name") or "").lower()
                ]

            task_details_dict = {task["name"]: task for task in all_tasks}

    has_search_or_task_filters = bool(search or parsed_filters.get("Task"))

    # Build per-employee response
    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        daily_working_hours = get_employee_daily_working_norm(employee.name)
        local_data = {**employee, **working_hours}
        employee_timesheets = timesheet_map.get(employee.name, [])

        emp_status = (
            get_timesheet_state(  # for that employee based on the timesheet status of the timesheets in the date range
                employee=employee.name,
                start_date=dates[0].get("start_date"),
                end_date=dates[-1].get("end_date"),
            )
        )
        local_data["status"] = emp_status
        local_data["data"] = []

        leaves = get_employee_leaves(
            start_date=add_days(dates[0].get("start_date"), -max_week * 7),
            end_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )
        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        local_data["leaves"] = leaves
        local_data["holidays"] = holidays

        # Build compact summary (daily hours)
        for date_info in dates:
            for d in date_info.get("dates"):
                hour = 0
                on_leave = False

                for leave in leaves:
                    if leave["from_date"] <= d <= leave["to_date"]:
                        if leave.get("half_day") and leave.get("half_day_date") == d:
                            hour += daily_working_hours / 2
                        else:
                            hour += daily_working_hours
                        on_leave = True

                for holiday in holidays:
                    if d == holiday.holiday_date:
                        if not holiday.weekly_off:
                            hour = daily_working_hours
                        else:
                            hour = 0
                        on_leave = False

                total_hours = 0
                notes = ""
                for ts in employee_timesheets:
                    if ts.start_date == d and ts.end_date == d:
                        total_hours += ts.get("total_hours")
                        notes += ts.get("note", "")
                hour += total_hours

                local_data["data"].append(
                    {
                        "date": d,
                        "hour": hour,
                        "is_leave": on_leave,
                        "note": notes.replace("<br>", "\n"),
                    }
                )

        # Build task-level detail per week
        emp_ts_by_start = {}
        for ts in employee_timesheets:
            emp_ts_by_start.setdefault(ts.start_date, []).append(ts.name)

        timesheet_details = {}
        for date_info in dates:
            week_key = date_info["key"]
            week_dates_set = set(date_info["dates"])
            tasks = {}
            week_total_hours = 0

            # Get timesheet names for this employee in this week
            week_ts_names = []
            for d in date_info["dates"]:
                week_ts_names.extend(emp_ts_by_start.get(d, []))

            # Collect detail logs for those timesheets
            for ts_name in week_ts_names:
                for log in detail_by_parent.get(ts_name, []):
                    log_date = getdate(log.from_time)
                    if log_date not in week_dates_set:
                        continue

                    week_total_hours += log.get("hours", 0)

                    if not log.get("task"):
                        continue
                    if has_search_or_task_filters and log.task not in task_details_dict:
                        continue

                    task = task_details_dict.get(log.task)
                    if not task:
                        continue

                    task_name = task["name"]
                    if task_name not in tasks:
                        tasks[task_name] = {
                            "name": task_name,
                            "subject": task["subject"],
                            "project": task["project"],
                            "project_name": task["project_name"],
                            "is_billable": task["custom_is_billable"],
                            "expected_time": task["expected_time"],
                            "actual_time": task["actual_time"],
                            "status": task["status"],
                            "_liked_by": task["_liked_by"],
                            "exp_end_date": task["exp_end_date"] or "",
                            "data": [],
                        }

                    tasks[task_name]["data"].append({field: log.get(field) for field in ALLOWED_TIMESHET_DETAIL_FIELDS})

            week_status = (
                get_timesheet_state(  # for that week based on the timesheet status of the timesheets in that week
                    employee=employee.name,
                    start_date=date_info["dates"][0],
                    end_date=date_info["dates"][-1],
                )
            )

            timesheet_details[week_key] = {
                **date_info,
                "total_hours": week_total_hours,
                "tasks": tasks,
                "status": week_status,
            }

        local_data["timesheet_details"] = timesheet_details
        data[employee.name] = local_data

    res["data"] = data
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count

    return res


@whitelist(methods=["POST"])
@error_logger
def approve_or_reject_timesheet(employee: str, status: str, dates: list[str] | None = None, note: str = ""):
    """API to approve or reject the timesheet for the given employee and date range. It will update the custom_approval_status and custom_weekly_approval_status field of the timesheet to "Processing Timesheet" and then enqueue a background job to approve or reject the timesheet. The background job will update the status of the timesheet to "Approved" or "Rejected" based on the status parameter passed in the API and then trigger a notification to the employee about the approval or rejection of the timesheet."""
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)
    if not dates:
        return throw(_("Please select the dates to approve or reject the timesheet."))
    current_week = get_week_dates(dates[0])
    timesheets = get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", current_week.get("start_date")],
            "end_date": ["<=", current_week.get("end_date")],
            "docstatus": ["=", 0],
        },
        ["name", "start_date", "employee"],
    )
    if not timesheets:
        return throw(
            _("No timesheet found for the given date range."),
            exc=DoesNotExistError,
        )
    for timesheet in timesheets:
        if str(timesheet.start_date) not in dates:
            continue
        db.set_value("Timesheet", timesheet.name, "custom_approval_status", "Processing Timesheet")
        db.set_value("Timesheet", timesheet.name, "custom_weekly_approval_status", "Processing Timesheet")
    doc = _dict(
        {
            "employee": employee,
            "start_date": current_week.get("start_date"),
        }
    )
    db.commit()  # nosemgrep Need to do as we need to publish status changes.
    flush_cache(doc)
    publish_timesheet_update(employee=employee, start_date=current_week.get("start_date"))
    enqueue(
        _approve_or_reject_timesheet,
        status=status,
        employee=employee,
        dates=dates,
        timesheets=timesheets,
        enqueue_after_commit=True,
        queue="long",
        note=note,
        job_name=f"Timesheet Approval for {employee} - {status}",
        at_front=True,
    )

    return _(
        "Timesheet approval or rejection has been queued for processing. Please do not make any changes to it. You may continue with other tasks."
    )


def filter_employee_by_timesheet_status(
    employee_name=None,
    employee_ids: list[str] | str | None = None,
    department=None,
    project=None,
    page_length=10,
    start=0,
    user_group=None,
    timesheet_status=None,
    reports_to: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status=None,
):
    """
    This wrapper method to filter the employees based on the certain filters.
    For example, when the timesheet_status is provided,
    it will filter the employees based on the timesheet status. After filtering the employees,
    it will return the employees and the count of the employees using the `filter_employees` method.
    """
    import frappe

    start = int(start)
    page_length = int(page_length)

    if employee_ids and isinstance(employee_ids, str):
        employee_ids = json.loads(employee_ids)

    if not timesheet_status:
        employees, count = filter_employees(
            employee_name,
            department,
            project,
            status=status,
            page_length=page_length,
            start=start,
            user_group=user_group,
            reports_to=reports_to,
            ids=employee_ids,
        )

        return employees, count

    if timesheet_status and isinstance(timesheet_status, str):
        timesheet_status = json.loads(timesheet_status)

    timesheet = frappe.qb.DocType("Timesheet")
    # get the list of the employees from the timesheet based on the timesheet status.
    employees = (
        frappe.qb.from_(timesheet)
        .select("employee")
        .where(timesheet.start_date >= getdate(start_date))
        .where(timesheet.end_date <= getdate(end_date))
        .where(timesheet.custom_weekly_approval_status.isin(timesheet_status))
        .groupby("employee")
        .orderby(timesheet.employee_name, order=frappe.qb.asc)
    ).run(as_dict=True)

    if not employees:
        return [], 0
    employees = [emp.employee for emp in employees]
    employees = employees[start : start + page_length]

    employees, count = filter_employees(
        ids=employees,
        department=department,
        project=project,
        status=status,
        page_length=page_length,
        start=start,
        user_group=user_group,
        reports_to=reports_to,
    )

    if start + page_length > count:
        page_length = count - start

    return employees, count


@error_logger
def _approve_or_reject_timesheet(
    timesheets: list,
    status: str,
    employee: str,
    dates: list[str] | None = None,
    note: str = "",
):
    if not dates:
        return

    # Convert dates to set for O(1) lookup
    dates_set = set(dates)

    # Filter timesheets first (no DB query)
    timesheets_to_process = [ts for ts in timesheets if str(ts.start_date) in dates_set]

    if not timesheets_to_process:
        return

    db.begin()
    try:
        # Calculate permission once instead of per timesheet
        has_permission = employee_has_higher_access(employee, ptype="write")

        for timesheet in timesheets_to_process:
            doc = get_doc("Timesheet", timesheet.name)
            doc.custom_approval_status = status
            doc.save(ignore_permissions=has_permission)
            if status == "Approved":
                doc.submit()

        enqueue(
            trigger_notification_for_approved_or_rejected_timesheet,
            enqueue_after_commit=True,
            status=status,
            employee=employee,
            dates=dates,
            note=note,
            job_name="Timesheet Approval Notification",
        )
        db.commit()
    except:  # noqa: E722
        db.rollback()
        log_error(title=_("Error in Timesheet Approval"))
        subject = _("Error in Timesheet Approval")
        date_param = f"?date='{dates[0]}'" if dates else ""
        message = _(
            "An error occurred while processing the timesheet approval for {employee}. Please follow <a href='{link}'>link</a> to check the time-entries."
        ).format(
            employee=employee,
            link=f"/next-pms/team/employee/{employee}{date_param}",
        )
        sendmail(recipients=[session.user], subject=subject, message=message)


def trigger_notification_for_approved_or_rejected_timesheet(
    status: str, employee: str, dates: list[str] | None = None, note: str = ""
):
    import frappe

    if status not in ["Approved", "Rejected"]:
        return
    if status == "Approved":
        template = frappe.db.get_single_value("Timesheet Settings", "timesheet_approval_template")
    else:
        template = frappe.db.get_single_value("Timesheet Settings", "timesheet_rejection_template")

    if not template:
        return
    template = get_doc("Email Template", template)
    employee = get_doc("Employee", employee)
    email_message = ""
    if template.use_html:
        email_message = template.response_html
    else:
        email_message = template.response

    email_subject = template.subject
    args = {
        "employee": employee,
        "note": note,
        "dates": dates,
        "updated_by": get_value("User", frappe.session.user, "full_name"),
    }
    message = frappe.render_template(email_message, args)
    subject = frappe.render_template(email_subject, args)
    frappe.sendmail(recipients=employee.user_id, subject=subject, message=message)
