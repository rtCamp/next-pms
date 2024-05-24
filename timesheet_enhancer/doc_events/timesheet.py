def validate(doc, method=None):

    pass
    # TODO: Will be implemented later
    # from frappe.utils import add_days, getdate

    # if not doc.get("time_logs"):
    #     return
    # today = getdate()
    # past_date = getdate(add_days(today, -3))

    # for data in doc.get("time_logs"):
    #     fromtime = getdate(data.from_time)
    #     totime = getdate(data.to_time)
    #     if not past_date <= fromtime <= today:
    #         throw(_(f"You can't save time entry for {fromtime}"))
    #     if not past_date <= totime <= today:
    #         throw(_(f"You can't save time entry for {totime}"))


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
    if is_holiday:
        frappe.throw(
            frappe._("You can't save time entry for {0} as it is holiday.").format(
                doc.start_date
            )
        )

    if not leaves:
        return

    leave = leaves[0]
    if not leave.get("half_day"):
        frappe.throw(
            frappe._("You can't save time entry for {0} as You alreay.").format(
                doc.start_date
            )
        )


def before_save(doc, method=None):
    from frappe.utils import get_datetime

    validate_dates(doc)

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
