# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe

from next_pms.next_pms.notifications import notify_growth_comment_mentions
from next_pms.utils.comments import (
    get_comment_doc,
    get_comment_tree,
    insert_comment,
    soft_delete_comment,
    update_comment_content,
)

GROWTH_DOCTYPE = "PMS Growth Initiative"


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_growth_comments(name: str) -> list[dict]:
    """Threaded comments on a growth initiative the session user can read.

    Returns:
        list[dict]: Root comments oldest first, each with name, user,
        user_full_name, user_image, comment, reply_to, created_at, modified_at,
        edited, deleted, deleted_at, reply_count and nested replies.
    """
    get_readable_growth(name)
    return get_comment_tree(GROWTH_DOCTYPE, name)


@frappe.whitelist(methods=["POST"])
def add_growth_comment(name: str, comment: str, reply_to: str | None = None) -> list[dict]:
    """Add a comment, or a reply to `reply_to`, and notify the users it mentions.

    Returns:
        list[dict]: The refreshed comment tree, as in get_growth_comments.
    """
    doc = get_readable_growth(name)
    insert_comment(GROWTH_DOCTYPE, name, comment, reply_to)
    notify_growth_comment_mentions(doc, comment)
    return get_comment_tree(GROWTH_DOCTYPE, name)


@frappe.whitelist(methods=["POST"])
def update_growth_comment(comment_name: str, comment: str) -> list[dict]:
    """Edit a comment; only its author or Administrator may do so.

    Returns:
        list[dict]: The refreshed comment tree, as in get_growth_comments.
    """
    doc = get_comment_doc(comment_name, GROWTH_DOCTYPE)
    get_readable_growth(doc.reference_name)
    update_comment_content(doc, comment)
    return get_comment_tree(GROWTH_DOCTYPE, doc.reference_name)


@frappe.whitelist(methods=["POST"])
def delete_growth_comment(comment_name: str) -> list[dict]:
    """Soft-delete a comment; only its author or Administrator may do so.

    Returns:
        list[dict]: The refreshed comment tree, as in get_growth_comments.
    """
    doc = get_comment_doc(comment_name, GROWTH_DOCTYPE)
    get_readable_growth(doc.reference_name)
    soft_delete_comment(doc)
    return get_comment_tree(GROWTH_DOCTYPE, doc.reference_name)


def get_readable_growth(name: str):
    doc = frappe.get_doc(GROWTH_DOCTYPE, name)
    doc.check_permission("read")
    return doc
