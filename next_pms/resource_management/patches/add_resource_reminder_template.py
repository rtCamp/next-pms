import os

from frappe import _, db, get_app_path, get_doc, read_file


def execute():
    if db.exists("Email Template", "Resource Reminder Template"):
        return
    base_path = get_app_path("next_pms", "templates", "resource_management")
    response = read_file(os.path.join(base_path, "no_resource_allocation.html"))
    doc = {
        "doctype": "Email Template",
        "name": _("Resource Reminder Template"),
        "subject": _("Missing Allocations for the Upcoming Week"),
        "response": response,
        "response_html": response,
        "use_html": 1,
        "enabled": 1,
    }
    doc = get_doc(doc).insert()

    setting = get_doc("Timesheet Settings")
    setting.allocation_email_template = doc.name
    setting.save()

    print("Resource Reminder Template Added Successfully")
