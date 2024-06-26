from frappe import get_value

ROLES = {
    "Projects Manager",
    "HR User",
    "HR Manager",
    "System Manager",
    "Administrator",
}


def validate(doc, method=None):
    validate_dates(doc)
    validate_is_time_billable(doc)


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


def before_insert(doc, method=None):
    import frappe

    exists = frappe.db.exists(
        "Timesheet",
        {
            "employee": doc.employee,
            "start_date": doc.start_date,
            "end_date": doc.end_date,
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
    import frappe
    from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
    from frappe.utils import date_diff, getdate

    from timesheet_enhancer.api.utils import get_leaves_for_employee

    if date_diff(doc.end_date, doc.start_date) > 0:
        frappe.throw(frappe._("Timesheet should not exceed more than one day."))

    frappe_roles = set(frappe.get_roles())
    has_access = ROLES.intersection(frappe_roles)

    holiday_list = get_holiday_list_for_employee(doc.employee)
    is_holiday = frappe.db.exists(
        "Holiday", {"holiday_date": doc.start_date, "parent": holiday_list}
    )
    leaves = get_leaves_for_employee(
        str(doc.start_date), str(doc.end_date), doc.employee
    )

    if is_holiday and not has_access:
        frappe.throw(
            frappe._("You can't save time entry for {0} as it is holiday.").format(
                doc.start_date
            )
        )

    # Loop over every leave and check if the time entry is made for the leave days.
    if leaves:
        for leave in leaves:
            from_date = getdate(leave.get("from_date"))
            to_date = getdate(leave.get("to_date"))
            half_day = leave.get("half_day")
            half_day_date = getdate(leave.get("half_day_date"))

            #  we will check for full day leave and the date should be in the range of leave dates.
            if (
                from_date <= getdate(doc.start_date) <= to_date
                and (half_day and half_day_date != getdate(doc.start_date))
                and not has_access
            ):

                frappe.throw(
                    frappe._(
                        "You can't save time entry for {0} as you have already appliead for the leave."
                    ).format(doc.start_date)
                )

    #  In ideal case the employee should not be able to save the time entry for the future dates.
    if getdate(doc.start_date) > getdate(frappe.utils.nowdate()) and not has_access:
        frappe.throw(frappe._("You do not have the access to save future time entry."))
