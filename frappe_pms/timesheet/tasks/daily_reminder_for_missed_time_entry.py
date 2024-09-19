import frappe
from frappe.utils import DATE_FORMAT, add_days, datetime, getdate
from hrms.hr.utils import get_holiday_list_for_employee


def send_reminder():
    current_date = getdate(parse_day_first=True)
    date = add_days(current_date, -1)

    send_reminder = frappe.db.get_single_value(
        fieldname="send_daily_reminder", doctype="Timesheet Setting"
    )
    if not send_reminder:
        return
    reminder_template_name = frappe.db.get_single_value(
        fieldname="daily_reminder_template", doctype="Timesheet Setting"
    )

    reminder_template = frappe.get_doc("Email Template", reminder_template_name)
    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields="*",
    )

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    for employee in employees:
        if check_if_date_is_holiday(date, employee.name):
            continue
        user = employee.user_id
        args = {
            "date": date,
            "employee": employee,
        }
        message = frappe.render_template(email_message, args)
        subject = frappe.render_template(email_subject, args)
        if not check_if_timesheet_exists(employee.name, date):
            send_mail(user, subject, message)


def send_mail(recipients, subject, message):
    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def check_if_timesheet_exists(employee: str, date: datetime.date) -> bool:
    return frappe.db.exists(
        "Timesheet",
        {
            "employee": employee,
            "start_date": date,
        },
    )


def check_if_date_is_holiday(date: datetime.date, employee: str) -> bool:
    holiday_list = get_holiday_list_for_employee(employee)
    return frappe.db.exists(
        "Holiday List",
        {
            "holiday_date": date.strftime(DATE_FORMAT),
            "parent": holiday_list,
        },
    )
