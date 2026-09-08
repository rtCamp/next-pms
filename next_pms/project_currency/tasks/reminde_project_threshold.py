import frappe
from frappe.utils import flt

from next_pms.project_currency.api.project_timesheet_billing_recalculation import (
    generate_the_error_log,
)

BILLING_TYPES_WITH_THRESHOLD = ("Retainer", "Time and Material")


def send_reminder_mail():
    try:
        projects = get_projects_over_threshold()
        if not projects:
            return

        project_names = [project.name for project in projects]
        recipients_by_project = get_project_manager_recipients(project_names)
        templates = get_email_templates({project.custom_email_template for project in projects})

        for project in projects:
            send_reminder_mail_for_project(
                project,
                recipients_by_project.get(project.name, []),
                templates.get(project.custom_email_template),
            )
    except Exception:
        generate_the_error_log(
            "send_reminder_project_threshold_mail_failed",
        )


def send_reminder_mail_for_project(project, recipients: list, template):
    if not recipients or not template:
        return

    email_message = template.response_html if template.use_html else template.response
    args = {"project": project}

    message = frappe.render_template(email_message, args)  # nosemgrep - trusted Email Template from DB
    subject = frappe.render_template(template.subject, args)  # nosemgrep - trusted Email Template from DB

    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def get_projects_over_threshold() -> list:
    """Load every reminder-enabled open project in two queries and keep the ones past their threshold.

    Returns:
        list: Project documents (with budget rows attached) whose consumed percentage
        has reached custom_reminder_threshold_percentage.
    """
    projects = frappe.get_all(
        "Project",
        filters={
            "custom_send_reminder_when_approaching_project_threshold_limit": 1,
            "status": "Open",
            "custom_billing_type": ["in", BILLING_TYPES_WITH_THRESHOLD],
            "custom_email_template": ["is", "set"],
        },
        fields=["*"],
    )
    if not projects:
        return []

    budget_rows_by_project = get_budget_rows_by_project([project.name for project in projects])

    over_threshold = []
    for project in projects:
        project.custom_project_budget_hours = budget_rows_by_project.get(project.name, [])

        consumed_percentage = get_consumed_percentage(project)
        if consumed_percentage is None:
            continue

        if flt(project.custom_reminder_threshold_percentage) <= consumed_percentage:
            over_threshold.append(frappe.get_doc({"doctype": "Project", **project}))

    return over_threshold


def get_consumed_percentage(project) -> float | None:
    """Return how much of the project's budget is consumed, as a percentage.

    Args:
        project (dict): Project row with custom_project_budget_hours attached, ordered by idx.

    Returns:
        float | None: Consumed percentage, or None when the project has no usable budget.
    """
    if project.custom_billing_type == "Retainer":
        if not project.custom_project_budget_hours:
            return None
        latest_budget = project.custom_project_budget_hours[-1]
        consumed, purchased = latest_budget.consumed_hours, latest_budget.hours_purchased
    else:
        consumed, purchased = project.total_billable_amount, project.estimated_costing

    if not flt(purchased):
        return None
    return flt(consumed) * 100 / flt(purchased)


def get_budget_rows_by_project(project_names: list) -> dict:
    rows = frappe.get_all(
        "Project Budget",
        filters={"parenttype": "Project", "parent": ["in", project_names]},
        fields=["*"],
        order_by="parent asc, idx asc",
    )
    rows_by_project = {}
    for row in rows:
        rows_by_project.setdefault(row.parent, []).append(row)
    return rows_by_project


def get_project_manager_recipients(project_names: list) -> dict:
    """Map each project to the users it is shared with who hold the Projects Manager role.

    Args:
        project_names (list): Project names to look up shares for.

    Returns:
        dict: Project name mapped to a list of recipient user ids.
    """
    shares = frappe.get_all(
        "DocShare",
        filters={"share_doctype": "Project", "share_name": ["in", project_names]},
        fields=["share_name", "user"],
    )
    shared_users = {share.user for share in shares if share.user}
    if not shared_users:
        return {}

    project_managers = set(
        frappe.get_all(
            "Has Role",
            filters={
                "role": "Projects Manager",
                "parenttype": "User",
                "parent": ["in", list(shared_users)],
            },
            pluck="parent",
        )
    )

    recipients_by_project = {}
    for share in shares:
        if share.user in project_managers:
            recipients = recipients_by_project.setdefault(share.share_name, [])
            if share.user not in recipients:
                recipients.append(share.user)
    return recipients_by_project


def get_email_templates(template_names: set) -> dict:
    templates = frappe.get_all(
        "Email Template",
        filters={"name": ["in", list(template_names)]},
        fields=["name", "subject", "use_html", "response", "response_html"],
    )
    return {template.name: template for template in templates}
