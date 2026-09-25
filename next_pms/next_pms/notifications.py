import json
from urllib.parse import urlencode

import frappe
from frappe import _
from frappe.desk.notifications import extract_mentions
from frappe.utils import formatdate, get_fullname, get_url, getdate, strip_html

from next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications import create_notification, truncate

MENTION_EMAIL_TEMPLATE = "next_pms/templates/mention_notification.html"


def send_mention_notifications(
    content: str,
    title: str,
    label: str,
    linked_doctype: str,
    linked_document: str,
    url_path: str,
) -> dict:
    """Notify mentioned users via Notification Log and NextPMS Notifications."""

    mentioned_users = extract_mentions(content)
    if not mentioned_users:
        return {"message": "No mentions found"}

    current_user = frappe.session.user
    full_url = frappe.utils.get_url(url_path)
    email_content = frappe.render_template(  # nosemgrep - trusted template file
        MENTION_EMAIL_TEMPLATE, {"content": content}
    )

    for user_email in mentioned_users:
        if not user_email or user_email == current_user:
            continue
        if not frappe.db.exists("User", user_email):
            continue

        frappe.get_doc(
            {
                "doctype": "Notification Log",
                "subject": label,
                "for_user": user_email,
                "type": "Mention",
                "document_type": linked_doctype,
                "document_name": linked_document,
                "from_user": current_user,
                "link": full_url,
                "email_header": title,
                "email_content": email_content,
                "read": 0,
            }
        ).insert(ignore_permissions=True)

        frappe.get_doc(
            {
                "doctype": "NextPMS Notifications",
                "user": user_email,
                "title": title,
                "label": label,
                "linked_doctype": linked_doctype,
                "linked_document": linked_document,
                "url": url_path,
            }
        ).insert(ignore_permissions=True)

    return {"message": f"Notifications sent successfully to {len(mentioned_users)} users"}


def get_followers(doctype, name):
    return frappe.get_all(
        "Document Follow",
        filters={"ref_doctype": doctype, "ref_docname": name},
        pluck="user",
    )


def get_reviewer(employee):
    reports_to = frappe.db.get_value("Employee", employee, "reports_to")
    if not reports_to:
        return None, None
    return reports_to, frappe.db.get_value("Employee", reports_to, "user_id")


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

    title = _("Risk update")
    url = risk_deep_link(doc)
    for user in get_followers("Risk", doc.name):
        if user == actor:
            continue
        create_notification(user, title, label, "Risk", doc.name, url=url)


def risk_deep_link(doc):
    return f"/next-pms/projects/{doc.project}?tab=risks&risk={doc.name}"


def risk_owner_on_update(doc, method=None):
    """Notify a user when they are assigned or reassigned as the owner of a Risk."""
    owner = doc.risk_owner
    if not owner:
        return

    previous = doc.get_doc_before_save()
    previous_owner = previous.risk_owner if previous else None
    if owner == previous_owner or owner == frappe.session.user:
        return

    project_name = frappe.db.get_value("Project", doc.project, "project_name") or doc.project
    label = _('{0} assigned you the risk "{1}" in {2}').format(
        get_fullname(frappe.session.user), risk_summary_label(doc), project_name
    )
    create_notification(
        owner,
        _("Risk assigned"),
        label,
        "Risk",
        doc.name,
        url=risk_deep_link(doc),
        email=render_risk_owner_email(owner, doc, project_name),
    )


def risk_summary_label(doc, max_length=80):
    label = strip_html(doc.summary or "").strip()
    return truncate(label, max_length) or _("Risk")


def render_risk_owner_email(user, doc, project_name):
    """Render the assignment email now, for delivery when the notification insert is flushed.

    Rendering here rather than at flush time keeps the email describing the assignment as it was:
    the risk may be reassigned or deleted before the queue drains.
    """
    user_details = frappe.db.get_value("User", user, ["email", "enabled", "full_name"], as_dict=True)
    if not user_details or not user_details.email or not user_details.enabled:
        return None

    message = frappe.render_template(  # nosemgrep - trusted template file
        "next_pms/templates/risk/risk_owner_assigned.html",
        {
            "full_name": user_details.full_name or user,
            "risk": doc,
            "project_name": project_name,
            "risk_url": get_url(risk_deep_link(doc)),
        },
    )
    return {
        "subject": _("You have been assigned as the owner of a risk in {0}").format(project_name),
        "message": message,
    }


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

    title = _("Project health update")
    url = f"/next-pms/projects/{doc.name}?tab=rag-stats"
    for user in recipients:
        create_notification(user, title, label, "Project", doc.name, url=url)


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
        title = _("Client feedback available")
        url = f"/next-pms/projects/{project}?tab=feedback"
        create_notification(manager, title, label, "Customer Feedback", doc.name, url=url)


def send_review_reminders():
    """Nightly: notify each reviewer of how many timesheets are pending their review."""
    active_employees = frappe.get_all("Employee", filters={"status": "Active"}, pluck="name")
    if not active_employees:
        return

    pending = frappe.get_all(
        "Timesheet",
        filters={
            "custom_approval_status": "Approval Pending",
            "custom_weekly_approval_status": ["!=", "Not Submitted"],
            "docstatus": 0,
            "employee": ["in", active_employees],
        },
        fields=["name", "employee", "start_date", "end_date"],
        order_by="modified desc",
    )

    by_reviewer = {}
    reviewer_cache = {}
    for ts in pending:
        if ts.employee not in reviewer_cache:
            reviewer_cache[ts.employee] = get_reviewer(ts.employee)
        reviewer_employee, reviewer_user = reviewer_cache[ts.employee]
        if not reviewer_user:
            continue

        start, end = getdate(ts.start_date), getdate(ts.end_date)
        entry = by_reviewer.get(reviewer_user)
        if not entry:
            by_reviewer[reviewer_user] = {
                "count": 1,
                "timesheet": ts.name,
                "reviewer_employee": reviewer_employee,
                "start_date": start,
                "end_date": end,
            }
            continue

        entry["count"] += 1
        entry["start_date"] = min(entry["start_date"], start)
        entry["end_date"] = max(entry["end_date"], end)

    title = _("Timesheets to review")
    for reviewer_user, entry in by_reviewer.items():
        start = formatdate(entry["start_date"], "dd/mm/yyyy")
        end = formatdate(entry["end_date"], "dd/mm/yyyy")
        if entry["count"] == 1:
            label = _("You have 1 timesheet to review between {0} and {1}").format(start, end)
        else:
            label = _("You have {0} timesheets to review between {1} and {2}").format(entry["count"], start, end)
        date_filter = json.dumps(
            [
                {
                    "id": "date",
                    "field": "date",
                    "operator": "between",
                    "value": [entry["start_date"].isoformat(), entry["end_date"].isoformat()],
                }
            ],
            separators=(",", ":"),
        )
        query = urlencode(
            {
                "reportsTo": entry["reviewer_employee"],
                "approval": "approval-pending,partially-approved,partially-rejected",
                "compositeFilters": date_filter,
            }
        )
        url = f"/next-pms/timesheet/team?{query}"
        create_notification(reviewer_user, title, label, "Timesheet", entry["timesheet"], url=url)


def ai_allocation_after_insert(doc, method=None):
    """Notify Delivery Managers when an AI allocation is created."""
    if not getattr(doc, "is_ai_created", 0):
        return

    sync_ai_allocation_notifications(doc.project, new_doc=doc)


def sync_ai_allocation_notifications(project=None, new_doc=None):
    delivery_managers = frappe.get_all(
        "Has Role",
        filters={"role": "Delivery Manager", "parenttype": "User"},
        pluck="parent",
    )
    if not delivery_managers:
        return

    active_users = frappe.get_all(
        "User",
        filters={
            "name": ["in", list(set(delivery_managers))],
            "enabled": 1,
            "user_type": "System User",
        },
        pluck="name",
    )
    active_users = [user for user in active_users if user not in ("Administrator", "Guest")]
    if not active_users:
        return

    linked_doctype = "Project" if project else "Resource Allocation"
    linked_document = project or (new_doc.name if new_doc else "")

    if not linked_document:
        return

    # Resolve project title
    project_name = None
    if project:
        project_name = frappe.db.get_value("Project", project, "project_name") or project
    title = project_name or _("Resource Allocation")

    label = _("You have AI-generated allocations that need to be reviewed.")

    url = (
        f"/next-pms/allocations/project?{urlencode({'search': project_name})}"
        if project
        else "/next-pms/allocations/team"
    )

    for user in active_users:
        existing = frappe.db.get_value(
            "NextPMS Notifications",
            filters={
                "user": user,
                "linked_doctype": linked_doctype,
                "linked_document": linked_document,
                "viewed": 0,
            },
            fieldname="name",
        )
        if existing:
            frappe.db.set_value(
                "NextPMS Notifications",
                existing,
                {
                    "title": truncate(title, frappe.db.VARCHAR_LEN),
                    "label": truncate(label, frappe.db.VARCHAR_LEN),
                    "url": url,
                    "creation": frappe.utils.now(),
                    "modified": frappe.utils.now(),
                },
            )
        else:
            frappe.get_doc(
                {
                    "doctype": "NextPMS Notifications",
                    "user": user,
                    "title": truncate(title, frappe.db.VARCHAR_LEN),
                    "label": truncate(label, frappe.db.VARCHAR_LEN),
                    "linked_doctype": linked_doctype,
                    "linked_document": linked_document,
                    "url": url,
                    "viewed": 0,
                }
            ).insert(ignore_permissions=True)

        frappe.publish_realtime(
            event="notification",
            user=user,
            after_commit=True,
        )
