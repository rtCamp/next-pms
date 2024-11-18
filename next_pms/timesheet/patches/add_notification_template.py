import os

from frappe import _, get_app_path, get_doc, read_file


def execute():
    base_path = get_app_path("next_pms", "templates", "timesheet")
    response = read_file(os.path.join(base_path, "timesheet_approval.html"))

    records = [
        {
            "doctype": "Email Template",
            "name": _("Timesheet Approval"),
            "use_html": 1,
            "response_html": response,
            "subject": _("Timesheet Approval"),
            "owner": "Administrator",
        }
    ]
    response = read_file(os.path.join(base_path, "timesheet_rejection.html"))
    records.append(
        {
            "doctype": "Email Template",
            "use_html": 1,
            "name": _("Timesheet Rejection"),
            "response_html": response,
            "subject": _("Timesheet Rejection"),
            "owner": "Administrator",
        }
    )
    for doc in records:
        get_doc(doc).insert(ignore_permissions=True, ignore_mandatory=True, ignore_if_duplicate=True)
