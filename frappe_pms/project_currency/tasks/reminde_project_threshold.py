import frappe

from frappe_pms.project_currency.constant import (
    PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE,
)
from frappe_pms.project_currency.patches.project_threshold_limit_reminder_email_template import (
    setup_reminder_project_template,
)


def send_reminder_mail():
    project_list = frappe.get_all(
        "Project",
        filters={"custom_send_reminder_when_approaching_project_threshold_limit": 1},
        fields=["name"],
    )

    need_to_send_reminder_project_list = filter_project_list(project_list)

    for project in need_to_send_reminder_project_list:
        send_reminder_mail_for_project(project)


def send_reminder_mail_for_project(project: str):
    if not project:
        return frappe.throw("Project not found")

    if not project.custom_email_template:
        return

    user_list = frappe.get_all(
        "DocShare",
        fields=["name", "user"],
        filters=dict(share_doctype=project.doctype, share_name=project.name),
    )

    user_list = [user["user"] for user in user_list]

    all_pms = [
        d.parent
        for d in frappe.get_all(
            "Has Role",
            filters={
                "role": "Projects Manager",
                "parenttype": "User",
                "parent": ["in", user_list],
            },
            fields=["parent"],
        )
    ]

    setup_reminder_project_template()

    reminder_template = frappe.get_doc(
        "Email Template", PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE
    )

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject
    recipients = all_pms

    args = {
        "project": project,
    }

    message = frappe.render_template(email_message, args)
    subject = frappe.render_template(email_subject, args)

    frappe.sendmail(recipients=recipients, subject=subject, message=message)

    frappe.db.commit()


def filter_project_list(project_list: list):
    need_to_send_reminder_project_list = []
    for project_name in project_list:
        project = frappe.get_doc("Project", project_name)

        project_threshold = 0

        if project.custom_billing_type == "Retainer":
            custom_project_budget_hours = project.custom_project_budget_hours
            if len(custom_project_budget_hours) == 0:
                continue

            custom_project_budget_hours = custom_project_budget_hours[0]
            project_threshold = (
                custom_project_budget_hours.consumed_hours * 100
            ) / custom_project_budget_hours.hours_purchased

        elif project.custom_billing_type == "Time and Material":
            project_threshold = (
                custom_project_budget_hours.total_billable_amount * 100
            ) / custom_project_budget_hours.estimated_costing

        else:
            continue

        if (
            project.custom_reminder_threshold_percentage <= project_threshold
            and project.custom_email_template
        ):
            need_to_send_reminder_project_list.append(project)
    return need_to_send_reminder_project_list
