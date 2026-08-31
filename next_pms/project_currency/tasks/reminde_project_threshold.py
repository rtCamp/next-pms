import frappe

from next_pms.project_currency.api.project_timesheet_billing_recalculation import (
    generate_the_error_log,
)


def send_reminder_mail():
    try:
        project_list = frappe.get_all(
            "Project",
            filters={
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "status": "Open",
            },
            fields=[
                "name",
                "project_name",
                "custom_billing_type",
                "custom_reminder_threshold_percentage",
                "custom_email_template",
                "estimated_costing",
                "total_billable_amount",
            ],
        )

        need_to_send_reminder_project_list = filter_project_list(project_list)

        if need_to_send_reminder_project_list:
            send_reminder_mails(need_to_send_reminder_project_list)
    except Exception:
        generate_the_error_log(
            "send_reminder_project_threshold_mail_failed",
        )


def send_reminder_mails(projects: list):
    project_names = [project.name for project in projects]

    doc_shares = frappe.get_all(
        "DocShare",
        fields=["share_name", "user"],
        filters={"share_doctype": "Project", "share_name": ["in", project_names]},
    )
    shared_users_by_project = {}
    for share in doc_shares:
        shared_users_by_project.setdefault(share.share_name, []).append(share.user)

    shared_users = list({share.user for share in doc_shares})
    project_managers = set(
        frappe.get_all(
            "Has Role",
            filters={
                "role": "Projects Manager",
                "parenttype": "User",
                "parent": ["in", shared_users],
            },
            pluck="parent",
        )
        if shared_users
        else []
    )

    template_names = list({project.custom_email_template for project in projects})
    templates = {
        template.name: template
        for template in frappe.get_all(
            "Email Template",
            filters={"name": ["in", template_names]},
            fields=["name", "use_html", "response_html", "response", "subject"],
        )
    }

    for project in projects:
        reminder_template = templates.get(project.custom_email_template)
        if not reminder_template:
            continue

        recipients = [user for user in shared_users_by_project.get(project.name, []) if user in project_managers]
        if not recipients:
            continue

        if reminder_template.use_html:
            email_message = reminder_template.response_html
        else:
            email_message = reminder_template.response

        args = {
            "project": project,
        }

        message = frappe.render_template(email_message, args)  # nosemgrep - trusted Email Template from DB
        subject = frappe.render_template(reminder_template.subject, args)  # nosemgrep - trusted Email Template from DB

        frappe.sendmail(recipients=recipients, subject=subject, message=message)


def filter_project_list(project_list: list):
    budget_rows = frappe.get_all(
        "Project Budget",
        filters={
            "parenttype": "Project",
            "parentfield": "custom_project_budget_hours",
            "parent": ["in", [project.name for project in project_list]],
        },
        fields=["parent", "hours_purchased", "consumed_hours"],
        order_by="parent asc, idx asc",
    )
    budget_rows_by_project = {}
    for row in budget_rows:
        budget_rows_by_project.setdefault(row.parent, []).append(row)

    need_to_send_reminder_project_list = []
    for project in project_list:
        if not project.custom_email_template:
            continue

        project_threshold = 0

        if project.custom_billing_type == "Retainer":
            custom_project_budget_hours = budget_rows_by_project.get(project.name, [])
            if len(custom_project_budget_hours) == 0:
                continue

            custom_project_budget_hours = custom_project_budget_hours[-1]
            if not custom_project_budget_hours.hours_purchased:
                continue

            project_threshold = (
                custom_project_budget_hours.consumed_hours * 100
            ) / custom_project_budget_hours.hours_purchased

        elif project.custom_billing_type == "Time and Material":
            if not project.estimated_costing:
                continue

            project_threshold = (project.total_billable_amount * 100) / project.estimated_costing

        else:
            continue

        if project.custom_reminder_threshold_percentage <= project_threshold:
            need_to_send_reminder_project_list.append(project)

    return need_to_send_reminder_project_list
