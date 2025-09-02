from typing import Any

import frappe
from frappe import _, enqueue
from frappe.desk.notifications import extract_mentions
from frappe.utils import now
from frappe.utils.user import get_user_fullname

from next_pms.api.utils import error_logger

ROLES = {
    "Projects Manager",
    "Projects User",
}


@frappe.whitelist()
@error_logger
def save_project_status_update(
    project: str,
    title: str,
    description: str = None,
    status: str = "Draft",
    name: str = None,
    comments: list[dict] = None,
) -> dict[str, Any]:
    """
    Create a new Project Status Update or update an existing one

    Args:
        project (str): Project ID
        title (str): Title of the update
        description (str, optional): Description of the update
        status (str, optional): Status (Draft/Review/Publish). Defaults to "Draft"
        name (str, optional): Document name for updates. If provided, updates existing doc
        comments (List[Dict], optional): List of comments

    Returns:
        Dict[str, Any]: Created/Updated document data
    """
    try:
        should_enqueue_publish_notification = False
        if not frappe.db.exists("Project", project):
            frappe.throw(_("Project '{project}' does not exist"))

        if name and frappe.db.exists("Project Status Update", name):
            doc = frappe.get_doc("Project Status Update", name)
            was_publish = doc.status == "Publish"
            doc.title = title
            doc.description = description or ""
            doc.status = status
            doc.last_edited_at = now()
            doc.last_edited_by = frappe.session.user

            if comments is not None:
                doc.comments = []
                for comment in comments:
                    comment_row = doc.append("comments", {})
                    comment_row.user = comment.get("user", frappe.session.user)
                    comment_row.comment = comment.get("comment", "")
            doc.save()

            if status == "Publish" and not was_publish:
                should_enqueue_publish_notification = True
        else:
            doc = frappe.new_doc("Project Status Update")
            doc.project = project
            doc.title = title
            doc.description = description or ""
            doc.status = status

            if comments:
                for comment in comments:
                    comment_row = doc.append("comments", {})
                    comment_row.user = comment.get("user", frappe.session.user)
                    comment_row.comment = comment.get("comment", "")
            doc.insert()
            if status == "Publish":
                should_enqueue_publish_notification = True
        if should_enqueue_publish_notification:
            enqueue(
                send_publish_notifications,
                project=project,
                title=title,
                enqueue_after_commit=True,
                queue="short",
                job_name=f"Publish Notifications for Project Status Update {doc.name}",
            )

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error saving project status update: {e!s}"))
        frappe.throw(_("Failed to save project status update: {e!s}"))


@frappe.whitelist()
@error_logger
def create_project_status_update(
    project: str, title: str, description: str = None, status: str = "Draft", comments: list[dict] = None
) -> dict[str, Any]:
    """
    Create a new Project Status Update (backward compatibility)
    """
    return save_project_status_update(project, title, description, status, None, comments)


@frappe.whitelist()
@error_logger
def get_project_status_update(name: str) -> dict[str, Any]:
    """
    Get a specific Project Status Update by name

    Args:
        name (str): Document name

    Returns:
        Dict[str, Any]: Project Status Update data with comments
    """
    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    return get_project_status_update_details(name)


@frappe.whitelist()
@error_logger
def get_project_status_updates_by_project(project: str) -> list[dict[str, Any]]:
    """
    Get all Project Status Updates for a specific project

    Args:
        project (str): Project ID

    Returns:
        List[Dict[str, Any]]: List of Project Status Updates
    """

    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project '{project}' does not exist"))

    updates = frappe.get_all(
        "Project Status Update",
        filters={"project": project},
        fields=[
            "name",
            "title",
            "description",
            "status",
            "project",
            "creation",
            "modified",
            "owner",
            "modified_by",
        ],
        order_by="creation desc",
    )

    detailed_updates = []
    for update in updates:
        detailed_update = get_project_status_update_details(update.name)
        detailed_updates.append(detailed_update)

    return detailed_updates


@frappe.whitelist()
@error_logger
def update_project_status_update(
    name: str, title: str = None, description: str = None, status: str = None
) -> dict[str, Any]:
    """
    Update an existing Project Status Update

    Args:
        name (str): Document name
        title (str, optional): New title
        description (str, optional): New description
        status (str, optional): New status

    Returns:
        Dict[str, Any]: Updated document data
    """
    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    doc = frappe.get_doc("Project Status Update", name)

    if title is not None:
        doc.title = title
    if description is not None:
        doc.description = description
    if status is not None:
        doc.status = status

    doc.save()

    return get_project_status_update_details(doc.name)


@frappe.whitelist()
@error_logger
def add_comment_to_project_status_update(name: str, comment: str, user: str = None) -> dict[str, Any]:
    """
    Add a comment to a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment (str): Comment text
        user (str, optional): User ID. Defaults to current user

    Returns:
        Dict[str, Any]: Updated document data
    """

    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    doc = frappe.get_doc("Project Status Update", name)

    comment_row = doc.append("comments", {})
    comment_row.user = user or frappe.session.user
    comment_row.comment = comment
    current_time = now()
    comment_row.created_at = current_time
    comment_row.modified_at = current_time

    doc.save()

    enqueue(
        notify_mentions,
        content=comment,
        comment_name=doc.comments[-1].name,
        project_status_update=name,
        context_type="comment",
        queue="short",
        enqueue_after_commit=True,
        job_name=f"Mention Notifications for Comment {doc.comments[-1].name}",
    )

    return get_project_status_update_details(doc.name)


@frappe.whitelist()
@error_logger
def update_comment_in_project_status_update(
    name: str,
    comment: str = "",
    comment_name: str | None = None,
) -> dict[str, Any]:
    """
    Update a specific comment in a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment (str): Updated comment text
        comment_name (str | None): Child row name of the comment

    Returns:
        Dict[str, Any]: Updated document data
    """

    if not comment_name:
        frappe.throw(_("Comment name is required"))

    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    doc = frappe.get_doc("Project Status Update", name)

    target_row = None
    for row in doc.comments:
        if row.name == comment_name:
            target_row = row
            break

    target_row.comment = comment
    target_row.modified_at = now()
    doc.save()

    enqueue(
        notify_mentions,
        content=comment,
        comment_name=target_row.name,
        project_status_update=name,
        context_type="comment_update",
        enqueue_after_commit=True,
        queue="short",
        job_name=f"Mention Notifications for Comment Update {target_row.name}",
    )

    return get_project_status_update_details(doc.name)


@frappe.whitelist()
@error_logger
def delete_comment_from_project_status_update(name: str, comment_name: str) -> dict[str, Any]:
    """
    Delete a specific comment from a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment_name (str): Comment row name

    Returns:
        Dict[str, Any]: Updated document data
    """

    if not comment_name:
        frappe.throw(_("Comment name is required"))

    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    doc = frappe.get_doc("Project Status Update", name)

    target_row = None
    for row in doc.comments:
        if row.name == comment_name:
            target_row = row
            break

    if not target_row:
        frappe.throw(_("Comment with name '{0}' not found").format(comment_name))

    doc.remove(target_row)
    doc.save()

    return get_project_status_update_details(doc.name)


def get_project_status_update_details(name: str) -> dict[str, Any]:
    """
    Helper function to get detailed Project Status Update data

    Args:
        name (str): Document name

    Returns:
        Dict[str, Any]: Detailed document data
    """
    doc = frappe.get_doc("Project Status Update", name)

    comments_with_details = []
    for comment in doc.comments:
        user_data = frappe.db.get_value("User", comment.user, ["full_name", "user_image"]) if comment.user else None

        comment_data = {
            "name": comment.name,
            "user": comment.user,
            "user_full_name": user_data[0] if user_data else comment.user,
            "user_image": user_data[1] if user_data else None,
            "comment": comment.comment,
            "created_at": comment.created_at,
            "modified_at": comment.modified_at,
            "owner": comment.owner,
            "modified_by": comment.modified_by,
        }
        comments_with_details.append(comment_data)

    owner_data = frappe.db.get_value("User", doc.owner, ["full_name", "user_image"]) if doc.owner else None

    return {
        "name": doc.name,
        "title": doc.title,
        "description": doc.description,
        "status": doc.status,
        "project": doc.project,
        "owner_full_name": owner_data[0] if owner_data else doc.owner,
        "owner_image": owner_data[1] if owner_data and owner_data[1] else "",
        "comments": comments_with_details,
        "creation": doc.creation,
        "modified": doc.modified,
        "last_edited_at": doc.last_edited_at,
        "last_edited_by": doc.last_edited_by,
        "owner": doc.owner,
        "modified_by": doc.modified_by,
        "docstatus": doc.docstatus,
    }


def notify_mentions(
    content: str,
    comment_name: str = None,
    project_status_update: str = None,
    context_type: str = "comment",
) -> dict[str, Any]:
    """
    Send notifications to mentioned users in project status updates or comments

    Args:
        content (str): The content containing mentions (HTML format)
        project_status_update (str, optional): Project Status Update document name
        context_type (str, optional): Type of context (project_status_update, comment, etc.)

    Returns:
        Dict[str, Any]: Notification results
    """

    mentioned_users = extract_mentions(content)

    if not mentioned_users:
        return {"message": "No mentions found"}

    current_user = frappe.session.user
    current_user_name = get_user_fullname(current_user)

    doc_name = project_status_update
    doc_type = "Project Status Update" if project_status_update else "Project"
    project_name = None

    if project_status_update and frappe.db.exists("Project Status Update", project_status_update):
        status_update_doc = frappe.get_doc("Project Status Update", project_status_update)
        project_name = status_update_doc.project
        update_title = status_update_doc.title
        notification_context = f"project status update '{update_title}'"
    else:
        return {"message": "No project status update found"}

    for user_email in mentioned_users:
        if user_email == current_user:
            continue

        if not frappe.db.exists("User", user_email):
            continue

        project_url = frappe.utils.get_url(f"/next-pms/project/{project_name}?tab=Project+Updates&cid={comment_name}")
        notification_doc = frappe.get_doc(
            {
                "doctype": "Notification Log",
                "subject": f"You were mentioned in {notification_context}",
                "for_user": user_email,
                "type": "Mention",
                "document_type": doc_type,
                "document_name": doc_name,
                "from_user": current_user,
                "email_content": frappe.render_template(
                    "next_pms/timesheet/templates/project_status_update/mention_notification.html",
                    {
                        "current_user_name": current_user_name,
                        "notification_context": notification_context,
                        "content": content,
                        "project_url": project_url,
                    },
                ),
                "read": 0,
            }
        )

        notification_doc.insert(ignore_permissions=True)

    return {
        "message": f"Notifications sent successfully to {len(mentioned_users)} users",
    }


def send_publish_notifications(project: str, title: str):
    """Send email notifications to employees with specified roles"""
    users = get_users_with_roles(ROLES)
    if not users:
        return
    project_url = frappe.utils.get_url(f"/next-pms/project/{project}?tab=Project+Updates")

    for user in users:
        send_project_publish_email(user, title, project, project_url)


def send_project_publish_email(user, title, project_name, project_url):
    user_doc = frappe.get_doc("User", user)
    if not user_doc.enabled or not user_doc.email:
        return

    subject = f"Project Status Update '{title}' has been published"

    message = frappe.render_template(
        "next_pms/timesheet/templates/project_status_update/publish_notification.html",
        {
            "user_doc": user_doc,
            "project_name": project_name,
            "project_url": project_url,
        },
    )

    send_html_email(user_doc.email, subject, message)


def send_html_email(recipient: str, subject: str, html_message: str) -> None:
    if not recipient:
        return
    frappe.sendmail(
        recipients=[recipient],
        subject=subject,
        message=html_message,
        now=True,
    )


def get_users_with_roles(roles: set[str]) -> list[str]:
    users = set()
    for role in roles:
        role_users = frappe.get_all(
            "Has Role",
            filters={"role": role, "parenttype": "User"},
            fields=["parent"],
        )
        for role_user in role_users:
            users.add(role_user.parent)
    return list(users)
