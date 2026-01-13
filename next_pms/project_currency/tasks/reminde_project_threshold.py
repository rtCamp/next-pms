import frappe

from next_pms.project_currency.api.project_timesheet_billing_recalculation import (
    generate_the_error_log,
)


def send_reminder_mail():
    try:
        # Batch fetch all required project fields upfront
        projects = frappe.get_all(
            "Project",
            filters={
                "custom_send_reminder_when_approaching_project_threshold_limit": 1,
                "status": "Open",
            },
            fields=[
                "name",
                "custom_billing_type",
                "custom_reminder_threshold_percentage",
                "custom_email_template",
            ],
        )

        if not projects:
            return

        project_names = [p.name for p in projects]

        # Batch fetch Project Budget child table data for all projects
        budget_hours = frappe.get_all(
            "Project Budget",
            filters={"parent": ["in", project_names]},
            fields=["parent", "hours_purchased", "consumed_hours", "idx"],
            order_by="parent, idx",
        )

        # Group budget hours by project
        budget_map = {}
        for bh in budget_hours:
            if bh.parent not in budget_map:
                budget_map[bh.parent] = []
            budget_map[bh.parent].append(bh)

        # Filter projects that need reminders
        projects_needing_reminder = []
        for project in projects:
            project_budget = budget_map.get(project.name, [])
            threshold = calculate_threshold(project, project_budget)

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

        # Batch fetch DocShare for all projects needing reminder
        doc_shares = frappe.get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["in", reminder_project_names]},
            fields=["share_name", "user"],
        )

        # Group by project
        share_map = {}
        for ds in doc_shares:
            if ds.share_name not in share_map:
                share_map[ds.share_name] = []
            share_map[ds.share_name].append(ds.user)

        # Get all unique users who have access to any project
        all_users = list(set([ds.user for ds in doc_shares]))

        # Batch fetch users with "Projects Manager" role
        if all_users:
            pms = frappe.get_all(
                "Has Role",
                filters={
                    "role": "Projects Manager",
                    "parenttype": "User",
                    "parent": ["in", all_users],
                },
                fields=["parent"],
            )
            pm_set = set([pm.parent for pm in pms])
        else:
            pm_set = set()

        # Get all unique email templates
        template_names = list(set([p.custom_email_template for p in projects_needing_reminder if p.custom_email_template]))

        # Batch fetch email templates
        email_templates = {}
        if template_names:
            templates = frappe.get_all(
                "Email Template",
                filters={"name": ["in", template_names]},
                fields=["name", "subject", "response_html", "response", "use_html"],
            )
            for tmpl in templates:
                email_templates[tmpl.name] = tmpl

        # Send reminders
        for project in projects_needing_reminder:
            send_reminder_mail_for_project(project, share_map, pm_set, email_templates)
    except Exception:
        generate_the_error_log(
            "send_reminder_project_threshold_mail_failed",
        )


def send_reminder_mail_for_project(project, share_map, pm_set, email_templates):
    """Send reminder email for a project using pre-fetched data.
    
    Args:
        project: Project object with fields
        share_map: Dict mapping project names to list of users with access
        pm_set: Set of user IDs who have Projects Manager role
        email_templates: Dict mapping template names to template objects
    """
    if not project or not project.custom_email_template:
        return

    # Get users with access to this project from pre-fetched data
    user_list = share_map.get(project.name, [])
    
    # Filter to only Project Managers from pre-fetched data
    all_pms = [user for user in user_list if user in pm_set]

    if not all_pms:
        return

    # Get email template from pre-fetched data
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

    message = frappe.render_template(email_message, args)
    subject = frappe.render_template(email_subject, args)

    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def calculate_threshold(project, project_budget):
    """Calculate threshold percentage for a project.
    
    Args:
        project: Project object with custom fields
        project_budget: List of Project Budget objects for this project
    
    Returns:
        float: Threshold percentage or None if not applicable
    """
    if project.custom_billing_type == "Retainer":
        if not project_budget:
            return None

        # Use the last budget entry
        latest_budget = project_budget[-1]
        if not latest_budget.hours_purchased or latest_budget.hours_purchased == 0:
            return None

        threshold = (latest_budget.consumed_hours * 100) / latest_budget.hours_purchased
        return threshold

    elif project.custom_billing_type == "Time and Material":
        # Time and Material billing is not currently supported for threshold reminders
        # The original implementation had a bug referencing undefined fields
        # (total_billable_amount, estimated_costing) that don't exist in Project Budget.
        # TODO: Implement proper Time and Material threshold calculation if needed
        return None

    return None
