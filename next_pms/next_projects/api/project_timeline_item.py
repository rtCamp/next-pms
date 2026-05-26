# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from typing import Literal

import frappe
from frappe import only_for, whitelist
from frappe.utils import add_to_date, cint, getdate, today

from next_pms.api.utils import error_logger
from next_pms.next_projects.api.constant import ALLOWED_ROLES, TIMELINE_ITEM_FIELDS
from next_pms.next_projects.api.utils import get_user_image_map


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

    # item_owner is a Link → User; full_name is fetched via fetch_from on the doctype
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
            "full_name": item.get("item_owner_name") or "",
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
    type: Literal["Milestone", "Touchpoint"] | None = None,
    start: int = 0,
    limit: int = 20,
    start_date: str | None = None,
    max_week: int = 4,
    is_calendar: bool = False,
):
    """
    Get all Project Timeline Items (complete and incomplete) for a project.

    Args:
        project: Project name to filter by
        type: "Milestone" or "Touchpoint" — omit to fetch both
        start: Pagination offset
        limit: Page size
        start_date: ISO date string (e.g. "2026-05-05"); used as the range start
            for planned_end_date filtering
        max_week: Number of weeks from start_date to use as the range end
        is_calendar: Pass "1"/1/True to skip the bulk-fetch of owner images and
            watchers (e.g. for calendar views where those fields are not rendered).
            Accepts "0"/"1" string values from HTTP query params — coerced via
            cint() before use so "0" is correctly treated as falsy.

    Returns:
        {"data": [...], "total_count": int, "has_more": bool}
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(frappe._("project is required"))

    is_calendar = bool(cint(is_calendar))

    filters = {
        "project": project,
    }

    if type:
        filters["type"] = type

    if start_date and max_week:
        end_date = add_to_date(getdate(start_date), weeks=cint(max_week))
        filters["start_date"] = ["between", [getdate(start_date), end_date]]

    items = frappe.get_all(
        "Project Timeline Item",
        filters=filters,
        fields=TIMELINE_ITEM_FIELDS,
        limit_start=cint(start),
        limit_page_length=cint(limit),
        order_by="start_date asc, planned_end_date asc",
    )

    total_count = frappe.db.count("Project Timeline Item", filters=filters)
    has_more = cint(start) + cint(limit) < total_count

    item_names = [item.get("name") for item in items if item.get("name")]

    if is_calendar:
        user_image_map = {}
        watchers_map = {}
    else:
        # Bulk-fetch owner images; item_owner is a Link → User
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
def create_project_timeline_item(
    project: str,
    type: Literal["Milestone", "Touchpoint"],
    title: str,
    item_owner: str,
    start_date: str | None = None,
    planned_end_date: str | None = None,
):
    """
    Create a new Project Timeline Item (Milestone or Touchpoint).


    Args:
        project: Project name to link
        type: "Milestone" or "Touchpoint"
        title: Name of the milestone / touchpoint
        item_owner: User name (email) of the owner
        start_date: Start date — optional; if not set, the item will be considered active immediately
        planned_end_date: Completion date

    Returns:
        The created item's name, title, type, and dates.
    """
    only_for(ALLOWED_ROLES, message=True)

    title = (title or "").strip()
    item_owner = (item_owner or "").strip()

    if not project:
        frappe.throw(frappe._("Project is required"))
    if not title:
        frappe.throw(frappe._("Title is required"))
    if not item_owner:
        frappe.throw(frappe._("Item Owner is required"))
    if type not in ("Milestone", "Touchpoint"):
        frappe.throw(frappe._("Type must be Milestone or Touchpoint"))
    if not frappe.db.exists("User", item_owner):
        frappe.throw(frappe._("User {0} does not exist").format(item_owner))
    if type == "Touchpoint" and start_date:
        frappe.throw(frappe._("start_date cannot be set for a Touchpoint"))

    start_date_val = getdate(start_date) if start_date else None
    planned_end_date_val = getdate(planned_end_date) if planned_end_date else None

    if start_date_val and planned_end_date_val and start_date_val > planned_end_date_val:
        frappe.throw(frappe._("start_date must not be later than planned_end_date"))

    doc = frappe.new_doc("Project Timeline Item")
    doc.project = project
    doc.type = type
    doc.title = title
    doc.item_owner = item_owner
    doc.start_date = start_date_val
    doc.planned_end_date = planned_end_date_val
    doc.is_complete = 0
    doc.insert()

    return {
        "name": doc.name,
        "title": doc.title,
        "project": doc.project,
        "type": doc.type,
        "item_owner": doc.item_owner,
        "start_date": doc.start_date,
        "planned_end_date": doc.planned_end_date,
        "is_complete": cint(doc.is_complete),
    }


@whitelist(methods=["POST"])
@error_logger
def edit_project_timeline_item(
    name: str,
    title: str | None = None,
    item_owner: str | None = None,
    start_date: str | None = None,
    planned_end_date: str | None = None,
):
    """
    Edit an existing Project Timeline Item.

    Args:
        name: Document name of the Project Timeline Item
        title: New title — must be non-empty if provided
        item_owner: New owner (User email) — must be non-empty if provided
        start_date: New start date (Milestone only); "" to clear
        planned_end_date: New planned end date; "" to clear

    Returns:
        Dict : The updated item's key fields.
    """
    only_for(ALLOWED_ROLES, message=True)

    if not name:
        frappe.throw(frappe._("Name is required"))

    doc = frappe.get_doc("Project Timeline Item", name)

    if start_date is not None and doc.type == "Touchpoint":
        frappe.throw(frappe._("start_date cannot be set for a Touchpoint"))

    if title is not None:
        title = title.strip()
        if not title:
            frappe.throw(frappe._("Title cannot be empty"))
        doc.title = title

    if item_owner is not None:
        item_owner = item_owner.strip()
        if not item_owner:
            frappe.throw(frappe._("Item Owner cannot be empty"))
        if not frappe.db.exists("User", item_owner):
            frappe.throw(frappe._("User {0} does not exist").format(item_owner))
        doc.item_owner = item_owner

    if start_date is not None:
        doc.start_date = getdate(start_date) if start_date else None

    if planned_end_date is not None:
        doc.planned_end_date = getdate(planned_end_date) if planned_end_date else None

    effective_start = doc.start_date
    effective_end = doc.planned_end_date
    if effective_start and effective_end and getdate(effective_start) > getdate(effective_end):
        frappe.throw(frappe._("start_date must not be later than planned_end_date"))

    doc.save(ignore_permissions=False)

    return {
        "name": doc.name,
        "title": doc.title,
        "project": doc.project,
        "type": doc.type,
        "item_owner": doc.item_owner,
        "start_date": doc.start_date,
        "planned_end_date": doc.planned_end_date,
        "is_complete": cint(doc.is_complete),
    }


@whitelist(methods=["POST"])
@error_logger
def mark_timeline_item_complete(name: str, is_complete: int = 1):
    """
    Mark a Project Timeline Item as complete or incomplete.

    Setting is_complete=1 also records today's date as actual_end_date.
    Reverting (is_complete=0) clears actual_end_date back to None.

    Args:
        name: Document name of the Project Timeline Item
        is_complete: 1 to mark complete, 0 to revert — accepts "0"/"1" string
            values from HTTP form params (coerced via cint())

    Returns:
        {"name": str, "is_complete": int, "actual_end_date": str | None}
    """
    only_for(ALLOWED_ROLES, message=True)

    if not name:
        frappe.throw(frappe._("Name is required"))

    doc = frappe.get_doc("Project Timeline Item", name)
    doc.is_complete = cint(is_complete)
    doc.actual_end_date = getdate() if cint(is_complete) else None
    doc.save(ignore_permissions=False)

    return {
        "name": doc.name,
        "is_complete": cint(doc.is_complete),
        "actual_end_date": doc.actual_end_date,
    }
