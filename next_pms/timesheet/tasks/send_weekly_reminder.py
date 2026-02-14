import frappe
from frappe.utils import get_weekdays, getdate


def send_reminder():
    setting = frappe.get_doc("Timesheet Settings")
    send_reminder = setting.send_weekly_approval_reminder

    if not send_reminder:
        return
    day_to_send = setting.day_to_send_reminder
    approval_template = setting.weekly_approval_reminder_template
    allowed_departments = [doc.department for doc in setting.allowed_departments]
    if not day_to_send:
        day_to_send = "Monday"

    weekdays = get_weekdays()
    current_date = getdate(parse_day_first=True)
    day = weekdays[current_date.weekday()]

    role = "Projects Manager"

    employees = frappe.get_all(
        "Employee",
        filters={
            "status": "Active",
            "department": ["in", allowed_departments],
            "user_id": ["is", "set"],
        },
        pluck="user_id",
    )
    users = frappe.get_all(
        "Has Role",
        filters={"role": role, "parenttype": "User", "parent": ["in", employees]},
        parent_doctype="User",
        pluck="parent",
    )

    if day != day_to_send:
        return

    reminder_template = frappe.get_doc("Email Template", approval_template)

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    message = frappe.render_template(email_message)  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti
    subject = frappe.render_template(email_subject)  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti

    frappe.sendmail(recipients=users, subject=subject, message=message)
