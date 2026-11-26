import frappe
from frappe import _
from frappe.utils import formatdate

from next_pms.customer_feedback.doctype.customer_feedback_settings.customer_feedback_settings import (
    get_branding,
    get_fetch_error_message,
)


def get_context(context):
    context.no_cache = 1
    context.update(get_branding())

    token = frappe.form_dict.get("token")

    # ?token=a&token=b arrives as a list, which get_all would read as an operator
    if not token or not isinstance(token, str):
        context.error = _("No token provided. Unable to fetch employee list.")
        return context

    schedule_doc = frappe.get_all(
        "Customer Feedback Schedule",
        filters={
            "schedule_unique_token": token,
        },
        fields="*",
    )

    if len(schedule_doc) < 1 or schedule_doc[0].feedback_type != "Project":
        context.error = get_fetch_error_message(context.support_email)
        return context

    schedule_doc = schedule_doc[0]

    # Fetch only the selected projects from the child table
    projects = frappe.get_all(
        "Customer Feedback Project",
        filters={
            "parent": schedule_doc.name,
            "parenttype": "Customer Feedback Schedule",
            "parentfield": "projects",
        },
        fields=["project as name", "project_name"],
        order_by="idx ASC",
    )

    # populate context
    context.projects = projects
    context.feedback_from_date = formatdate(schedule_doc.feedback_from_date, "dd MMM yyyy")
    context.feedback_to_date = formatdate(schedule_doc.feedback_to_date, "dd MMM yyyy")
    context.feedback_by = schedule_doc.feedback_by
    context.customer = schedule_doc.customer
    context.feedback_link = f"/customer-feedback/new?token={token}"

    return context
