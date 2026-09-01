# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _, enqueue, only_for
from frappe.desk.notifications import extract_mentions
from frappe.query_builder import DocType, Order
from frappe.utils import cint, getdate, strip_html_tags
from frappe.utils.user import get_user_fullname

from next_pms.next_projects.api.constant import (
    ALLOWED_ROLES,
    DEFAULT_STAR_MAX,
    RATING_FIELDS,
    RESOURCE_RATING_FIELDS,
    TEXT_FIELDS,
)
from next_pms.next_projects.api.utils import (
    get_contact_image,
    get_contact_image_map,
    get_employee_image,
    get_employee_image_map,
    get_user_details_map,
)


def is_customer_feedback_available() -> bool:
    """Whether the rtcamp Customer Feedback module is available on this site."""
    return "rtcamp" in frappe.get_installed_apps()


def ensure_customer_feedback_available():
    """Guard: refuse to run unless the rtcamp Customer Feedback module is installed."""
    if not is_customer_feedback_available():
        frappe.throw(_("Customer Feedback module (rtcamp) is not installed"))


def _mean(values: list) -> float | None:
    """Mean of the non-null values, or ``None`` when there is nothing to average."""
    nums = [v for v in values if v is not None]
    if not nums:
        return None
    return sum(nums) / len(nums)


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_customer_feedback_availability():
    """Report whether the Customer Feedback feature can be used on this site.

    Lets the frontend decide whether to render the dashboards without triggering a guard
    error on the data endpoints.

    Returns:
        dict: ``{ available: bool }`` — ``True`` when the rtcamp app is installed.
    """
    only_for(ALLOWED_ROLES, message=True)
    return {"available": is_customer_feedback_available()}


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_project_feedback_timeline(
    project: str, from_date: str | None = None, to_date: str | None = None, limit: int = 18
):
    """Monthly project-feedback scores for the scrollable timeline bar.

    Anchored on Customer Feedback Schedule so scheduled-but-unanswered months are still
    returned (with ``score``/``feedback_id`` as ``None``) and render as a placeholder.

    Params:
        project: Project name to build the timeline for (required).
        from_date / to_date: optional window applied to the schedule ``feedback_to_date``.
        limit: maximum number of months to return (default 18), oldest first.

    Returns:
        list[dict]: ``{ period_from, period_to, month, year, label, score, feedback_id }``
        where ``score`` is an int 0-100 (or ``None`` when pending) and ``feedback_id`` is
        the Customer Feedback name to pass to ``get_project_feedback_breakdown``.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    if not project:
        frappe.throw(_("Project is required"))
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found").format(project), frappe.DoesNotExistError)

    CFS = DocType("Customer Feedback Schedule")
    CFP = DocType("Customer Feedback Project")
    CF = DocType("Customer Feedback")

    project_ratings = RATING_FIELDS["Project"]
    query = (
        frappe.qb.from_(CFS)
        .inner_join(CFP)
        .on((CFP.parent == CFS.name) & (CFP.parenttype == "Customer Feedback Schedule") & (CFP.project == project))
        .left_join(CF)
        .on((CF.customer_feedback_schedule == CFS.name) & (CF.evaluation_type == "Project") & (CF.docstatus == 1))
        .where(CFS.feedback_type == "Project")
        .select(
            CFS.feedback_from_date,
            CFS.feedback_to_date,
            CF.name.as_("feedback_id"),
            *[getattr(CF, field) for field in project_ratings],
        )
        .orderby(CFS.feedback_to_date, order=Order.asc)
        .limit(cint(limit))
    )
    if from_date:
        query = query.where(CFS.feedback_to_date >= getdate(from_date))
    if to_date:
        query = query.where(CFS.feedback_to_date <= getdate(to_date))

    timeline = []
    for row in query.run(as_dict=True):
        period = getdate(row.feedback_from_date)
        mean = _mean([row.get(field) for field in project_ratings]) if row.feedback_id else None
        timeline.append(
            {
                "period_from": row.feedback_from_date,
                "period_to": row.feedback_to_date,
                "month": period.month,
                "year": period.year,
                "label": period.strftime("%b"),
                "score": round(mean * 100) if mean is not None else None,
                "feedback_id": row.feedback_id,
            }
        )
    return timeline


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_project_feedback_breakdown(feedback_name: str, project: str | None = None):
    """Per-month breakdown for a single project feedback record.

    Params:
        feedback_name: Customer Feedback name (``evaluation_type == 'Project'``), as
            returned in the timeline's ``feedback_id``.
        project: Optional Project name for scoping access.

    Returns:
        dict: ``{ feedback_id, period_from, period_to, overall_score, ratings, responses }``
        where ``ratings`` is a list of ``{ fieldname, label, value, percent, stars,
        star_max }`` and ``responses`` a list of ``{ fieldname, label, answer }``.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()

    if project:
        frappe.has_permission("Project", doc=project, ptype="read", throw=True)
        ensure_feedback_belongs_to_project(feedback_name, project)
    else:
        customer = frappe.db.get_value("Customer Feedback", feedback_name, "customer")
        if customer:
            roles = frappe.get_roles()
            if not ("System Manager" in roles or frappe.session.user == "Administrator"):
                customer_projects = frappe.get_all("Project", filters={"customer": customer}, pluck="name")
                if not customer_projects or not any(
                    frappe.has_permission("Project", doc=p, ptype="read") for p in customer_projects
                ):
                    frappe.throw(_("Not permitted to view feedback for {0}").format(customer), frappe.PermissionError)

    rating_fields = RATING_FIELDS["Project"]
    text_fields = TEXT_FIELDS["Project"]
    data = frappe.db.get_value(
        "Customer Feedback",
        feedback_name,
        ["evaluation_type", "feedback_from_date", "feedback_to_date", *rating_fields, *text_fields],
        as_dict=True,
    )
    if not data:
        frappe.throw(_("Customer Feedback {0} not found").format(feedback_name), frappe.DoesNotExistError)
    if data.evaluation_type != "Project":
        frappe.throw(_("{0} is not a project feedback").format(feedback_name))

    meta = frappe.get_meta("Customer Feedback")
    ratings = []
    for fieldname in rating_fields:
        field = meta.get_field(fieldname)
        value = data.get(fieldname)
        ratings.append(
            {
                "fieldname": fieldname,
                "label": field.label,
                "value": value,
                "percent": round(value * 100) if value is not None else None,
                "stars": round(value * DEFAULT_STAR_MAX) if value is not None else None,
                "star_max": DEFAULT_STAR_MAX,
            }
        )

    responses = [
        {"fieldname": fieldname, "label": meta.get_field(fieldname).label, "answer": data.get(fieldname)}
        for fieldname in text_fields
    ]

    mean = _mean([data.get(fieldname) for fieldname in rating_fields])
    return {
        "feedback_id": feedback_name,
        "period_from": data.feedback_from_date,
        "period_to": data.feedback_to_date,
        "overall_score": round(mean * 100) if mean is not None else None,
        "ratings": ratings,
        "responses": responses,
    }


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_team_feedback_list(project: str, start: int = 0, limit: int = 20):
    """Paginated list of resource (team member) evaluations for a project's customer.

    Resolves the project's customer and returns every non-Project Customer Feedback for
    that customer, newest first.

    Params:
        project: Project name; its customer scopes the feedback (required).
        start: pagination offset (default 0).
        limit: page size (default 20).

    Returns:
        dict: ``{ data, total, has_more }`` where ``has_more`` is ``True`` when rows remain
        beyond this page, and each ``data`` row is ``{ name, period_from, period_to,
        employee, employee_name, avatar_url, customer, feedback_by, customer_avatar_url,
        contact_email, evaluation_type, average, stars, star_max }``. ``avatar_url`` is the
        employee's avatar image and ``customer_avatar_url`` is the customer contact's
        (``feedback_by``) avatar image. ``average`` is on the star scale (e.g. 2.8 of 4);
        the raw rating columns are not exposed.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    if not project:
        frappe.throw(_("Project is required"))
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found").format(project), frappe.DoesNotExistError)

    start = cint(start)
    limit = cint(limit)

    customer = frappe.db.get_value("Project", project, "customer")
    if not customer:
        return {"data": [], "total": 0, "has_more": False}

    filters = {"docstatus": 1, "evaluation_type": ["!=", "Project"], "customer": customer}

    rows = frappe.get_all(
        "Customer Feedback",
        filters=filters,
        fields=[
            "name",
            "feedback_from_date",
            "feedback_to_date",
            "feedback_for",
            "feedback_for_name",
            "customer",
            "feedback_by",
            "contact_email",
            "evaluation_type",
            *RESOURCE_RATING_FIELDS,
        ],
        order_by="feedback_to_date desc, name desc",
        limit_start=start,
        limit_page_length=limit,
    )
    employee_image_map = get_employee_image_map([row.feedback_for for row in rows if row.feedback_for])
    contact_image_map = get_contact_image_map([row.feedback_by for row in rows if row.feedback_by])
    data = []
    for row in rows:
        rating_fields = RATING_FIELDS.get(row.evaluation_type, [])
        mean = _mean([row.get(field) for field in rating_fields])
        data.append(
            {
                "name": row.name,
                "period_from": row.feedback_from_date,
                "period_to": row.feedback_to_date,
                "employee": row.feedback_for,
                "employee_name": row.feedback_for_name,
                "avatar_url": employee_image_map.get(row.feedback_for),
                "customer": row.customer,
                "feedback_by": row.feedback_by,
                "customer_avatar_url": contact_image_map.get(row.feedback_by),
                "contact_email": row.contact_email,
                "evaluation_type": row.evaluation_type,
                "average": round(mean * DEFAULT_STAR_MAX, 1) if mean is not None else None,
                "stars": round(mean * DEFAULT_STAR_MAX) if mean is not None else None,
                "star_max": DEFAULT_STAR_MAX,
            }
        )

    total = frappe.db.count("Customer Feedback", filters=filters)

    return {
        "data": data,
        "total": total,
        "has_more": start + len(data) < total,
    }


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_team_feedback_breakdown(feedback_name: str):
    """Per-record breakdown for a single resource (team member) evaluation.

    The rating questions returned depend on the record's ``evaluation_type``.

    Params:
        feedback_name: Customer Feedback name (any non-Project ``evaluation_type``), as
            returned in ``get_team_feedback_list``'s ``name``.

    Returns:
        dict: ``{ feedback_id, evaluation_type, employee, employee_name, avatar_url,
        customer, feedback_by, customer_avatar_url, period_from, period_to, average,
        ratings, areas_for_improvement }`` where ``avatar_url`` is the employee's avatar
        image, ``customer_avatar_url`` is the customer contact's (``feedback_by``) avatar
        image, and ``ratings`` is a list of ``{ fieldname, label, fieldtype, value, stars,
        star_max, percent }``.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()

    evaluation_type = frappe.db.get_value("Customer Feedback", feedback_name, "evaluation_type")
    if not evaluation_type:
        frappe.throw(_("Customer Feedback {0} not found").format(feedback_name), frappe.DoesNotExistError)
    if evaluation_type == "Project":
        frappe.throw(_("{0} is a project feedback; use the project breakdown").format(feedback_name))

    rating_fields = RATING_FIELDS.get(evaluation_type)
    if not rating_fields:
        frappe.throw(_("Unsupported evaluation type {0}").format(evaluation_type))

    info_fields = [
        "feedback_for",
        "feedback_for_name",
        "customer",
        "feedback_by",
        "feedback_from_date",
        "feedback_to_date",
        "additional_comments__feedback",
    ]
    data = frappe.db.get_value("Customer Feedback", feedback_name, [*info_fields, *rating_fields], as_dict=True)

    meta = frappe.get_meta("Customer Feedback")
    ratings = []
    for fieldname in rating_fields:
        field = meta.get_field(fieldname)
        value = data.get(fieldname)
        ratings.append(
            {
                "fieldname": fieldname,
                "label": field.label,
                "fieldtype": field.fieldtype,
                "value": value,
                "percent": round(value * 100) if value is not None else None,
                "stars": round(value * DEFAULT_STAR_MAX) if value is not None else None,
                "star_max": DEFAULT_STAR_MAX,
            }
        )

    mean = _mean([data.get(fieldname) for fieldname in rating_fields])
    return {
        "feedback_id": feedback_name,
        "evaluation_type": evaluation_type,
        "employee": data.feedback_for,
        "employee_name": data.feedback_for_name,
        "avatar_url": get_employee_image(data.feedback_for),
        "customer": data.customer,
        "feedback_by": data.feedback_by,
        "customer_avatar_url": get_contact_image(data.feedback_by),
        "period_from": data.feedback_from_date,
        "period_to": data.feedback_to_date,
        "average": round(mean * DEFAULT_STAR_MAX, 1) if mean is not None else None,
        "ratings": ratings,
        "areas_for_improvement": data.additional_comments__feedback,
    }


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_feedback_comments(feedback: str):
    """Threaded comments for a Customer Feedback record.

    Comments are stored as Comment documents referencing the feedback; a reply
    links to its parent through custom_reply_to. Deleting a comment blanks its
    content, so a blank comment is a soft-delete tombstone: it stays in the
    thread to keep its replies anchored and is returned with deleted set.

    Args:
        feedback: Customer Feedback name to list comments for.

    Returns:
        list[dict]: Root comments oldest first, each with name, user,
        user_full_name, user_image, comment, reply_to, created_at, modified_at,
        edited, deleted, deleted_at, reply_count and nested replies.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    ensure_feedback_exists(feedback)
    return get_feedback_comment_tree(feedback)


@frappe.whitelist(methods=["POST"])
def add_comment_to_feedback(feedback: str, comment: str, project: str, reply_to: str | None = None):
    """Add a comment or reply to a Customer Feedback record.

    The author is always the session user. The commenting roles have no
    doctype access to Comment or Customer Feedback, so this endpoint is the
    only write path and runs with elevated permissions.

    Args:
        feedback: Customer Feedback name to comment on.
        comment: Comment body (HTML).
        project: Project the commenter is viewing, used for mention deep-links.
        reply_to: Name of the parent comment when posting a reply.

    Returns:
        list[dict]: The refreshed comment tree, as in get_feedback_comments.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    ensure_feedback_exists(feedback)
    ensure_feedback_belongs_to_project(feedback, project)
    if is_blank(comment):
        frappe.throw(_("Comment cannot be empty"))
    if reply_to:
        parent = frappe.db.get_value(
            "Comment", reply_to, ["comment_type", "reference_doctype", "reference_name"], as_dict=True
        )
        if (
            not parent
            or parent.comment_type != "Comment"
            or parent.reference_doctype != "Customer Feedback"
            or parent.reference_name != feedback
        ):
            frappe.throw(_("Parent comment {0} not found").format(reply_to))

    frappe.get_doc(
        {
            "doctype": "Comment",
            "comment_type": "Comment",
            "reference_doctype": "Customer Feedback",
            "reference_name": feedback,
            "content": comment.replace(' data-type="mention"', ""),
            "comment_email": frappe.session.user,
            "comment_by": get_user_fullname(frappe.session.user),
            "custom_reply_to": reply_to,
        }
    ).insert(ignore_permissions=True)

    enqueue(
        notify_feedback_nextpms_mentions,
        content=comment,
        feedback=feedback,
        project=project,
        queue="short",
        enqueue_after_commit=True,
        job_name=f"Mention Notifications for Feedback Comment {feedback}",
    )
    return get_feedback_comment_tree(feedback)


@frappe.whitelist(methods=["POST"])
def update_comment_in_feedback(comment_name: str, comment: str):
    """Update a comment on a Customer Feedback record.

    Only the comment's author (or Administrator) may edit it. A soft-deleted
    comment can no longer be edited.

    Args:
        comment_name: Name of the Comment to update.
        comment: New comment body (HTML).

    Returns:
        list[dict]: The refreshed comment tree, as in get_feedback_comments.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    doc = get_feedback_comment_doc(comment_name)
    ensure_comment_author(doc)
    if is_blank(doc.content):
        frappe.throw(_("This comment has been deleted and can no longer be edited"))
    if is_blank(comment):
        frappe.throw(_("Comment cannot be empty"))

    doc.content = comment.replace(' data-type="mention"', "")
    doc.save(ignore_permissions=True)

    return get_feedback_comment_tree(doc.reference_name)


@frappe.whitelist(methods=["POST"])
def delete_comment_from_feedback(comment_name: str):
    """Soft-delete a comment on a Customer Feedback record.

    Only the comment's author (or Administrator) may delete it. The content is
    blanked while the author and thread structure are kept, so replies stay
    anchored under the tombstone.

    Args:
        comment_name: Name of the Comment to delete.

    Returns:
        list[dict]: The refreshed comment tree, as in get_feedback_comments.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()
    doc = get_feedback_comment_doc(comment_name)
    ensure_comment_author(doc)
    if is_blank(doc.content):
        frappe.throw(_("This comment has already been deleted"))

    doc.content = ""
    doc.save(ignore_permissions=True)
    return get_feedback_comment_tree(doc.reference_name)


def ensure_feedback_exists(feedback: str):
    """throw when the Customer Feedback record does not exist."""
    if not feedback or not frappe.db.exists("Customer Feedback", feedback):
        frappe.throw(_("Customer Feedback {0} not found").format(feedback), frappe.DoesNotExistError)


def ensure_feedback_belongs_to_project(feedback: str, project: str):
    """the project must exist and expose this customer's feedback."""
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found").format(project), frappe.DoesNotExistError)

    feedback_customer = frappe.db.get_value("Customer Feedback", feedback, "customer")
    project_customer = frappe.db.get_value("Project", project, "customer")
    if not feedback_customer or feedback_customer != project_customer:
        frappe.throw(_("Customer Feedback {0} is not available for Project {1}").format(feedback, project))


def get_feedback_comment_doc(comment_name: str):
    """Load a Comment and verify it belongs to a Customer Feedback record."""
    if not comment_name or not frappe.db.exists("Comment", comment_name):
        frappe.throw(_("Comment {0} not found").format(comment_name), frappe.DoesNotExistError)
    doc = frappe.get_doc("Comment", comment_name)
    if doc.comment_type != "Comment" or doc.reference_doctype != "Customer Feedback" or not doc.reference_name:
        frappe.throw(_("Comment {0} not found").format(comment_name), frappe.DoesNotExistError)
    return doc


def ensure_comment_author(doc):
    """Guard: only the comment's author or Administrator may modify it."""
    if frappe.session.user != "Administrator" and doc.owner != frappe.session.user:
        frappe.throw(_("You can only modify your own comments"), frappe.PermissionError)


def is_blank(content: str | None) -> bool:
    """Whether the comment body has no visible text."""
    return not strip_html_tags(content or "").strip()


def get_feedback_comment_tree(feedback: str) -> list[dict]:
    """Fetch and nest all comments of a Customer Feedback record."""
    rows = frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": "Customer Feedback",
            "reference_name": feedback,
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
    return [serialize_feedback_comment(row, user_map, children_by_parent) for row in roots]


def serialize_feedback_comment(row, user_map: dict, children_by_parent: dict) -> dict:
    """Serialize one Comment row with its replies nested recursively."""
    user = user_map.get(row.owner) or {}
    deleted = is_blank(row.content)
    replies = [
        serialize_feedback_comment(child, user_map, children_by_parent)
        for child in children_by_parent.get(row.name, [])
    ]
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


def notify_feedback_nextpms_mentions(content: str, feedback: str, project: str) -> None:
    """Create NextPMS notifications for users mentioned in a feedback comment."""
    project_title = frappe.db.get_value("Project", project, "project_name")
    actor = get_user_fullname(frappe.session.user)
    title = _("You got a Feedback mention")
    label = _("{0} mentioned you in feedback from {1} project").format(actor, project_title)

    for user in extract_mentions(content):
        if user == frappe.session.user or not frappe.db.exists("User", user):
            continue
        frappe.get_doc(
            {
                "doctype": "NextPMS Notifications",
                "user": user,
                "title": title,
                "label": label,
                "linked_doctype": "Customer Feedback",
                "linked_document": feedback,
                "url": f"/next-pms/projects/{project}?tab=feedback",
            }
        ).insert(ignore_permissions=True)
