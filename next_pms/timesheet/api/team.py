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
from next_pms.timesheet.doc_events.timesheet import (
    flush_cache,
    get_date_restriction_message,
    publish_timesheet_update,
)
from next_pms.timesheet.utils.constant import (
    ALLOWED_FILTER_FIELDS,
    MAX_TEAM_TIMESHEET_PAGE_LENGTH,
    NOT_SUBMITTED_STATUS,
    TEAM_TIMESHEET_PAGE_LENGTH,
)

from . import filter_employees
from .employee import get_employee_from_user
from .utils import (
    build_chunk_context,
    build_employee_week_details,
    employee_condition_kwargs,
    employee_has_higher_access,
    get_week_dates,
    has_scoped_timesheets_before,
    resolve_team_employee_scope,
    resolve_team_members,
    update_weekly_status_of_timesheet,
)


def build_team_member_payload(employee, context, week, has_filters):
    """One member's row for one week, in the shape TeamMember renders."""
    working_hours = context["working_hours_map"].get(employee.name, {"working_hour": 0, "working_frequency": "Per Day"})
    # Qualification is already settled by resolve_team_members, so nothing is pruned
    # here - this only shapes the week that survived.
    week_details = build_employee_week_details(
        employee_name=employee.name,
        dates=[week],
        context=context,
        has_filters=has_filters,
        skip_empty_weeks=False,
        approval_status=None,
    )
    detail = week_details.get(week["key"]) or {}

    return {
        "employee": employee.name,
        "employee_name": employee.get("employee_name"),
        "image": employee.get("image"),
        **working_hours,
        "status": detail.get("status", NOT_SUBMITTED_STATUS),
        "total_hours": detail.get("total_hours", 0),
        "tasks": detail.get("tasks", {}),
        "leaves": list(context["leaves_by_employee"].get(employee.name, [])),
        "holidays": list(context["holidays_by_employee"].get(employee.name, [])),
        "backdate_restricted_before": context["backdate_boundary_by_employee"].get(employee.name),
    }


@whitelist(methods=["GET", "POST"])
@error_logger
def get_team_timesheet_data(
    start_date: str,
    page_length: int = TEAM_TIMESHEET_PAGE_LENGTH,
    start: int = 0,
    status_filter: str | list[str] | None = None,
    reports_to: str | None = None,
    search: str | None = None,
    filters: str | list | None = None,
):
    """Members of a single week, paginated.

    `start_date` is any day inside the wanted week; the week boundaries come from
    `get_week_dates`, so the caller does not supply an end date.

    Pairs with `get_team_timesheet_weeks`, which supplies the week structure and the
    counts. Both derive membership from `resolve_team_members`, so this endpoint's
    `total_count` and that endpoint's `member_count` cannot drift.
    """
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    start = int(start)
    page_length = max(0, min(int(page_length), MAX_TEAM_TIMESHEET_PAGE_LENGTH))
    week = get_week_dates(date=start_date)

    scope = resolve_team_employee_scope(
        date=start_date,
        max_week=1,
        status_filter=status_filter,
        reports_to=reports_to,
        search=search,
        filters=filters,
    )

    response = {
        "start_date": week["start_date"],
        "end_date": week["end_date"],
        "dates": week["dates"],
        "members": [],
        "total_count": 0,
        "has_more": False,
    }
    if scope.is_empty:
        return response

    resolved = resolve_team_members(scope, [week])
    qualifying = resolved["members_by_week"][week["start_date"]]
    total_count = len(qualifying)
    response["total_count"] = total_count

    if not qualifying or not page_length or start >= total_count:
        return response

    # The page comes out of the database rather than out of a Python scan: membership
    # is already known, so LIMIT/OFFSET over the qualifying ids replaces walking the
    # whole pool building payloads only to discard them.
    page_employees, _ = filter_employees(
        page_length=page_length,
        start=start,
        reports_to=reports_to,
        ids=sorted(qualifying),
        **employee_condition_kwargs(scope.employee_conditions),
    )

    context = build_chunk_context(page_employees, [week], scope.parsed_filters)
    response["members"] = [
        build_team_member_payload(employee, context, week, scope.has_filters) for employee in page_employees
    ]
    response["has_more"] = start + page_length < total_count
    return response


@whitelist(methods=["GET", "POST"])
@error_logger
def get_team_timesheet_weeks(
    date: str,
    max_week: int = 4,
    reports_to: str | None = None,
    search: str | None = None,
    status_filter: str | list[str] | None = None,
    filters: str | list | None = None,
):
    """Week structure and per-week counts for the team timesheet, without member payloads.

    Feeds first paint: the page can render its week rows and pending-approval badges
    before any member data is fetched, and `get_team_timesheet_data` then fills one week
    at a time. Builds no member payload, so an unfiltered call reads Timesheet rows only;
    a Task or Timesheet Detail filter does reach the detail rows, since qualifying a week
    against it cannot be answered from the Timesheet table alone.
    """
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    max_week = int(max_week)
    scope = resolve_team_employee_scope(
        date=date,
        max_week=max_week,
        status_filter=status_filter,
        reports_to=reports_to,
        search=search,
        filters=filters,
    )
    weeks = scope.response_dates

    if scope.is_empty or not weeks:
        return {"weeks": [], "has_more_weeks": False, "next_date": None}

    resolved = resolve_team_members(scope, weeks)

    week_payloads = []
    for week in weeks:
        members = resolved["members_by_week"][week["start_date"]]
        pending = resolved["pending_by_week"][week["start_date"]]
        member_count = len(members)

        if scope.skip_empty_weeks and not members:
            continue

        week_payloads.append(
            {
                "key": str(week["start_date"]),
                "start_date": week["start_date"],
                "end_date": week["end_date"],
                "label": week["key"],
                "dates": week["dates"],
                "member_count": member_count,
                "approval_pending_count": len(pending),
                "has_more_members": member_count > TEAM_TIMESHEET_PAGE_LENGTH,
            }
        )

    # Asked against this caller's scope, not the whole Timesheet table: with empty weeks
    # dropped, `week_payloads` can legitimately come back empty, and a global probe would
    # then keep the frontend paging backwards to the oldest timesheet in history.
    earliest = weeks[0]["start_date"]
    next_date = add_days(getdate(earliest), -1)
    has_more_weeks = has_scoped_timesheets_before(scope, resolved["eligible_ids"], earliest)

    return {
        "weeks": week_payloads,
        "has_more_weeks": has_more_weeks,
        "next_date": next_date if has_more_weeks else None,
    }


@whitelist(methods=["GET", "POST"])
@error_logger
def get_team_timesheet_member_week(employee: str, start_date: str, by_pass_access_check: bool = False):
    """One member's row for one week - the unit the realtime publisher swaps in.

    Returns exactly one element of `get_team_timesheet_data`'s `members`, so a realtime
    update replaces a single row instead of forcing a reload of the whole week.
    """
    if not by_pass_access_check:
        only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    week = get_week_dates(date=start_date)
    employee_rows, _ = filter_employees(page_length=1, start=0, ids=[employee], ignore_default_filters=True)
    if not employee_rows:
        return None

    context = build_chunk_context(employee_rows, [week], {dt: [] for dt in ALLOWED_FILTER_FIELDS})
    return build_team_member_payload(employee_rows[0], context, week, has_filters=False)


@whitelist(methods=["POST"])
@error_logger
def approve_or_reject_timesheet(employee: str, status: str, dates: list[str] | None = None, note: str = ""):
    """API to approve or reject the timesheet for the given employee and date range. It will update the custom_approval_status and custom_weekly_approval_status field of the timesheet to "Processing Timesheet" and then enqueue a background job to approve or reject the timesheet. The background job will update the status of the timesheet to "Approved" or "Rejected" based on the status parameter passed in the API and then trigger a notification to the employee about the approval or rejection of the timesheet."""
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    # No role approves its own week - a reviewer role is permission to review someone else.
    if employee == get_employee_from_user():
        return throw(_("You cannot approve or reject your own timesheets."))

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
        ["name", "start_date", "employee", "custom_approval_status"],
    )
    if not timesheets:
        return throw(
            _("No timesheet found for the given date range."),
            exc=DoesNotExistError,
        )
    dates_set = set(dates)
    timesheets_to_process = [ts for ts in timesheets if str(ts.start_date) in dates_set]

    # Refuse before anything is written: the background job below saves each document, which
    # runs the very same check per document - and by then the rows are already parked in
    # "Processing Timesheet" and committed, leaving the week unactionable forever (#2075).
    restriction = get_date_restriction_message(employee, [ts.start_date for ts in timesheets_to_process])
    if restriction:
        return throw(restriction)

    for timesheet in timesheets_to_process:
        db.set_value(
            "Timesheet",
            timesheet.name,
            {
                "custom_approval_status": "Processing Timesheet",
                "custom_weekly_approval_status": "Processing Timesheet",
                "custom_weekly_rejection_reason": None,
            },
        )
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
            for log in doc.time_logs:
                log.custom_rejection_reason = note if status == "Rejected" else None
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
        _restore_parked_timesheets(timesheets_to_process, employee)
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


def _restore_parked_timesheets(timesheets: list, employee: str):
    """Put rows this job parked in "Processing Timesheet" back on the status each held before,
    so a failed run leaves the week actionable instead of dead-ended (#2075). The prior status
    rides along in the job payload, so this restores the real value rather than guessing, and
    only rows still parked as drafts are touched - a concurrent run may have finished first, and
    its result wins. Best effort: a killed worker never reaches this, which the restore patch
    cleans up."""
    weeks = {getdate(ts.start_date) for ts in timesheets}
    try:
        for timesheet in timesheets:
            current = db.get_value(
                "Timesheet",
                timesheet.name,
                ["docstatus", "custom_approval_status"],
                as_dict=True,
            )
            # Nothing stops a second request from parking the same row while this job is in
            # flight. A row that is no longer a parked draft carries that run's result, which
            # is newer than anything captured here - leave it alone.
            if not current or current.docstatus != 0 or current.custom_approval_status != "Processing Timesheet":
                continue

            captured = timesheet.get("custom_approval_status")
            db.set_value(
                "Timesheet",
                timesheet.name,
                "custom_approval_status",
                # A captured "Processing Timesheet" means this run parked a row a concurrent run
                # had already parked, so it says nothing about the status before either of them;
                # same for a job enqueued before this field joined the payload. "Approval Pending"
                # is the status a row must have held to be actionable.
                captured if captured and captured != "Processing Timesheet" else "Approval Pending",
            )
        for start_date in weeks:
            update_weekly_status_of_timesheet(employee, start_date)
        db.commit()  # nosemgrep Need to do as we need to publish status changes.
    except:  # noqa: E722
        db.rollback()
        log_error(title=_("Error restoring Timesheet status after failed approval"))
        return

    for start_date in weeks:
        flush_cache(_dict({"employee": employee, "start_date": start_date}))
        publish_timesheet_update(employee=employee, start_date=start_date)


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
    message = frappe.render_template(email_message, args)  # nosemgrep - trusted Email Template from DB
    subject = frappe.render_template(email_subject, args)  # nosemgrep - trusted Email Template from DB
    frappe.sendmail(recipients=employee.user_id, subject=subject, message=message)
