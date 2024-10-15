import frappe

from frappe_pms.project_currency.constant import (
    PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE,
)


def setup_reminder_project_template():
    if not frappe.db.exists(
        "Email Template", PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE
    ):
        response = '<h1>The give project has reched the project limit <a href="/app/project/{{project.name}}">{{project.name}}-{{project.project_name}}</a></h1>'

        frappe.get_doc(
            {
                "doctype": "Email Template",
                "name": PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE,
                "response_html": response,
                "subject": PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE,
                "use_html": 1,
                "custom_sender_email": frappe.db.get_value(
                    "Email Account",
                    {"default_outgoing": 1, "enable_outgoing": 1},
                    "email_id",
                ),
            }
        ).insert(ignore_permissions=True)
