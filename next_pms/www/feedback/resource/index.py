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

    if len(schedule_doc) < 1 or schedule_doc[0].feedback_type != "Resource":
        context.error = get_fetch_error_message(context.support_email)
        return context

    schedule_doc = schedule_doc[0]
    employees_context = []
    employees_docs = frappe.get_all(
        "Customer Feedback Employee",
        filters={"parent": schedule_doc.name},
        fields=[
            "employee",
            "employee.employee_name",
            "unique_token",
            "employee.designation",
        ],
        order_by="designation ASC, employee_name ASC",
    )
    for employee in employees_docs:
        employees_context.append(
            {
                "employee_id": employee.employee,
                "employee_name": employee.employee_name,
                "designation": employee.designation,
                "is_submitted": employee.unique_token is None,
                "feedback_link": f"/customer-feedback/new?token={employee.unique_token}",
            }
        )

    # populate context
    context.employees = employees_context
    context.feedback_from_date = formatdate(schedule_doc.feedback_from_date, "dd MMM yyyy")
    context.feedback_to_date = formatdate(schedule_doc.feedback_to_date, "dd MMM yyyy")
    context.feedback_by = schedule_doc.feedback_by
    context.customer = schedule_doc.customer

    return context
