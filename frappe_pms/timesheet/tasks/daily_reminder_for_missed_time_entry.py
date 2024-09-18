import frappe
from frappe.core.doctype.role.role import get_info_based_on_role
from frappe.utils import add_days, datetime, getdate, today


def send_reminder():
    send_reminder = frappe.db.get_single_value(
        fieldname="send_daily_reminder", doctype="Timesheet Setting"
    )
    if not send_reminder:
        return
    reminder_template_name = frappe.db.get_single_value(
        fieldname="daily_reminder_template", doctype="Timesheet Setting"
    )

    reminder_template = frappe.get_doc("Email Template", reminder_template_name)
    users = get_info_based_on_role("Employee")

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    for user in users:
        user_obj = frappe.get_doc("User", user)
        date = add_days(today(), -1)
        args = {
            "date": date,
            "user": user_obj,
        }
        message = frappe.render_template(email_message, args)
        subject = frappe.render_template(email_subject, args)
        if not check_if_timesheet_exists(user, date):
            send_mail(user_obj.email, subject, message)


def send_mail(recipients, subject, message):
    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def check_if_timesheet_exists(user: str, date: str | datetime.date) -> bool:
    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    return frappe.db.exists(
        "Timesheet",
        {
            "employee": employee,
            "start_date": getdate(date),
        },
    )
