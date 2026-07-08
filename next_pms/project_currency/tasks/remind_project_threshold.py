import frappe
from typing import List, Any
from next_pms.project_currency.api.project_timesheet_billing_recalculation import (
    generate_the_error_log,
)


def send_reminder_mail() -> None:
    """Scheduled task to send email reminders for projects approaching their budget/threshold limits.
    
    Finds all open projects configured for threshold reminders, filters them
    based on threshold status, and emails the project managers.
    """
    try:
        project_list = frappe.get_all(
            "Project",
            filters={
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "status": "Open",
            },
            fields=["name"],
        )

        need_to_send_reminder_project_list = filter_project_list(project_list)

        for project in need_to_send_reminder_project_list:
            send_reminder_mail_for_project(project)
    except Exception:
        generate_the_error_log(
            "send_reminder_project_threshold_mail_failed",
        )


def send_reminder_mail_for_project(project: Any) -> None:
    """Send a notification email to all Project Managers shared on a project.

    Args:
        project (Any): The Project document object.
    """
    if not project:
        return frappe.throw(frappe._("Project not found"))

    if not project.custom_email_template:
        return

    # Find users who have access to this project
    user_list = frappe.get_all(
        "DocShare",
        fields=["name", "user"],
        filters=dict(share_doctype=project.doctype, share_name=project.name),
    )

    user_emails = [user["user"] for user in user_list]

    # Filter users to those with "Projects Manager" role
    all_pms = [
        d.parent
        for d in frappe.get_all(
            "Has Role",
            filters={
                "role": "Projects Manager",
                "parenttype": "User",
                "parent": ["in", user_emails],
            },
            fields=["parent"],
        )
    ]

    if not all_pms:
        return

    reminder_template = frappe.get_doc("Email Template", project.custom_email_template)

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

    message = frappe.render_template(email_message, args)  # nosemgrep - trusted Email Template from DB
    subject = frappe.render_template(email_subject, args)  # nosemgrep - trusted Email Template from DB

    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def filter_project_list(project_list: List[dict]) -> List[Any]:
    """Filter projects that have met or exceeded their reminder threshold.

    Handles different billing types:
    - Retainer: calculated based on consumed hours vs budget hours.
    - Time and Material: calculated based on total billable amount vs estimated costing.

    Args:
        project_list (List[dict]): List containing project records (e.g., as returned by frappe.get_all).

    Returns:
        List[Any]: List of Project documents exceeding their threshold limit.
    """
    need_to_send_reminder_project_list = []
    for project_row in project_list:
        project = frappe.get_doc("Project", project_row.get("name"))

        project_threshold = 0.0

        if project.custom_billing_type == "Retainer":
            custom_project_budget_hours = project.custom_project_budget_hours
            if len(custom_project_budget_hours) == 0:
                continue

            last_budget = custom_project_budget_hours[-1]
            hours_purchased = last_budget.hours_purchased
            if not hours_purchased:
                continue

            project_threshold = (last_budget.consumed_hours * 100.0) / hours_purchased

        elif project.custom_billing_type == "Time and Material":
            # Fix local variable 'custom_project_budget_hours' bug by referencing the Project document directly
            estimated_costing = project.estimated_costing
            if not estimated_costing:
                continue

            project_threshold = (project.total_billable_amount * 100.0) / estimated_costing

        else:
            continue

        if project.custom_reminder_threshold_percentage <= project_threshold and project.custom_email_template:
            need_to_send_reminder_project_list.append(project)

    return need_to_send_reminder_project_list
