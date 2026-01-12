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
from next_pms.timesheet.doc_events.timesheet import flush_cache, publish_timesheet_update

from . import filter_employees
from .utils import employee_has_higher_access, get_week_dates


@whitelist()
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

    start_date = dates[0].get("start_date")
    end_date = dates[-1].get("end_date")
    extended_start = add_days(start_date, -max_week * 7)
    extended_end = add_days(end_date, max_week * 7)

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
        start_date=start_date,
        end_date=end_date,
    )

    if not employees:
        return {"dates": dates, "data": {}, "total_count": 0, "has_more": False}

    employee_names = [employee.name for employee in employees]

    # Batch fetch employee working hours
    emp_work_data = get_all(
        "Employee",
        filters={"name": ["in", employee_names]},
        fields=["name", "custom_working_hours", "custom_work_schedule"],
    )
    emp_work_map = {e.name: e for e in emp_work_data}

    # Default working hours from settings
    default_hours = db.get_single_value("HR Settings", "standard_working_hours") or 8

    # Get all the timesheet between the date range for the employees
    timesheet_data = get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_names],
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
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

    # Batch fetch all leaves for all employees
    all_leaves = db.sql(
        """
        SELECT employee, from_date, to_date, half_day, half_day_date
        FROM `tabLeave Application`
        WHERE employee IN %(employees)s
        AND (
            (from_date <= %(start_date)s AND to_date >= %(start_date)s)
            OR (from_date >= %(start_date)s AND to_date <= %(end_date)s)
            OR (from_date <= %(end_date)s AND to_date >= %(end_date)s)
            OR (from_date <= %(start_date)s AND to_date >= %(end_date)s)
        )
        AND (docstatus = 1 OR docstatus = 0)
        AND (status = 'Approved' OR status = 'Open')
        ORDER BY employee, from_date, to_date
    """,
        {
            "employees": employee_names,
            "start_date": extended_start,
            "end_date": extended_end,
        },
        as_dict=True,
    )

    leave_map = {}
    for leave in all_leaves:
        if leave.employee not in leave_map:
            leave_map[leave.employee] = []
        leave_map[leave.employee].append(leave)

    # Batch fetch holiday lists for all employees
    emp_holiday_lists = get_all(
        "Employee",
        filters={"name": ["in", employee_names]},
        fields=["name", "holiday_list"],
    )
    holiday_list_names = {e.holiday_list for e in emp_holiday_lists if e.holiday_list}

    # Fetch holidays for all holiday lists in date range
    holidays_by_list = {}
    if holiday_list_names:
        holidays = get_all(
            "Holiday",
            filters={
                "parent": ["in", list(holiday_list_names)],
                "holiday_date": ["between", [start_date, end_date]],
            },
            fields=["parent", "holiday_date", "weekly_off"],
        )
        for h in holidays:
            if h.parent not in holidays_by_list:
                holidays_by_list[h.parent] = []
            holidays_by_list[h.parent].append(h)

    emp_holiday_map = {e.name: e.holiday_list for e in emp_holiday_lists}

    # Batch get timesheet states
    all_states = batch_get_timesheet_states(employee_names, start_date, end_date)

    # Process employees without additional queries
    for employee in employees:
        emp_work = emp_work_map.get(employee.name, _dict())
        working_hour = emp_work.get("custom_working_hours") or default_hours
        working_frequency = emp_work.get("custom_work_schedule") or "Per Day"

        daily_working_hours = working_hour / 5 if working_frequency != "Per Day" else working_hour

        local_data = {
            **employee,
            "working_hour": working_hour,
            "working_frequency": working_frequency,
        }

        employee_timesheets = timesheet_map.get(employee.name, [])
        local_data["status"] = all_states.get(employee.name, "Not Submitted")
        local_data["data"] = []

        leaves = leave_map.get(employee.name, [])
        holiday_list = emp_holiday_map.get(employee.name)
        holidays = holidays_by_list.get(holiday_list, [])

        # Convert to dict for O(1) lookup
        holiday_date_map = {h.holiday_date: h for h in holidays}

        for date_info in dates:
            for check_date in date_info.get("dates"):
                hour = 0
                on_leave = False

                # Check leaves
                for leave in leaves:
                    if leave["from_date"] <= check_date <= leave["to_date"]:
                        if leave.get("half_day") and leave.get("half_day_date") == check_date:
                            hour += daily_working_hours / 2
                        else:
                            hour += daily_working_hours
                        on_leave = True

                # Check holidays
                if check_date in holiday_date_map:
                    holiday = holiday_date_map[check_date]
                    hour = daily_working_hours if not holiday.weekly_off else 0
                    on_leave = False

                # Sum timesheet hours
                total_hours = 0
                notes = ""
                for ts in employee_timesheets:
                    if ts.start_date == check_date and ts.end_date == check_date:
                        total_hours += ts.get("total_hours")
                        notes += ts.get("note", "")
                hour += total_hours

                local_data["data"].append(
                    {
                        "date": check_date,
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


def batch_get_timesheet_states(employee_names, start_date, end_date):
    """Batch fetch timesheet states for all employees."""
    if not employee_names:
        return {}

    # Get all timesheets for all employees in one query
    timesheets = get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_names],
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": ["!=", 2],
        },
        fields=["employee", "custom_weekly_approval_status"],
    )

    # Build a map of employee to their status
    # If an employee has multiple timesheets, return the first one found
    states = {}
    for ts in timesheets:
        if ts.employee not in states and ts.custom_weekly_approval_status is not None:
            states[ts.employee] = ts.custom_weekly_approval_status

    return states


@whitelist(methods=["POST"])
@error_logger
def approve_or_reject_timesheet(employee: str, status: str, dates: list[str] | None = None, note: str = ""):
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
    db.begin()
    try:
        for timesheet in timesheets:
            if str(timesheet.start_date) not in dates:
                continue
            doc = get_doc("Timesheet", timesheet.name)
            doc.custom_approval_status = status
            doc.save(ignore_permissions=employee_has_higher_access(employee, ptype="write"))
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
        message = _(
            "An error occurred while processing the timesheet approval for {employee}. Please follow <a href='{link}'>link</a> to check the time-entries."
        ).format(
            employee=employee,
            link=f"/next-pms/team/employee/{employee}?date='{dates[0]}'",
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
