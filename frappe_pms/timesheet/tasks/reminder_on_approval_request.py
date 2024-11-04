import frappe


def send_approval_reminder(employee: str, reporting_manager: str, start_date: str, end_date: str):
    frappe.enqueue(
        send_mail,
        employee=employee,
        job_name=f"send_approval_reminder from {employee} to {reporting_manager} for {start_date} to {end_date}",
        reporting_manager=reporting_manager,
        start_date=start_date,
        end_date=end_date,
    )


def send_mail(employee: str, reporting_manager: str, start_date: str, end_date: str):
    send_reminder = frappe.db.get_single_value(
        fieldname="send_reminder_on_approval_request", doctype="Timesheet Settings"
    )
    if not send_reminder:
        return

    reminder_template_name = frappe.db.get_single_value(
        fieldname="approval_request_reminder_template", doctype="Timesheet Settings"
    )
    reminder_template = frappe.get_doc("Email Template", reminder_template_name)

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject
    employee = frappe.get_doc("Employee", employee)
    reporting_manager = frappe.get_doc("Employee", reporting_manager)
    recipients = frappe.db.get_value("User", reporting_manager.user_id, "email")
    args = {
        "start_date": start_date,
        "end_date": end_date,
        "employee": employee,
        "reporting_manager": reporting_manager,
    }
    message = frappe.render_template(email_message, args)
    subject = frappe.render_template(email_subject, args)

    frappe.sendmail(recipients=recipients, subject=subject, message=message)
