import frappe
from frappe import _, get_value, throw
from frappe.utils import add_days, date_diff, get_link_to_form, getdate, today

ROLES = {
    "Projects Manager",
    "HR User",
    "HR Manager",
    "Projects User",
}


#  Doc Events for Timesheet DocType
def validate(doc, method=None):
    set_date(doc)
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
        if not data.hours or data.hours == 0:
            throw(_("Hour should be greater than 0."))

    if doc.total_hours > 24:
        throw(_("You cannot log more than 24 hours in a single day."))


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

    today_date = getdate(today())
    date_gap = date_diff(doc.start_date, today_date)

    #  Check if the future time entry is allowed.
    allow_future_entry = frappe.db.get_single_value("Timesheet Settings", "allow_future_entries")
    if not allow_future_entry and date_gap > 0:
        throw(_("Future time entries are not allowed."))

    #  Check if the backdated time entry falls within the allowed working-day window.
    if date_gap < 0:
        boundary = get_backdate_restriction_boundary(doc.employee)
        if boundary and doc.start_date < getdate(boundary):
            throw(_("Backdated time entries are not allowed."))


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
    api/team.py, api/project.py)."""
    if _is_exempt_from_backdate_validation():
        return None

    today_date = getdate(today())

    if not frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries"):
        return str(today_date)

    allowed_days = _get_effective_backdated_allowed_days(employee)
    return _compute_backdate_boundary(employee, allowed_days, today_date)


def _get_effective_backdated_allowed_days(employee: str) -> int:
    """Resolves the 'allow backdated entries till' day threshold for `employee`'s record,
    from the current session user's perspective: the manager threshold applies if they hold
    a manager-ish role (see ROLES) and are looking at someone else's record, the employee
    threshold otherwise."""
    from frappe import get_roles

    from next_pms.timesheet.api.employee import get_employee_from_user

    frappe_roles = set(get_roles())
    has_access = ROLES.intersection(frappe_roles)
    viewer_employee = get_employee_from_user()

    if has_access and viewer_employee != employee:
        return frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries_till_manager") or 0
    return frappe.db.get_single_value("Timesheet Settings", "allow_backdated_entries_till_employee") or 0


def _compute_backdate_boundary(employee: str, allowed_days: int, today_date) -> str:
    """Walks backward from today counting only working days (skipping holidays, weekly-offs,
    and approved/open leave) until `allowed_days` have been counted; the date it stops on is
    the boundary - the earliest date still within the allowed window."""
    from hrms.hr.utils import get_holiday_dates_for_employee

    from next_pms.resource_management.api.utils.query import get_employee_leaves

    if allowed_days <= 0:
        return str(today_date)

    # A generous, fixed search window - realistically far wider than any configured
    # threshold would ever need, so the loop below always terminates within it.
    search_start = add_days(today_date, -365)

    holidays = get_holiday_dates_for_employee(employee, search_start, today_date)
    leaves = get_employee_leaves(
        start_date=add_days(search_start, -28),
        end_date=add_days(today_date, 28),
        employee=employee,
    )

    non_working_days = set(holidays)
    for leave in leaves:
        current_date = getdate(leave.from_date)
        leave_to_date = getdate(leave.to_date)
        while current_date <= leave_to_date:
            non_working_days.add(str(current_date))
            current_date = add_days(current_date, 1)

    working_days_counted = 0
    current_date = today_date
    while working_days_counted < allowed_days:
        current_date = add_days(current_date, -1)
        if current_date < search_start:
            break
        if str(current_date) not in non_working_days:
            working_days_counted += 1
    return str(current_date)


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


def validate_start_date(doc):
    if doc.is_new():
        return
    if doc.has_value_changed("start_date") or doc.has_value_changed("end_date"):
        throw(_("You cannot change the start date or end date of the timesheet after it has been created."))
