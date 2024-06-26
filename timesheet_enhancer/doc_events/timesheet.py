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
    from frappe.utils import date_diff

    from timesheet_enhancer.api.utils import get_leaves_for_employee

    if date_diff(doc.end_date, doc.start_date) > 0:
        frappe.throw(frappe._("Timesheet should not exceed more than one day."))

    holiday_list = get_holiday_list_for_employee(doc.employee)
    is_holiday = frappe.db.exists(
        "Holiday", {"holiday_date": doc.start_date, "parent": holiday_list}
    )
    leaves = get_leaves_for_employee(
        str(doc.start_date), str(doc.end_date), doc.employee
    )

    frappe_roles = set(frappe.get_roles())
    if is_holiday and not ROLES.intersection(frappe_roles):
        frappe.throw(
            frappe._("You can't save time entry for {0} as it is holiday.").format(
                doc.start_date
            )
        )

    if not leaves:
        return

    leave = leaves[0]
    if not leave.get("half_day") and not ROLES.intersection(frappe_roles):
        frappe.throw(
            frappe._("You can't save time entry for {0} as You alreay.").format(
                doc.start_date
            )
        )
