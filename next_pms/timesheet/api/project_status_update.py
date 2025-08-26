from typing import Any

import frappe
from frappe import _
from frappe.desk.notifications import extract_mentions
from frappe.utils import now
from frappe.utils.user import get_user_fullname


@frappe.whitelist()
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
        if not frappe.db.exists("Project", project):
            frappe.throw(_("Project '{project}' does not exist"))

        if name and frappe.db.exists("Project Status Update", name):
            doc = frappe.get_doc("Project Status Update", name)
            doc.title = title
            doc.description = description or ""
            doc.status = status

            if comments is not None:
                doc.comments = []
                for comment in comments:
                    comment_row = doc.append("comments", {})
                    comment_row.user = comment.get("user", frappe.session.user)
                    comment_row.comment = comment.get("comment", "")

            doc.save()
        else:
            existing_update = frappe.get_all(
                "Project Status Update", filters={"project": project}, fields=["name"], limit=1
            )

            if existing_update:
                doc = frappe.get_doc("Project Status Update", existing_update[0].name)
                doc.title = title
                doc.description = description or ""
                doc.status = status

                if comments is not None:
                    doc.comments = []
                    for comment in comments:
                        comment_row = doc.append("comments", {})
                        comment_row.user = comment.get("user", frappe.session.user)
                        comment_row.comment = comment.get("comment", "")

                doc.save()
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

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error saving project status update: {e!s}"))
        frappe.throw(_("Failed to save project status update: {e!s}"))


@frappe.whitelist()
def create_project_status_update(
    project: str, title: str, description: str = None, status: str = "Draft", comments: list[dict] = None
) -> dict[str, Any]:
    """
    Create a new Project Status Update (backward compatibility)
    """
    return save_project_status_update(project, title, description, status, None, comments)


@frappe.whitelist()
def get_project_status_update(name: str) -> dict[str, Any]:
    """
    Get a specific Project Status Update by name

    Args:
        name (str): Document name

    Returns:
        Dict[str, Any]: Project Status Update data with comments
    """
    try:
        if not frappe.db.exists("Project Status Update", name):
            frappe.throw(_("Project Status Update '{name}' does not exist"))

        return get_project_status_update_details(name)

    except Exception:
        frappe.log_error(_("Error fetching project status update: {e!s}"))
        frappe.throw(_("Failed to fetch project status update: {e!s}"))


@frappe.whitelist()
def get_project_status_updates_by_project(project: str) -> list[dict[str, Any]]:
    """
    Get all Project Status Updates for a specific project

    Args:
        project (str): Project ID

    Returns:
        List[Dict[str, Any]]: List of Project Status Updates
    """
    try:
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

    except Exception:
        frappe.log_error(_("Error fetching project status updates: {e!s}"))
        frappe.throw(_("Failed to fetch project status updates: {e!s}"))


@frappe.whitelist()
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
    try:
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

    except Exception:
        frappe.log_error(_("Error updating project status update: {e!s}"))
        frappe.throw(_("Failed to update project status update: {e!s}"))


@frappe.whitelist()
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
    try:
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

        try:
            notify_mentions(
                content=comment,
                project_status_update=name,
                context_type="comment",
                context_id=f"{name}-comment-{len(doc.comments)}",
            )
        except Exception as e:
            frappe.log_error(
                _("Failed to send mention notifications: {0}").format(str(e)), "Mention Notification Error"
            )

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error adding comment: {e!s}"))
        frappe.throw(_("Failed to add comment: {e!s}"))


@frappe.whitelist()
def update_comment_in_project_status_update(name: str, comment_idx: int, comment: str) -> dict[str, Any]:
    """
    Update a specific comment in a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment_idx (int): Comment row index
        comment (str): Updated comment text

    Returns:
        Dict[str, Any]: Updated document data
    """
    try:
        if not frappe.db.exists("Project Status Update", name):
            frappe.throw(_("Project Status Update '{name}' does not exist"))

        doc = frappe.get_doc("Project Status Update", name)

        if comment_idx < 0 or comment_idx >= len(doc.comments):
            frappe.throw(_("Invalid comment index"))

        doc.comments[comment_idx].comment = comment
        doc.comments[comment_idx].modified_at = now()
        doc.save()

        try:
            notify_mentions(
                content=comment,
                project_status_update=name,
                context_type="comment_update",
                context_id=f"{name}-comment-{comment_idx + 1}",
            )
        except Exception as e:
            frappe.log_error(
                _("Failed to send mention notifications: {0}").format(str(e)), "Mention Notification Error"
            )

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error updating comment: {e!s}"))
        frappe.throw(_("Failed to update comment: {e!s}"))


@frappe.whitelist()
def delete_comment_from_project_status_update(name: str, comment_idx: int) -> dict[str, Any]:
    """
    Delete a specific comment from a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment_idx (int): Comment row index

    Returns:
        Dict[str, Any]: Updated document data
    """
    try:
        if not frappe.db.exists("Project Status Update", name):
            frappe.throw(_("Project Status Update '{name}' does not exist"))

        doc = frappe.get_doc("Project Status Update", name)

        if comment_idx < 0 or comment_idx >= len(doc.comments):
            frappe.throw(_("Invalid comment index"))

        doc.remove(doc.comments[comment_idx])
        doc.save()

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error deleting comment: {e!s}"))
        frappe.throw(_("Failed to delete comment: {e!s}"))


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
        user_doc = frappe.get_doc("User", comment.user) if comment.user else None

        comment_data = {
            "idx": comment.idx,
            "user": comment.user,
            "user_full_name": user_doc.full_name if user_doc else comment.user,
            "user_image": user_doc.user_image if user_doc else None,
            "comment": comment.comment,
            "created_at": comment.created_at,
            "modified_at": comment.modified_at,
            "owner": comment.owner,
            "modified_by": comment.modified_by,
        }
        comments_with_details.append(comment_data)

    owner_doc = frappe.get_doc("User", doc.owner) if doc.owner else None

    return {
        "name": doc.name,
        "title": doc.title,
        "description": doc.description,
        "status": doc.status,
        "project": doc.project,
        "owner_full_name": owner_doc.full_name if owner_doc else doc.owner,
        "owner_image": owner_doc.user_image if owner_doc and owner_doc.user_image else "",
        "comments": comments_with_details,
        "creation": doc.creation,
        "modified": doc.modified,
        "owner": doc.owner,
        "modified_by": doc.modified_by,
        "docstatus": doc.docstatus,
    }


def notify_mentions(
    content: str,
    project_status_update: str = None,
    project: str = None,
    context_type: str = "comment",
    context_id: str = None,
) -> dict[str, Any]:
    """
    Send notifications to mentioned users in project status updates or comments

    Args:
        content (str): The content containing mentions (HTML format)
        project_status_update (str, optional): Project Status Update document name
        project (str, optional): Project document name
        context_type (str, optional): Type of context (project_status_update, comment, etc.)
        context_id (str, optional): ID of the specific context

    Returns:
        Dict[str, Any]: Notification results
    """
    try:
        mentioned_users = extract_mentions(content)

        if not mentioned_users:
            return {"success": True, "message": "No mentions found", "mentioned_users": [], "notifications_sent": 0}

        current_user = frappe.session.user
        current_user_name = get_user_fullname(current_user)

        doc_name = project_status_update or project or context_id
        doc_type = "Project Status Update" if project_status_update else "Project"

        if project_status_update and frappe.db.exists("Project Status Update", project_status_update):
            status_update_doc = frappe.get_doc("Project Status Update", project_status_update)
            project_name = status_update_doc.project
            update_title = status_update_doc.title
            notification_context = f"project status update '{update_title}'"
        elif project and frappe.db.exists("Project", project):
            project_doc = frappe.get_doc("Project", project)
            project_name = project_doc.name
            notification_context = f"project '{project_doc.project_name or project}'"
        else:
            project_name = project or "Unknown Project"
            notification_context = "project update"

        notifications_sent = 0
        notification_results = []

        for user_email in mentioned_users:
            try:
                if user_email == current_user:
                    continue

                if not frappe.db.exists("User", user_email):
                    notification_results.append({"user": user_email, "status": "failed", "reason": "User not found"})
                    continue

                notification_doc = frappe.get_doc(
                    {
                        "doctype": "Notification Log",
                        "subject": f"You were mentioned in {notification_context}",
                        "for_user": user_email,
                        "type": "Mention",
                        "document_type": doc_type,
                        "document_name": doc_name,
                        "from_user": current_user,
                        "email_content": f"""
                        <p>{current_user_name} mentioned you in {notification_context}:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                            {content}
                        </div>
                        <p>Click to view the full update.</p>
                    """,
                        "read": 0,
                    }
                )

                notification_doc.insert(ignore_permissions=True)

                # Send email notification (optional)
                try:
                    frappe.sendmail(
                        recipients=[user_email],
                        subject=f"You were mentioned in {notification_context}",
                        message=f"""
                            <p>Hi,</p>
                            <p>{current_user_name} mentioned you in {notification_context}:</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                                {content}
                            </div>
                            <p>You can view the full update in the project management system.</p>
                            <p>Best regards,<br>Project Management Team</p>
                        """,
                        now=True,
                    )

                    notification_results.append(
                        {"user": user_email, "status": "success", "notification_id": notification_doc.name}
                    )
                    notifications_sent += 1

                except Exception as email_error:
                    frappe.log_error(f"Failed to send email to {user_email}: {email_error!s}")
                    notification_results.append(
                        {
                            "user": user_email,
                            "status": "partial",
                            "notification_id": notification_doc.name,
                            "reason": "Email failed but notification created",
                        }
                    )
                    notifications_sent += 1

            except Exception as user_error:
                frappe.log_error(_("Failed to notify user {0}: {1}").format(user_email, str(user_error)))
                notification_results.append({"user": user_email, "status": "failed", "reason": str(user_error)})

        return {
            "success": True,
            "message": f"Processed mentions for {len(mentioned_users)} users",
            "mentioned_users": mentioned_users,
            "notifications_sent": notifications_sent,
            "notification_results": notification_results,
            "context": {
                "type": context_type,
                "document_type": doc_type,
                "document_name": doc_name,
                "project": project_name,
            },
        }

    except Exception as e:
        frappe.log_error(_("Error in notify_mentions: {0}").format(str(e)))
        frappe.throw(_("Failed to process mentions: {0}").format(str(e)))
