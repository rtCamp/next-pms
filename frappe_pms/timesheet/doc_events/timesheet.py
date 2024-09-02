import frappe
from frappe import _, get_value, throw
from frappe.utils import add_days, date_diff, getdate, today

ROLES = {
    "Projects Manager",
    "HR User",
    "HR Manager",
}


def set_date(doc):
    if doc.docstatus < 2 and doc.time_logs:
        start_date = min(getdate(d.from_time) for d in doc.time_logs)
        end_date = max(getdate(d.to_time) for d in doc.time_logs)

        if start_date and end_date:
            doc.start_date = getdate(start_date)
            doc.end_date = getdate(end_date)


def validate(doc, method=None):
    validate_time(doc)
    update_note(doc)


def before_insert(doc, method=None):
    set_date(doc)
    validate_dates(doc)


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


def before_save(doc, method=None):
    from frappe.utils import get_datetime

    if not doc.get("time_logs"):
        return
    #  Update the from_time and to_time to have only date part and time part as 00:00:00
    for key, data in enumerate(doc.get("time_logs")):
        from_time = get_datetime(data.from_time).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        to_time = get_datetime(data.to_time).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        doc.time_logs[key].from_time = from_time
        doc.time_logs[key].to_time = to_time
        doc.time_logs[key].project = get_value(
            "Task", {"name": doc.time_logs[key].task}, "project"
        )


def validate_existing_timesheet(doc, method=None):
    import frappe

    exists = frappe.db.exists(
        "Timesheet",
        {
            "employee": doc.employee,
            "start_date": getdate(doc.start_date),
            "end_date": getdate(doc.end_date),
            "parent_project": doc.parent_project,
            "docstatus": ["!=", 2],
        },
    )
    if exists:
        frappe.throw(frappe._("Timesheet already exists for the given date range."))


def validate_is_time_billable(doc, method=None):
    for key, data in enumerate(doc.get("time_logs")):
        value = get_value("Task", data.task, "custom_is_billable")
        doc.time_logs[key].is_billable = value


def validate_dates(doc):
    """Validate if time entry is made for holidays or leave days."""
    # import frappe
    from frappe import get_roles
    from hrms.hr.utils import get_holiday_dates_for_employee

    from timesheet_enhancer.api.utils import (
        get_employee_from_user,
        get_leaves_for_employee,
    )

    if frappe.session.user == "Administrator":
        return
    #  Do not allow the time entry for more then one day.
    if date_diff(doc.end_date, doc.start_date) > 0:
        throw(_("Timesheet should not exceed more than one day."))

    frappe_roles = set(get_roles())
    today_date = getdate(today())
    date_gap = date_diff(doc.start_date, today_date)

    #  Check if the future time entry is allowed.
    allow_future_entry = frappe.db.get_single_value(
        "Timesheet Setting", "allow_future_entries"
    )
    if not allow_future_entry and date_gap > 0:
        throw(_("Future time entries are not allowed."))

    #  Check if the back dated time entry is allowed.
    allow_back_dated_entry = frappe.db.get_single_value(
        "Timesheet Setting", "allow_backdated_entries"
    )
    if not allow_back_dated_entry:
        throw(_("Backdated time entries are not allowed."))

    # validate backdated entries as per the setting
    if date_gap < 0:
        has_access = ROLES.intersection(frappe_roles)
        employee = get_employee_from_user()

        if has_access and employee != doc.employee:
            allowed_days = frappe.db.get_single_value(
                "Timesheet Setting", "allow_backdated_entries_till_manager"
            )
        else:
            allowed_days = frappe.db.get_single_value(
                "Timesheet Setting", "allow_backdated_entries_till_employee"
            )
        holidays = get_holiday_dates_for_employee(
            doc.employee, doc.start_date, today_date
        )
        leaves = get_leaves_for_employee(
            str(add_days(doc.start_date, -28)),
            str(add_days(today_date, 28)),
            doc.employee,
        )

        for leave in leaves:
            from_date = getdate(leave.from_date)
            to_date = getdate(leave.to_date)

            current_date = from_date
            while current_date <= to_date:
                holidays.append(str(current_date))
                current_date = add_days(current_date, 1)

        holiday_counter = 0
        holidays = set(holidays)
        for holiday in holidays:
            if doc.start_date <= getdate(holiday) < today_date:
                holiday_counter += 1
        if abs(date_gap + holiday_counter) > allowed_days:
            throw("Backdated time entries are not allowed.")
