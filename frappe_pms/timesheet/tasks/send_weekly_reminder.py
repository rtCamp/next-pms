import frappe
from frappe.core.doctype.role.role import get_info_based_on_role
from frappe.utils import get_weekdays, getdate


def send_reminder():
    send_reminder = frappe.db.get_single_value(
        fieldname="send_weekly_approval_reminder", doctype="Timesheet Settings"
    )
    if not send_reminder:
        return
    day_to_send, approval_template = frappe.db.get_value(
        "Timesheet Settings",
        None,
        ["day_to_send_reminder", "weekly_approval_reminder_template"],
    )
    if not day_to_send:
        day_to_send = "Monday"

    weekdays = get_weekdays()
    current_date = getdate(parse_day_first=True)
    day = weekdays[current_date.weekday()]

    users = get_info_based_on_role("Projects Manager")

    if day != day_to_send:
        return

    reminder_template = frappe.get_doc("Email Template", approval_template)

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    message = frappe.render_template(email_message)
    subject = frappe.render_template(email_subject)

    frappe.sendmail(recipients=users, subject=subject, message=message)
