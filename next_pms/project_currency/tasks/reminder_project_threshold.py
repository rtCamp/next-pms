from collections import defaultdict

import frappe

from next_pms.project_currency.api.project_timesheet_billing_recalculation import (
    generate_the_error_log,
)


def send_reminder_mail():
    try:
        # Email Templates are user authored and may reference any Project field or
        # budget row, so the batched context has to mirror a full Project document.
        projects = frappe.get_all(
            "Project",
            filters={
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "status": "Open",
            },
            fields=["*"],
        )

        if not projects:
            return

        project_names = [p.name for p in projects]

        budget_hours = frappe.get_all(
            "Project Budget",
            filters={"parent": ["in", project_names], "parentfield": "custom_project_budget_hours"},
            fields=["*"],
            order_by="parent asc, idx asc",
        )

        budget_map = defaultdict(list)
        for bh in budget_hours:
            budget_map[bh.parent].append(bh)

        projects_needing_reminder = []
        for project in projects:
            project.custom_project_budget_hours = budget_map.get(project.name, [])
            threshold = calculate_threshold(project)

            if (
                threshold is not None
                and project.custom_reminder_threshold_percentage <= threshold
                and project.custom_email_template
            ):
                project.calculated_threshold = threshold
                projects_needing_reminder.append(project)

        if not projects_needing_reminder:
            return

        reminder_project_names = [p.name for p in projects_needing_reminder]

        doc_shares = frappe.get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["in", reminder_project_names]},
            fields=["share_name", "user"],
        )

        share_map = defaultdict(set)
        for ds in doc_shares:
            share_map[ds.share_name].add(ds.user)

        all_users = list({ds.user for ds in doc_shares})

        if all_users:
            pm_set = set(
                frappe.get_all(
                    "Has Role",
                    filters={
                        "role": "Projects Manager",
                        "parenttype": "User",
                        "parent": ["in", all_users],
                    },
                    pluck="parent",
                )
            )
        else:
            pm_set = set()

        template_names = list({p.custom_email_template for p in projects_needing_reminder if p.custom_email_template})

        email_templates = {}
        if template_names:
            templates = frappe.get_all(
                "Email Template",
                filters={"name": ["in", template_names]},
                fields=["name", "subject", "response_html", "response", "use_html"],
            )
            for tmpl in templates:
                email_templates[tmpl.name] = tmpl

        for project in projects_needing_reminder:
            try:
                send_reminder_mail_for_project(project, share_map, pm_set, email_templates)
            except Exception:
                # A template that does not fit its project (an hours based one on a
                # Time and Material project, say) must not stop the other reminders.
                generate_the_error_log(
                    "send_reminder_project_threshold_mail_failed",
                    msg=f"Project: {project.name}\n\n{frappe.get_traceback()}",
                    is_mute_message=True,
                )
    except Exception:
        generate_the_error_log(
            "send_reminder_project_threshold_mail_failed",
        )


def send_reminder_mail_for_project(project, share_map, pm_set, email_templates):
    """Send reminder email for a project using pre-fetched data.

    Args:
        project: Project object with fields
        share_map: Dict mapping project names to the set of users with access
        pm_set: Set of user IDs who have Projects Manager role
        email_templates: Dict mapping template names to template objects
    """
    if not project or not project.custom_email_template:
        return

    user_list = share_map.get(project.name, set())

    all_pms = sorted(user for user in user_list if user in pm_set)

    if not all_pms:
        return

    reminder_template = email_templates.get(project.custom_email_template)
    if not reminder_template:
        return

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


def calculate_threshold(project):
    """Calculate the percentage of a project's budget that has been consumed.

    Retainer projects burn prepaid hours, so the baseline is the latest budget row.
    Time and Material projects burn the order value the client has approved, so the
    baseline is total_sales_amount, matching get_total_budget in
    next_pms.next_projects.api.project.

    Args:
        project: Project object with custom fields and its budget rows attached

    Returns:
        float: Threshold percentage or None if not applicable
    """
    if project.custom_billing_type == "Retainer":
        project_budget = project.custom_project_budget_hours
        if not project_budget:
            return None

        latest_budget = project_budget[-1]
        if (
            not latest_budget.hours_purchased
            or latest_budget.hours_purchased <= 0
            or latest_budget.consumed_hours is None
        ):
            return None

        threshold = (latest_budget.consumed_hours * 100) / latest_budget.hours_purchased
        return threshold

    elif project.custom_billing_type == "Time and Material":
        if not project.total_sales_amount or project.total_sales_amount <= 0 or project.total_billable_amount is None:
            return None

        return (project.total_billable_amount * 100) / project.total_sales_amount

    return None
