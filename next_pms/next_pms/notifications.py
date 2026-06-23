import frappe
from frappe import _
from frappe.utils import formatdate, get_fullname, getdate

from next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications import create_notification


def get_followers(doctype, name):
    return frappe.get_all(
        "Document Follow",
        filters={"ref_doctype": doctype, "ref_docname": name},
        pluck="user",
    )


def get_reviewer(employee):
    reports_to = frappe.db.get_value("Employee", employee, "reports_to")
    return frappe.db.get_value("Employee", reports_to, "user_id")


def risk_on_update(doc, method=None):
    """Notify followers of a Risk when its status changes."""
    if not doc.status:
        return

    previous = doc.get_doc_before_save()
    if not previous or previous.status == doc.status:
        return

    actor = frappe.session.user
    project_name = frappe.db.get_value("Project", doc.project, "project_name")
    label = _("{0} updated the risk status to {1} in {2}").format(get_fullname(actor), doc.status, project_name)

    for user in get_followers("Risk", doc.name):
        if user == actor:
            continue
        create_notification(user, label, "Risk", doc.name)


def project_on_update(doc, method=None):
    """Notify the project manager and followers when the project health (RAG) changes."""
    if not doc.custom_project_rag_status:
        return

    previous = doc.get_doc_before_save()
    if not previous or previous.custom_project_rag_status == doc.custom_project_rag_status:
        return

    actor = frappe.session.user
    label = _("Project health for {0} is now {1}").format(doc.project_name, doc.custom_project_rag_status)

    recipients = set(get_followers("Project", doc.name))
    if doc.custom_project_manager:
        recipients.add(doc.custom_project_manager)
    recipients.discard(actor)

    for user in recipients:
        create_notification(user, label, "Project", doc.name)


def customer_feedback_on_submit(doc, method=None):
    """Notify the project manager(s) of the related project(s) when customer feedback is received."""
    if doc.flags.get("next_pms_customer_feedback_notified"):
        return
    doc.flags.next_pms_customer_feedback_notified = True

    projects = frappe.get_all(
        "Customer Feedback Project",
        filters={"parent": doc.customer_feedback_schedule, "parenttype": "Customer Feedback Schedule"},
        pluck="project",
    )

    date = formatdate(getdate(doc.feedback_to_date), "dd/mm/yyyy")
    for project in projects:
        manager = frappe.db.get_value("Project", project, "custom_project_manager")
        if not manager:
            continue
        project_name = frappe.db.get_value("Project", project, "project_name")
        label = _("{0} client feedback received for {1}").format(date, project_name)
        create_notification(manager, label, "Customer Feedback", doc.name)


def send_review_reminders():
    """Nightly: notify each reviewer of how many timesheets are pending their review."""
    pending = frappe.get_all(
        "Timesheet",
        filters={"custom_approval_status": "Approval Pending", "docstatus": 0},
        fields=["name", "employee", "start_date", "end_date"],
        order_by="modified desc",
    )

    by_reviewer = {}
    reviewer_cache = {}
    for ts in pending:
        if ts.employee not in reviewer_cache:
            reviewer_cache[ts.employee] = get_reviewer(ts.employee)
        reviewer = reviewer_cache[ts.employee]
        if not reviewer:
            continue

        start, end = getdate(ts.start_date), getdate(ts.end_date)
        entry = by_reviewer.get(reviewer)
        if not entry:
            by_reviewer[reviewer] = {
                "count": 1,
                "timesheet": ts.name,
                "start_date": start,
                "end_date": end,
            }
            continue

        entry["count"] += 1
        entry["start_date"] = min(entry["start_date"], start)
        entry["end_date"] = max(entry["end_date"], end)

    for reviewer, entry in by_reviewer.items():
        label = _("You have {0} timesheets to review between {1} and {2}").format(
            entry["count"],
            formatdate(entry["start_date"], "dd/mm/yyyy"),
            formatdate(entry["end_date"], "dd/mm/yyyy"),
        )
        create_notification(reviewer, label, "Timesheet", entry["timesheet"])
