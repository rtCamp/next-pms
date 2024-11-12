import os

from frappe import _, get_app_path, get_doc, read_file
from frappe.utils import update_progress_bar


def after_install():
    add_project_manager_perm()
    setup_email_template()


def add_project_manager_perm():
    from frappe.permissions import add_permission, update_permission_property

    role = "Projects Manager"
    doctype = "Timesheet"
    perm_level = 0
    permissions = {
        perm_level: {
            "create": 0,
            "read": 0,
            "delete": 0,
            "write": 0,
            "export": 0,
            "submit": 1,
        }
    }
    add_permission(doctype, role, perm_level)
    for perm_key, perm_val in permissions[perm_level].items():
        update_permission_property(doctype, role, perm_level, perm_key, perm_val)


def setup_email_template():
    base_path = get_app_path("frappe_pms", "templates", "timesheet")
    response = read_file(os.path.join(base_path, "daily_timesheet_reminder.html"))

    records = [
        {
            "doctype": "Email Template",
            "name": _("Daily Timesheet Reminder"),
            "response": response,
            "subject": _("Daily Timesheet Reminder"),
            "owner": "Administrator",
        }
    ]
    response = read_file(os.path.join(base_path, "approval_reminder.html"))
    records.append(
        {
            "doctype": "Email Template",
            "name": _("Approval Request Reminder"),
            "response": response,
            "subject": _("Approval Request Reminder"),
            "owner": "Administrator",
        }
    )
    response = read_file(os.path.join(base_path, "weekly_approval_reminder.html"))
    records.append(
        {
            "doctype": "Email Template",
            "name": _("Weekly Approval Reminder"),
            "response": response,
            "subject": _("Weekly Approval Reminder"),
            "owner": "Administrator",
            "use_html": 1,
        }
    )
    create_docs(records)


def create_docs(records: list):
    length = len(records)
    for i, doc in enumerate(records):
        get_doc(doc).insert(ignore_permissions=True, ignore_mandatory=True, ignore_if_duplicate=True)
        update_progress_bar("Creating documents for PMS app.", i, length)
