from collections import defaultdict

import frappe
from frappe import _, get_value, throw
from frappe.utils import add_days, date_diff, flt, formatdate, get_link_to_form, getdate, today

ROLES = {
    "Projects Manager",
    "HR User",
    "HR Manager",
    "Projects User",
}


#  Doc Events for Timesheet DocType
def validate(doc, method=None):
    set_date(doc)
    validate_rejected_rows_unchanged(doc)
    validate_time(doc)
    validate_dates(doc)
    update_note(doc)
    flush_cache(doc)


def before_insert(doc, method=None):
    set_date(doc)
    validate_existing_timesheet(doc)
    validate_approved_timesheet(doc)


def before_save(doc, method=None):
    from frappe.utils import get_datetime

    if not doc.get("time_logs"):
        return
    #  Update the from_time and to_time to have only date part and time part as 00:00:00
    for key, data in enumerate(doc.get("time_logs")):
        from_time = get_datetime(data.from_time).replace(hour=0, minute=0, second=0, microsecond=0)
        to_time = get_datetime(data.to_time).replace(hour=0, minute=0, second=0, microsecond=0)
        doc.time_logs[key].from_time = from_time
        doc.time_logs[key].to_time = to_time
        doc.time_logs[key].project = get_value("Task", {"name": doc.time_logs[key].task}, "project")
    validate_start_date(doc)


def on_update(doc, method=None):
    from next_pms.timesheet.api.utils import update_weekly_status_of_timesheet

    doc.update_task_and_project()
    update_weekly_status_of_timesheet(doc.employee, getdate(doc.start_date))
    # The attribute ignore_backdated_validation is only available when re-caclulating
    # the timesheets, hence publish events when it is false
    if not doc.ignore_backdated_validation:
        publish_timesheet_update(doc.employee, doc.start_date)


def after_delete(doc, method=None):
    doc.update_task_and_project()
    flush_cache(doc)
    # The attribute ignore_backdated_validation is only available when re-caclulating
    # the timesheets, hence publish events when it is false
    if not doc.ignore_backdated_validation:
        publish_timesheet_update(doc.employee, doc.start_date)


def before_validate(doc, method=None):
    set_parent_project(doc)
    move_rejected_hours(doc)


def before_submit(doc, method=None):
    validate_self_approval(doc)
    doc.custom_approval_status = "Approved"


def on_cancel(doc, method=None):
    flush_cache(doc)
    # The attribute ignore_backdated_validation is only available when re-caclulating
    # the timesheets, hence publish events when it is false
    if not doc.ignore_backdated_validation:
        publish_timesheet_update(doc.employee, doc.start_date)


#  Custom Methods for Timesheet DocType events
def set_date(doc):
    if doc.docstatus == 2 and not doc.time_logs:
        return
    start_date = min(getdate(d.from_time) for d in doc.time_logs)
    end_date = max(getdate(d.to_time) for d in doc.time_logs)

    if start_date and end_date:
        doc.start_date = getdate(start_date)
        doc.end_date = getdate(end_date)


def update_note(doc):
    note = ""
    for data in doc.get("time_logs"):
        if data.description:
            note += data.description.replace("\n", "<br>")
        note += "<br>"
    doc.note = note


def validate_time(doc):
    if not doc.employee:
        throw(_("Employee is required."))
    for data in doc.get("time_logs"):
        if not flt(data.hours) and not flt(data.rejected_hours):
            throw(_("Hour should be greater than 0."))

    if doc.total_hours > 24:
        throw(_("You cannot log more than 24 hours in a single day."))


def move_rejected_hours(doc):
    """Park the hours of a newly rejected timesheet in rejected_hours and zero hours, so the
    rejected work stays on record without counting toward any total."""
    if doc.custom_approval_status != "Rejected":
        return
    previous = doc.get_doc_before_save()
    if previous and previous.custom_approval_status == "Rejected":
        return
    for row in doc.time_logs:
        if flt(row.hours):
            row.rejected_hours = row.hours
            row.hours = 0


def validate_rejected_rows_unchanged(doc):
    """Refuse changes to rows holding rejected hours, so a rejection stays on record and the
    corrected work is logged as a new entry."""
    previous = doc.get_doc_before_save()
    if not previous:
        return
    current = {row.name: row for row in doc.time_logs}
    for old in previous.time_logs:
        if not flt(old.rejected_hours):
            continue
        new = current.get(old.name)
        if (
            not new
            or getdate(new.from_time) != getdate(old.from_time)
            or any(
                new.get(field) != old.get(field)
                for field in (
                    "task",
                    "description",
                    "is_billable",
                    "hours",
                    "rejected_hours",
                    "custom_rejection_reason",
                )
            )
        ):
            throw(_("Rejected time entries cannot be changed or removed."))


def validate_is_time_billable(doc, method=None):
    for key, data in enumerate(doc.get("time_logs")):
        value = get_value("Task", data.task, "custom_is_billable")
        doc.time_logs[key].is_billable = value


def validate_dates(doc):
    """Validate if time entry is made for holidays or leave days."""
    if _is_exempt_from_backdate_validation() or doc.ignore_backdated_validation:
        return
    #  Do not allow the time entry for more then one day.
    if date_diff(doc.end_date, doc.start_date) > 0:
        throw(_("Timesheet should not exceed more than one day."))

    message = get_date_restriction_message(doc.employee, [doc.start_date])
    if message:
        throw(message)


def get_date_restriction_message(employee: str, dates: list) -> str | None:
    """The reason the current session user may not write a timesheet for `employee` on `dates`,
    or None when every date is writable. Same rule validate_dates enforces per document, asked
    once for a whole set of dates - so a caller that hands the write off to a background job can
    refuse up front instead of parking the week mid-flight when the job dies on the same check."""
    if _is_exempt_from_backdate_validation():
        return None

    dates = [getdate(date) for date in dates]
    if not dates:
        return None

    today_date = getdate(today())

    #  Check if the future time entry is allowed.
    if max(dates) > today_date and not frappe.db.get_single_value("Timesheet Settings", "allow_future_entries"):
        return _("Future time entries are not allowed.")

    #  Check if the backdated time entry falls within the allowed working-day window.
    if min(dates) < today_date:
        boundary = get_backdate_restriction_boundary(employee)
        if boundary and min(dates) < getdate(boundary):
            return _("Backdated time entries are not allowed. The earliest date you can log time for is {0}.").format(
                formatdate(boundary)
            )

    return None


def _is_exempt_from_backdate_validation() -> bool:
    """True if the current session user is fully exempt from backdate validation -
    Administrator, or holding a role listed in Timesheet Settings' Ignored Role table.
    Shared by validate_dates and get_backdate_restriction_boundary so there's exactly one
    place this exemption is decided."""
    from frappe import get_roles

    if frappe.session.user == "Administrator":
        return True

    ignore_roles = frappe.get_all("Timesheet Role", pluck="role")
    return bool(set(get_roles()).intersection(ignore_roles))


def get_backdate_restriction_boundary(employee: str) -> str | None:
    """Returns the earliest date (inclusive) `employee` may still log a time entry for, from
    the current session user's perspective. Any date before the returned boundary is
    restricted. Returns None if the current session user is exempt entirely (see
    _is_exempt_from_backdate_validation) - meaning no date should be treated as restricted.
    Single source of truth for the backdated-entry check: used both by the validation above
    and by the frontend's disabled-cell precheck (exposed via API endpoints in api/app.py,
    api/team.py, api/project.py). Thin single-employee wrapper over
    get_backdate_restriction_boundaries - callers rendering many employees at once should
    call that directly instead of looping this."""
    return get_backdate_restriction_boundaries([employee]).get(employee)


def get_backdate_restriction_boundaries(employees: list) -> dict:
    """Batch form of get_backdate_restriction_boundary: computes the boundary for every
    employee in `employees` using one round of queries regardless of list size, instead of
    one round of holiday/leave queries per employee. Team/project timesheet pages render up
    to a hundred employees per request - call this once for the whole page rather than
    looping the single-employee wrapper above."""
    if not employees:
        return {}

    if _is_exempt_from_backdate_validation():
        return dict.fromkeys(employees)

    today_date = getdate(today())

    if not frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries"):
        return dict.fromkeys(employees, str(today_date))

    allowed_days_by_employee = _get_effective_backdated_allowed_days(employees)
    return _compute_backdate_boundaries(employees, allowed_days_by_employee, today_date)


def _get_effective_backdated_allowed_days(employees: list) -> dict:
    """Resolves the 'allow backdated entries till' day threshold for every employee in
    `employees`, from the current session user's perspective: the manager threshold applies
    if they hold a manager-ish role (see ROLES) and are looking at someone else's record, the
    employee threshold otherwise. Reads the viewer's roles/employee record and both settings
    once, no matter how many employees are passed."""
    from frappe import get_roles

    from next_pms.timesheet.api.employee import get_employee_from_user

    frappe_roles = set(get_roles())
    has_access = ROLES.intersection(frappe_roles)
    viewer_employee = get_employee_from_user()

    employee_days = frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries_till_employee") or 0
    manager_days = frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries_till_manager") or 0

    return {
        employee: manager_days if has_access and viewer_employee != employee else employee_days
        for employee in employees
    }


def _compute_backdate_boundaries(employees: list, allowed_days_by_employee: dict, today_date) -> dict:
    """Walks backward from today, per employee, counting only working days (skipping
    holidays, weekly-offs, and approved/open leave) until that employee's allowed_days have
    been counted; the date it stops on is the boundary - extended further back to absorb any
    holiday/leave plateau immediately preceding it (see below). Fetches holidays and leave
    for every employee in one round of queries instead of one round per employee."""
    from next_pms.resource_management.api.utils.query import get_employee_leaves
    from next_pms.timesheet.api.utils import get_holiday_dates_by_employee

    boundaries = {employee: str(today_date) for employee, days in allowed_days_by_employee.items() if days <= 0}
    pending = [employee for employee in employees if employee not in boundaries]
    if not pending:
        return boundaries

    # A generous, fixed search window - realistically far wider than any configured
    # threshold would ever need, so the loop below always terminates within it.
    search_start = add_days(today_date, -365)

    holidays_by_employee = get_holiday_dates_by_employee(pending, search_start, today_date)
    leaves_by_employee = defaultdict(list)
    for leave in get_employee_leaves(
        employee=tuple(pending), start_date=add_days(search_start, -28), end_date=add_days(today_date, 28)
    ):
        leaves_by_employee[leave.employee].append(leave)

    for employee in pending:
        non_working_days = set(holidays_by_employee.get(employee, []))
        for leave in leaves_by_employee.get(employee, []):
            current_date = getdate(leave.from_date)
            leave_to_date = getdate(leave.to_date)
            while current_date <= leave_to_date:
                non_working_days.add(str(current_date))
                current_date = add_days(current_date, 1)

        working_days_counted = 0
        current_date = today_date
        while working_days_counted < allowed_days_by_employee[employee]:
            current_date = add_days(current_date, -1)
            if current_date < search_start:
                break
            if str(current_date) not in non_working_days:
                working_days_counted += 1

        # Absorb any holiday/leave days immediately preceding the counted boundary day too -
        # matches the old per-submission check, which never penalized a date that was itself
        # a non-working day (a date that is its own holiday/leave day never cost a working
        # day, so it was always at least as permissive as the working day right after it).
        while True:
            previous_date = add_days(current_date, -1)
            if previous_date < search_start or str(previous_date) not in non_working_days:
                break
            current_date = previous_date

        boundaries[employee] = str(current_date)

    return boundaries


def validate_existing_timesheet(doc, method=None):
    """Validate the timesheet for the date range, and project. If the timesheet already exists, then throw an error."""
    existing_timesheet = frappe.db.exists(
        "Timesheet",
        {
            "employee": doc.employee,
            "start_date": doc.start_date,
            "end_date": doc.end_date,
            "parent_project": doc.parent_project,
            "docstatus": ["!=", 2],
        },
    )
    if existing_timesheet:
        throw(
            _("{0} already exists for the given date range.").format(
                get_link_to_form("Timesheet", existing_timesheet, existing_timesheet)
            )
        )


def validate_approved_timesheet(doc, method=None):
    """Validate timesheet for the approved status, based on the date range of current week. If the timesheet is already approved for the current week then the employee should not be able to add any additional entries."""
    from frappe.utils import get_first_day_of_week, get_last_day_of_week

    if doc.docstatus == 1:
        return
    start_date = get_first_day_of_week(doc.start_date)
    end_date = get_last_day_of_week(start_date)
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": doc.employee,
            "start_date": ["<=", end_date],
            "end_date": [">=", start_date],
            "docstatus": ["!=", 2],
        },
        pluck="custom_weekly_approval_status",
    )
    if not timesheets:
        return
    #  Check all the time entries are approved or not.
    if all(
        weekly_status == "Approved"
        and weekly_status
        not in [
            "Not Submitted",
            "Partially Approved",
            "Rejected",
            "Partially Rejected",
            "Approval Pending",
        ]
        for weekly_status in timesheets
    ):
        throw(
            _("Your time entries for this week have already been approved, so you cannot add any additional entries.")
        )


def set_parent_project(doc):
    if doc.parent_project:
        return

    if not doc.time_logs:
        return

    doc.parent_project = doc.time_logs[0].project


def validate_self_approval(doc):
    from next_pms.timesheet.api.employee import get_employee_from_user

    if "System Manager" in frappe.get_roles():
        return
    employee = get_employee_from_user()
    if not employee:
        throw(_("Employee not found for currently logged in user."))

    if doc.employee == employee:
        throw(_("You cannot approve your own timesheets."))


def flush_cache(doc):
    import frappe
    from frappe.utils import get_date_str, get_first_day_of_week, get_last_day_of_week

    from next_pms.timesheet.utils.constant import EMP_TIMESHEET

    start_date = get_date_str(get_first_day_of_week(doc.start_date))
    end_date = get_date_str(get_last_day_of_week(doc.start_date))
    cache_key = f"{EMP_TIMESHEET}::{doc.employee}"
    week_cache_key = f"{start_date}::{end_date}"

    frappe.cache.hdel(cache_key, week_cache_key)


def publish_timesheet_update(employee, start_date):
    from frappe import publish_realtime
    from frappe.realtime import get_site_room
    from frappe.utils import get_date_str

    from next_pms.timesheet.api.project import get_project_timesheet_member_week
    from next_pms.timesheet.api.team import get_team_timesheet_member_week
    from next_pms.timesheet.api.timesheet import get_timesheet_data

    data = get_timesheet_data(employee, start_date, 1)
    publish_realtime(
        f"timesheet_update::{employee}",
        {"message": data},
        after_commit=True,
        room=get_site_room(),
    )
    publish_realtime(
        f"timesheet_update::{employee}",
        {"message": data},
        after_commit=True,
        user=frappe.session.user,
    )
    # Publishes one member-week, matching get_team_timesheet_data's `members` element,
    # so a listener can swap a single row. This previously sent get_compact_view_data's
    # output, which never contains the key the team page keys its merge on, making every
    # team timesheet realtime update a silent no-op.
    member = get_team_timesheet_member_week(
        employee=employee,
        start_date=get_date_str(start_date),
        by_pass_access_check=True,
    )
    payload = {
        "message": member,
        "employee": employee,
        "start_date": get_date_str(start_date),
    }
    publish_realtime("timesheet_info", payload, after_commit=True, room=get_site_room())
    publish_realtime("timesheet_info", payload, after_commit=True, user=frappe.session.user)

    # The project timesheet groups by project, so it needs the employee's whole week keyed
    # by project - a single member-week would not tell it which project rows to update, nor
    # which to remove when an entry moves off a project.
    project_member = get_project_timesheet_member_week(
        employee=employee,
        start_date=get_date_str(start_date),
        by_pass_access_check=True,
    )
    # The detailed week carries another employee's tasks, hours, leave and approval
    # status, so the site room - which holds every logged-in client, including ones that
    # would fail get_project_timesheet_data's only_for - gets an invalidation only.
    # Authorized viewers reload the week through that checked endpoint. The editor, who is
    # authorized by virtue of having just written the timesheet, still gets the payload so
    # their own row swaps in without a round trip.
    invalidation = {"employee": employee, "start_date": get_date_str(start_date)}
    publish_realtime("project_timesheet_info", invalidation, after_commit=True, room=get_site_room())
    publish_realtime(
        "project_timesheet_info",
        {**invalidation, "message": project_member},
        after_commit=True,
        user=frappe.session.user,
    )


def validate_start_date(doc):
    if doc.is_new():
        return
    if doc.has_value_changed("start_date") or doc.has_value_changed("end_date"):
        throw(_("You cannot change the start date or end date of the timesheet after it has been created."))
