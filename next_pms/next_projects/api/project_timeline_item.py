# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from typing import Literal

import frappe
from frappe import only_for, whitelist
from frappe.utils import cint, getdate, today

from next_pms.api.utils import error_logger
from next_pms.next_projects.api.constant import ALLOWED_ROLES, TIMELINE_ITEM_FIELDS
from next_pms.next_projects.api.utils import get_user_image_map
from next_pms.timesheet.api import get_count


def get_watchers_map(item_names: list[str]) -> dict[str, list[dict]]:
    """
    Fetch watchers for multiple Project Timeline Items in a single query.

    Watchers are stored in the Document Follow doctype with:
      ref_doctype = "Project Timeline Item"
      ref_docname = <item name>
    """
    if not item_names:
        return {}

    DocumentFollow = frappe.qb.DocType("Document Follow")
    User = frappe.qb.DocType("User")

    rows = (
        frappe.qb.from_(DocumentFollow)
        .join(User)
        .on(DocumentFollow.user == User.name)
        .select(
            DocumentFollow.ref_docname,
            DocumentFollow.user,
            User.full_name,
            User.user_image,
        )
        .where(DocumentFollow.ref_doctype == "Project Timeline Item")
        .where(DocumentFollow.ref_docname.isin(item_names))
        .run(as_dict=True)
    )

    result: dict[str, list[dict]] = {name: [] for name in item_names}
    for row in rows:
        result[row.ref_docname].append(
            {
                "user": row.user,
                "full_name": row.full_name or "",
                "image": row.user_image,
            }
        )
    return result


def enrich_timeline_item(
    item: dict,
    user_image_map: dict[str, str | None],
    watchers_map: dict[str, list[dict]],
) -> dict:
    """Build the response dict for a single timeline item."""
    item_name = item.get("name")
    owner_user = item.get("item_owner") or ""

    # Resolve item_owner (Link → Contact) to name + image.
    # Contact.name is an email in Frappe; the linked User record shares the same email.
    return {
        "name": item_name,
        "title": item.get("title"),
        "project": item.get("project"),
        "type": item.get("type"),
        "is_complete": cint(item.get("is_complete")),
        "start_date": item.get("start_date"),
        "planned_end_date": item.get("planned_end_date"),
        "actual_end_date": item.get("actual_end_date"),
        "is_overdue": bool(
            item.get("planned_end_date")
            and not cint(item.get("is_complete"))
            and getdate(item.get("planned_end_date")) < getdate(today())
        ),
        "owner": {
            "user": owner_user,
            "full_name": frappe.db.get_value("Contact", owner_user, "full_name") or owner_user,
            "image": user_image_map.get(owner_user),
        }
        if owner_user
        else None,
        "watchers": watchers_map.get(item_name, []),
    }


@whitelist(methods=["GET"])
@error_logger
def get_project_timeline_items(
    project: str,
    type: Literal["Milestone", "Touchpoint"] = "Milestone",
    start: int = 0,
    limit: int = 20,
):
    """
    Get active (not completed) Project Timeline Items for a project.

    Args:
        project: Project name to filter by
        type: "Milestone" or "Touchpoint"
        start: Pagination offset
        limit: Page size

    Returns:
        {"data": [...], "total_count": int, "has_more": bool}
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(frappe._("project is required"))

    filters = {
        "project": project,
        "type": type,
        "is_complete": 0,
    }

    items = frappe.get_all(
        "Project Timeline Item",
        filters=filters,
        fields=TIMELINE_ITEM_FIELDS,
        limit_start=cint(start),
        limit_page_length=cint(limit),
        order_by="start_date asc, planned_end_date asc",
    )

    total_count = get_count("Project Timeline Item", filters=filters)
    has_more = cint(start) + cint(limit) < total_count

    item_names = [item.get("name") for item in items if item.get("name")]

    # Bulk-fetch owner user images; item_owner is a Contact (email = User name)
    owner_users = list({item.get("item_owner") for item in items if item.get("item_owner")})
    user_image_map = get_user_image_map(owner_users)

    watchers_map = get_watchers_map(item_names)

    data = [enrich_timeline_item(item, user_image_map, watchers_map) for item in items]

    return {
        "data": data,
        "total_count": total_count,
        "has_more": has_more,
    }


@whitelist(methods=["POST"])
@error_logger
def mark_timeline_item_complete(name: str, is_complete: int = 1):
    """
    Mark a Project Timeline Item as complete or incomplete.

    Args:
        name: Document name of the Project Timeline Item
        is_complete: 1 to mark complete, 0 to revert

    Returns:
        {"name": str, "is_complete": int}
    """
    only_for(ALLOWED_ROLES, message=True)

    if not name:
        frappe.throw(frappe._("name is required"))

    doc = frappe.get_doc("Project Timeline Item", name)
    doc.is_complete = cint(is_complete)
    doc.save(ignore_permissions=False)

    return {
        "name": doc.name,
        "is_complete": cint(doc.is_complete),
    }
