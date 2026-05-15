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


@frappe.whitelist(methods=["POST"])
@error_logger
def create_project_status_update(
    project: str,
    title: str,
    description: str = None,
    status: str = "Draft",
) -> dict[str, Any]:
    """
    Create a new Project Status Update

    Args:
        project (str): Project ID
        title (str): Title of the update
        description (str, optional): Description of the update
        status (str, optional): Status (Draft/Review/Publish). Defaults to "Draft"

    Returns:
        Dict[str, Any]: Created document data
    """
    try:
        should_enqueue_publish_notification = False
        if not frappe.db.exists("Project", project):
            frappe.throw(_("Project '{project}' does not exist"))

        doc = frappe.new_doc("Project Status Update")
        doc.project = project
        doc.title = title
        doc.description = description or ""
        doc.status = status
        doc.insert()

        if status == "Publish":
            should_enqueue_publish_notification = True

        if should_enqueue_publish_notification:
            enqueue(
                send_publish_notifications,
                project=project,
                title=title,
                name=doc.name,
                enqueue_after_commit=True,
                queue="short",
                job_name=f"Publish Notifications for Project Status Update {doc.name}",
            )

        return get_project_status_update_details(doc.name)

    except Exception:
        frappe.log_error(_("Error creating project status update: {e!s}"))
        frappe.throw(_("Failed to create project status update: {e!s}"))


@frappe.whitelist(methods=["GET"])
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


@frappe.whitelist(methods=["GET"])
@error_logger
def get_project_status_updates_by_project(project: str, author: str | None = None) -> list[dict[str, Any]]:
    """
    Get all Project Status Updates for a specific project

    Args:
        project (str): Project ID
        author (str, optional): Filter by owner (User.name)

    Returns:
        List[Dict[str, Any]]: List of Project Status Updates
    """

    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project '{project}' does not exist"))

    filters: dict[str, str] = {"project": project}
    if author:
        filters["owner"] = author

    updates = frappe.get_all(
        "Project Status Update",
        filters=filters,
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
        order_by="modified desc",
    )

    detailed_updates = []
    for update in updates:
        detailed_update = get_project_status_update_details(update.name)
        detailed_updates.append(detailed_update)

    return detailed_updates


@frappe.whitelist(methods=["POST"])
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


@frappe.whitelist(methods=["POST"])
@error_logger
def add_comment_to_project_status_update(
    name: str, comment: str, user: str | None = None, reply_to: str | None = None
) -> dict[str, Any]:
    """
    Add a comment or reply to a Project Status Update

    Args:
        name (str): Project Status Update document name
        comment (str): Comment text
        user (str, optional): User ID. Defaults to current user
        reply_to (str, optional): Name of the parent comment row when posting a reply

    Returns:
        Dict[str, Any]: Updated document data
    """

    if not frappe.db.exists("Project Status Update", name):
        frappe.throw(_("Project Status Update '{name}' does not exist"))

    doc = frappe.get_doc("Project Status Update", name)

    if reply_to:
        existing_names = {row.name for row in doc.comments}
        if reply_to not in existing_names:
            frappe.throw(_("Parent comment '{0}' not found").format(reply_to))

    comment_row = doc.append("comments", {})
    comment_row.user = user or frappe.session.user
    comment_row.comment = comment
    comment_row.reply_to = reply_to or None
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


@frappe.whitelist(methods=["POST"])
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


def _comment_descendant_row_names_in_removal_order(parent_name: str, rows: list) -> list[str]:
    """Collect descendant child row names in post-order (deepest first) for safe ``doc.remove``.

    Args:
        parent_name (str): Comment row ``name`` to treat as the subtree root (not included
            in the returned list; callers remove it separately after descendants).
        rows (list): Snapshot of child rows, e.g. ``list(doc.comments)`` — must not change
            during this call.

    Returns:
        list[str]: Row names under ``parent_name`` only; each branch is post-ordered so a
            row appears only after all of its ``reply_to`` descendants.

    Example thread (``reply_to`` chain: ``A`` is root, each node replies to its left neighbour):

        A -> B -> C -> D

        _comment_descendant_row_names_in_removal_order("A", rows)  # -> ["D", "C", "B"]

    Deleting **B** (B, C, D are all removed; A stays):

        _comment_descendant_row_names_in_removal_order("B", rows)  # -> ["D", "C"]
    """
    ordered: list[str] = []
    for row in rows:
        if row.reply_to == parent_name:
            ordered.extend(_comment_descendant_row_names_in_removal_order(row.name, rows))
            ordered.append(row.name)
    return ordered


@frappe.whitelist(methods=["POST"])
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

    row_snapshot = list(doc.comments)
    row_by_name = {row.name: row for row in row_snapshot}
    # remove the descendants of the comment before the comment itself
    for row_name in _comment_descendant_row_names_in_removal_order(comment_name, row_snapshot):
        doc.remove(row_by_name[row_name])

    # remove the comment itself
    doc.remove(target_row)
    doc.save()

    return get_project_status_update_details(doc.name)


def _serialize_comment(comment, user_map: dict[str, tuple]) -> dict[str, Any]:
    """Return one Project Comments child row as dict (flat, no thread tree).

    Example return shape::

        {
            "name": "a1b2c3d4e",
            "user": "jane@example.com",
            "user_full_name": "Jane Doe",
            "user_image": "/files/jane.png",
            "comment": "<p>Status looks good.</p>",
            "reply_to": "parent_comment_row_name",
            "created_at": "2025-05-14 10:00:00.000000",
            "modified_at": "2025-05-14 12:30:00.000000",
            "owner": "jane@example.com",
            "modified_by": "jane@example.com",
        }
    """
    user_details = user_map.get(comment.user)
    return {
        "name": comment.name,
        "user": comment.user,
        "user_full_name": user_details[0] if user_details else comment.user,
        "user_image": user_details[1] if user_details else None,
        "comment": comment.comment,
        "reply_to": comment.reply_to,
        "created_at": comment.created_at,
        "modified_at": comment.modified_at,
        "owner": comment.owner,
        "modified_by": comment.modified_by,
    }


def _serialize_comment_with_replies(
    comment, user_map: dict[str, tuple], replies_by_parent_name: dict[str, list]
) -> dict[str, Any]:
    """Return the same keys as ``_serialize_comment``, plus nested ``replies`` and ``reply_count``.

    Each reply element repeats this structure recursively (depth matches the ``reply_to`` chain).

    Example return shape::

        {
            "name": "root_row",
            "user": "owner@example.com",
            "user_full_name": "Owner",
            "user_image": "/files/owner.png",
            "comment": "<p>Weekly update.</p>",
            "reply_to": None,
            "created_at": "2025-05-14 09:00:00.000000",
            "modified_at": "2025-05-14 09:00:00.000000",
            "owner": "owner@example.com",
            "modified_by": "owner@example.com",
            "reply_count": 1,
            "replies": [
                {
                    "name": "reply_row",
                    "user": "peer@example.com",
                    "user_full_name": "Peer",
                    "user_image": None,
                    "comment": "<p>Thanks!</p>",
                    "reply_to": "root_row",
                    "created_at": "2025-05-14 10:00:00.000000",
                    "modified_at": "2025-05-14 10:00:00.000000",
                    "owner": "peer@example.com",
                    "modified_by": "peer@example.com",
                    "reply_count": 0,
                    "replies": [],
                }
            ],
        }
    """
    data = _serialize_comment(comment, user_map)
    children = replies_by_parent_name.get(comment.name, [])
    # this recursively serializes the replies (comment of a comment)
    data["replies"] = [_serialize_comment_with_replies(child, user_map, replies_by_parent_name) for child in children]
    data["reply_count"] = len(data["replies"])
    return data


def get_project_status_update_details(name: str) -> dict[str, Any]:
    """
    Helper function to get detailed Project Status Update data

    Args:
        name (str): Document name

    Returns:
        Dict[str, Any]: Detailed document data
    """
    doc = frappe.get_doc("Project Status Update", name)

    # make a list of all user ids part of this document
    all_user_ids = [c.user for c in doc.comments if c.user] + [doc.owner]

    # get the user map for all users part of this document
    user_map: dict[str, tuple] = {}
    if all_user_ids:
        rows = frappe.get_all(
            "User",
            filters={"name": ["in", all_user_ids]},
            fields=["name", "full_name", "user_image"],
        )
        user_map = {r.name: (r.full_name, r.user_image) for r in rows}

    # map of comment name to list of reply comments
    replies_by_parent_name: dict[str, list] = {}
    # list of root comments
    root_comments = []

    # loop through all project comments
    for c in doc.comments:
        # if the comment has a reply_to, it is a reply to another comment
        if c.reply_to:
            replies_by_parent_name.setdefault(c.reply_to, []).append(c)
        else:
            root_comments.append(c)

    # serialize the root comments and their replies
    comments_with_details = [
        _serialize_comment_with_replies(c, user_map, replies_by_parent_name) for c in root_comments
    ]

    owner_details = user_map.get(doc.owner)

    return {
        "name": doc.name,
        "title": doc.title,
        "description": doc.description,
        "status": doc.status,
        "project": doc.project,
        "owner_full_name": owner_details[0] if owner_details else doc.owner,
        "owner_image": owner_details[1] if owner_details and owner_details[1] else "",
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
                "email_content": frappe.render_template(  # nosemgrep - trusted template file
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


def send_publish_notifications(project: str, title: str, name: str):
    """Send email notifications to employees with specified roles"""
    # Disabling email notifications on project updates
    return
    users = get_users_with_roles(ROLES)
    if not users:
        return
    project_url = frappe.utils.get_url(f"/next-pms/project/{project}?tab=Project+Updates&puid={name}")

    for user in users:
        send_project_publish_email(user, title, project, project_url)


def send_project_publish_email(user, title, project_name, project_url):
    user_doc = frappe.get_doc("User", user)
    if not user_doc.enabled or not user_doc.email:
        return

    subject = f"Project Status Update '{title}' has been published"

    message = frappe.render_template(  # nosemgrep - trusted template file
        "next_pms/timesheet/templates/project_status_update/publish_notification.html",
        {
            "user_doc": user_doc,
            "project_name": project_name,
            "project_url": project_url,
            "title": title,
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
