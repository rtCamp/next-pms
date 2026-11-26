# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import formatdate, getdate, now, nowdate

from next_pms.customer_feedback.doctype.customer_feedback_schedule.customer_feedback_schedule import (
    get_webform_details,
)
from next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications import create_notification


def resolve_token(token: str | None) -> dict:
    """Look the token up and spend it in one step, so a token can be used exactly once.

    The locking read is the compare-and-clear: a second concurrent post blocks on the row
    until the first commits, then finds the token already cleared.
    """
    details = get_webform_details(token)  # PermissionError on a missing or spent token

    if details["feedback_type"] == "Project":
        doctype, field = "Customer Feedback Schedule", "schedule_unique_token"
        filters = {"name": details["schedule_id"], field: token}
    else:
        doctype, field = "Customer Feedback Employee", "unique_token"
        filters = {"parent": details["schedule_id"], "employee": details["employee_id"], field: token}
    row = frappe.db.get_value(doctype, filters, "name", for_update=True)
    if not row:
        frappe.throw(_("Invalid token"), frappe.PermissionError)
    frappe.db.set_value(doctype, row, field, None)
    return details


class CustomerFeedback(Document):
    def before_insert(self):
        """A web-form submission is accepted only with a live token, and every field that
        identifies the schedule, customer, contact and employee comes from that token,
        never from the posted values. Desk and API inserts by signed-in users skip this."""
        if not frappe.flags.in_web_form and frappe.session.user != "Guest":
            return
        details = resolve_token(self.get("token"))  # virtual field: absent unless the web form set it
        self.customer_feedback_schedule = details["schedule_id"]
        self.customer = details["customer"]
        self.feedback_by = details["feedback_by"]
        self.contact_email = frappe.db.get_value("Contact", details["feedback_by"], "email_id")
        self.feedback_from_date = details["feedback_from_date"]
        self.feedback_to_date = details["feedback_to_date"]
        self.evaluation_type = details["evaluation_type"]
        self.feedback_for = details.get("employee_id")
        self.feedback_for_name = details.get("employee_name")
        self.token = None

    def before_save(self):
        """
        Set the name of the Customer Feedback based on the evaluation type
        - For project evaluation, the name should be CUSTF-<current_year>-<serial_number>
        - For resource evaluation, the name should be CUSTF-<feedback_for>-<current_year>-<serial_number>
        """
        current_year = nowdate().split("-")[0]
        if self.evaluation_type == "Project":
            self.name = make_autoname(f"CUSTF-{current_year}-.####")
        else:
            self.name = make_autoname(f"CUSTF-{self.feedback_for}-{current_year}-.####")

    def after_insert(self):
        # remove the tokens, issued token is valid only once
        schedule_doc = frappe.get_doc("Customer Feedback Schedule", self.customer_feedback_schedule)

        # db_set, not save: spending a token should not re-validate the whole schedule on every guest submit
        if schedule_doc.feedback_type == "Resource":
            for customer_feedback_employee in schedule_doc.resources:
                if self.feedback_for == customer_feedback_employee.employee:
                    customer_feedback_employee.db_set("unique_token", None)
            # Bump the parent too, so a stale open schedule form cannot write the spent token back on its next Update
            schedule_doc.db_set("modified", now(), update_modified=False)

        if schedule_doc.feedback_type == "Project":
            schedule_doc.db_set("schedule_unique_token", None)

        # Submit the feedback
        self.submit()

    def on_submit(self):
        """Notify the project manager of each project on the schedule that client feedback arrived."""
        # after_insert submits, and insert() then runs the post-save methods again with _action still "submit"
        if self.flags.project_managers_notified:
            return
        self.flags.project_managers_notified = True

        projects = frappe.get_all(
            "Customer Feedback Project",
            filters={"parent": self.customer_feedback_schedule, "parenttype": "Customer Feedback Schedule"},
            pluck="project",
        )

        date = formatdate(getdate(self.feedback_to_date), "dd/mm/yyyy")
        for project in projects:
            manager, project_name = frappe.db.get_value(
                "Project", project, ["custom_project_manager", "project_name"]
            ) or (None, None)
            if not manager:
                continue
            label = _("{0} client feedback received for {1}").format(date, project_name)
            title = _("Client feedback available")
            url = f"/next-pms/projects/{project}?tab=feedback"
            create_notification(manager, title, label, "Customer Feedback", self.name, url=url)
