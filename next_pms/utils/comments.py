"""Threaded comments on a document, stored as Comment rows.

A reply links to its parent through custom_reply_to (from frappe_comment_xt).
Deleting a comment blanks its content, so a blank comment is a soft-delete
tombstone: it stays in the thread to keep its replies anchored.
"""

import frappe
from frappe import _
from frappe.utils import strip_html_tags
from frappe.utils.user import get_user_fullname

from next_pms.next_projects.api.utils import get_user_details_map


def is_blank(content: str | None) -> bool:
    """Whether the comment body has no visible text."""
    return not strip_html_tags(content or "").strip()


def ensure_comment_author(doc):
    """Guard: only the comment's author or Administrator may modify it."""
    if frappe.session.user != "Administrator" and doc.owner != frappe.session.user:
        frappe.throw(_("You can only modify your own comments"), frappe.PermissionError)


def get_comment_doc(comment_name: str, reference_doctype: str):
    """Load a Comment and verify it is a user comment on a `reference_doctype` record."""
    if not comment_name or not frappe.db.exists("Comment", comment_name):
        frappe.throw(_("Comment {0} not found").format(comment_name), frappe.DoesNotExistError)
    doc = frappe.get_doc("Comment", comment_name)
    if doc.comment_type != "Comment" or doc.reference_doctype != reference_doctype or not doc.reference_name:
        frappe.throw(_("Comment {0} not found").format(comment_name), frappe.DoesNotExistError)
    return doc


def insert_comment(reference_doctype: str, reference_name: str, comment: str, reply_to: str | None = None):
    """Add a comment, or a reply to a comment on the same record, authored by the session user."""
    if is_blank(comment):
        frappe.throw(_("Comment cannot be empty"))
    if reply_to:
        parent = frappe.db.get_value(
            "Comment", reply_to, ["comment_type", "reference_doctype", "reference_name"], as_dict=True
        )
        if (
            not parent
            or parent.comment_type != "Comment"
            or parent.reference_doctype != reference_doctype
            or parent.reference_name != reference_name
        ):
            frappe.throw(_("Parent comment {0} not found").format(reply_to))

    return frappe.get_doc(
        {
            "doctype": "Comment",
            "comment_type": "Comment",
            "reference_doctype": reference_doctype,
            "reference_name": reference_name,
            "content": comment.replace(' data-type="mention"', ""),
            "comment_email": frappe.session.user,
            "comment_by": get_user_fullname(frappe.session.user),
            "custom_reply_to": reply_to,
        }
    ).insert(ignore_permissions=True)


def update_comment_content(doc, comment: str):
    """Replace a live comment's body; only its author or Administrator may do so."""
    ensure_comment_author(doc)
    if is_blank(doc.content):
        frappe.throw(_("This comment has been deleted and can no longer be edited"))
    if is_blank(comment):
        frappe.throw(_("Comment cannot be empty"))

    doc.content = comment.replace(' data-type="mention"', "")
    doc.save(ignore_permissions=True)


def soft_delete_comment(doc):
    """Blank a comment's body, keeping it as a tombstone that anchors its replies."""
    ensure_comment_author(doc)
    if is_blank(doc.content):
        frappe.throw(_("This comment has already been deleted"))

    doc.content = ""
    doc.save(ignore_permissions=True)


def get_comment_tree(reference_doctype: str, reference_name: str) -> list[dict]:
    """Fetch all user comments of a record, roots oldest first with replies nested."""
    rows = frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": reference_doctype,
            "reference_name": reference_name,
            "comment_type": "Comment",
        },
        fields=["name", "owner", "content", "creation", "modified", "custom_reply_to"],
        order_by="creation asc",
    )
    user_map = get_user_details_map([row.owner for row in rows])
    names = {row.name for row in rows}
    children_by_parent = {}
    roots = []
    for row in rows:
        if row.custom_reply_to in names:
            children_by_parent.setdefault(row.custom_reply_to, []).append(row)
        else:
            roots.append(row)
    return [serialize_comment(row, user_map, children_by_parent) for row in roots]


def serialize_comment(row, user_map: dict, children_by_parent: dict) -> dict:
    """Serialize one Comment row with its replies nested recursively."""
    user = user_map.get(row.owner) or {}
    deleted = is_blank(row.content)
    replies = [serialize_comment(child, user_map, children_by_parent) for child in children_by_parent.get(row.name, [])]
    return {
        "name": row.name,
        "user": row.owner,
        "user_full_name": user.get("full_name") or row.owner,
        "user_image": user.get("user_image"),
        "comment": "" if deleted else row.content,
        "reply_to": row.custom_reply_to,
        "created_at": row.creation,
        "modified_at": row.modified,
        "edited": not deleted and row.modified != row.creation,
        "deleted": deleted,
        "deleted_at": row.modified if deleted else None,
        "reply_count": len(replies),
        "replies": replies,
    }
