# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.query_builder import DocType

# Which rating section a resource gets, by the words in their designation.
_DESIGNATION_TO_EVALUATION_TYPE = (
    ("Project Manager", "Project Manager"),
    ("Project Coordinator", "Project Coordinator"),
    ("Quality", "Quality Engineer"),
    ("Engineer", "Engineer"),
)


def evaluation_type_for(designation: str | None) -> str:
    designation = designation or ""
    for needle, evaluation_type in _DESIGNATION_TO_EVALUATION_TYPE:
        if needle in designation:
            return evaluation_type
    return "Project Manager"


class CustomerFeedbackSchedule(Document):
    pass


@frappe.whitelist()
def get_customer_employees(customer: str | None = None):
    if not customer:
        return {}
    frappe.has_permission("Customer Feedback Schedule", throw=True)
    frappe.has_permission("Customer", doc=customer, throw=True)

    Project = DocType("Project")
    ProjectBillingTeam = DocType("Project Billing Team")
    Employee = DocType("Employee")

    query = (
        frappe.qb.from_(Project)
        .where(Project.customer == customer)
        .where(Project.custom_billing_type == "Time and Material")
        .join(ProjectBillingTeam)
        .on(ProjectBillingTeam.parent == Project.name)
        .join(Employee)
        .on(Employee.name == ProjectBillingTeam.employee)
        .select(
            Employee.name.as_("employee_id"),
            Employee.employee_name,
            Employee.designation,
        )
        .distinct()
    )

    result = query.run(as_dict=True)
    return result


@frappe.whitelist()
def get_customer_projects(customer: str | None = None) -> list:
    """
    Get the list of projects for the customer
    """
    if not customer:
        return []

    projects = frappe.get_list(
        "Project",
        filters={"customer": customer},
        fields=["name", "project_name"],
    )

    return projects


@frappe.whitelist()
def get_schedule_projects_html(schedule_name: str) -> str:
    """
    Get the selected projects from the schedule's child table as HTML.
    Used by Customer Feedback doctype to display only the projects
    that were selected in the schedule, not all customer projects.
    """
    frappe.has_permission("Customer Feedback Schedule", doc=schedule_name, throw=True)

    projects = frappe.get_all(
        "Customer Feedback Project",
        filters={
            "parent": schedule_name,
            "parenttype": "Customer Feedback Schedule",
            "parentfield": "projects",
        },
        fields=["project", "project_name"],
        order_by="idx ASC",
    )

    html_list = "<h5 style='margin-left: 0.3rem;'>Projects</h5><ul>"
    for project in projects:
        html_list += f'<li><a href="/app/project/{project.project}">{project.project_name}</a></li>'
    if not projects:
        html_list += "<li>N/A</li>"
    html_list += "</ul>"
    return html_list


@frappe.whitelist(methods=["POST"])
def send_feedback_request(doc_name: str):
    """
    Send feedback request to the contact email
    Generate unique token for the schedule for each employee
    The `schedule_unique_token` is used:
     - if feedback type is Project and ties the feedback to the projects selected
     - if feedback type is Resource, then it is used to show the Custom Portal Page resource listing
    """
    HASH_LENGTH = 56  # frappe default is 56 characters

    site_url = frappe.utils.get_url()
    web_form_url = f"{site_url}/feedback/project"
    listing_page_url = f"{site_url}/feedback/resource"

    # Generate token for all the projects/employees
    doc = frappe.get_doc("Customer Feedback Schedule", doc_name)
    doc.check_permission("write")
    contact_email, contact_name = frappe.get_value("Contact", doc.feedback_by, ["email_id", "full_name"])
    feedback_template = frappe.get_doc("Email Template", doc.email_template)

    email_message = ""
    if feedback_template.use_html:
        email_message = feedback_template.response_html
    else:
        email_message = feedback_template.response

    email_subject = feedback_template.subject

    # A re-send must not issue a new token to anyone who already answered: that would reopen their feedback
    answered = frappe.get_all(
        "Customer Feedback", filters={"customer_feedback_schedule": doc.name, "docstatus": 1}, pluck="feedback_for"
    )
    pending = [row for row in doc.resources if row.employee not in answered]
    if (doc.feedback_type == "Project" and answered) or (doc.feedback_type == "Resource" and not pending):
        frappe.throw(_("Feedback for this schedule has already been submitted"))

    # Generate the schedule token
    schedule_token = frappe.generate_hash(length=HASH_LENGTH)
    doc.schedule_unique_token = schedule_token

    args = dict()
    args["contact_name"] = contact_name
    if doc.feedback_type == "Resource":
        # Generate tokens for all employees without saving individually
        for employee_child in pending:
            employee_child.unique_token = frappe.generate_hash(length=HASH_LENGTH)
        # In case of resource, the listing page is the same for all the employees
        # The listing page will contain the list of employees and their webform links
        args["listing_page_url"] = f"{listing_page_url}?token={schedule_token}"

    elif doc.feedback_type == "Project":
        # In case of projects, there is a single web form for all the associated projects
        args["web_form_url"] = f"{web_form_url}?token={schedule_token}"

    # Save once - updates parent and all children
    doc.save()
    subject = frappe.render_template(email_subject, args)  # nosemgrep
    message = frappe.render_template(email_message, args)  # nosemgrep
    # Send email to the contact person
    frappe.sendmail(
        recipients=[contact_email],
        subject=subject,
        message=message,
    )


@frappe.whitelist(allow_guest=True)  # nosemgrep
def get_webform_details(token: str):
    if not token:
        frappe.throw(_("Invalid token"), frappe.PermissionError)

    # First check if it is a project token
    schedule_doc = None
    schedule_doc = frappe.get_all(
        "Customer Feedback Schedule",
        filters={
            "schedule_unique_token": token,
            "feedback_type": "Project",
        },
        fields=["name", "customer", "feedback_by", "feedback_from_date", "feedback_to_date"],
    )
    if schedule_doc:
        schedule_doc = schedule_doc[0]
        projects = frappe.get_all(
            "Customer Feedback Project",
            filters={
                "parent": schedule_doc.name,
                "parenttype": "Customer Feedback Schedule",
                "parentfield": "projects",
            },
            fields=["project", "project_name"],
            order_by="idx ASC",
        )
        return {
            "schedule_id": schedule_doc.name,
            "customer": schedule_doc.customer,
            "feedback_type": "Project",
            "evaluation_type": "Project",
            "feedback_by": schedule_doc.feedback_by,
            "feedback_from_date": schedule_doc.feedback_from_date,
            "feedback_to_date": schedule_doc.feedback_to_date,
            "projects": projects,
            "brand_title": frappe.db.get_single_value("Customer Feedback Settings", "brand_title"),
        }

    CustomerFeedbackSchedule = DocType("Customer Feedback Schedule")
    CustomerFeedbackEmployee = DocType("Customer Feedback Employee")
    Employee = DocType("Employee")

    # Build the query
    # FIXME: instead of making 3 joins, we can use simpler query?
    query = (
        frappe.qb.from_(CustomerFeedbackEmployee)
        .where(CustomerFeedbackEmployee.unique_token == token)
        .join(CustomerFeedbackSchedule)
        .on(CustomerFeedbackEmployee.parent == CustomerFeedbackSchedule.name)
        .join(Employee)
        .on(Employee.name == CustomerFeedbackEmployee.employee)
        .select(
            CustomerFeedbackSchedule.name.as_("schedule_id"),
            CustomerFeedbackSchedule.customer,
            CustomerFeedbackSchedule.feedback_type,
            CustomerFeedbackSchedule.feedback_by,
            CustomerFeedbackSchedule.feedback_from_date,
            CustomerFeedbackSchedule.feedback_to_date,
            Employee.name.as_("employee_id"),
            Employee.employee_name,
            Employee.designation,
        )
    )

    # Execute the query and get results
    result = query.run(as_dict=True)
    if not result or len(result) == 0:
        frappe.throw(_("Invalid token"), frappe.PermissionError)
    details = result[0]
    details["evaluation_type"] = evaluation_type_for(details.designation)
    details["brand_title"] = frappe.db.get_single_value("Customer Feedback Settings", "brand_title")
    return details
