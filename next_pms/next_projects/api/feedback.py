# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt


import frappe
from frappe import _, only_for
from frappe.query_builder import DocType, Order
from frappe.utils import cint, getdate

from next_pms.next_projects.api.constant import (
    ALLOWED_ROLES,
    DEFAULT_STAR_MAX,
    RATING_FIELDS,
    RESOURCE_RATING_FIELDS,
    TEXT_FIELDS,
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
def get_project_feedback_breakdown(feedback_name: str):
    """Per-month breakdown for a single project feedback record.

    Params:
        feedback_name: Customer Feedback name (``evaluation_type == 'Project'``), as
            returned in the timeline's ``feedback_id``.

    Returns:
        dict: ``{ feedback_id, period_from, period_to, overall_score, ratings, responses }``
        where ``ratings`` is a list of ``{ fieldname, label, value, percent, stars,
        star_max }`` and ``responses`` a list of ``{ fieldname, label, answer }``.
    """
    only_for(ALLOWED_ROLES, message=True)
    ensure_customer_feedback_available()

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
        employee, employee_name, customer, feedback_by, contact_email, evaluation_type,
        average, stars, star_max }``. ``average`` is on the star scale (e.g. 2.8 of 4); the
        raw rating columns are not exposed.
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
                "customer": row.customer,
                "feedback_by": row.feedback_by,
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
        dict: ``{ feedback_id, evaluation_type, employee, employee_name, customer,
        feedback_by, period_from, period_to, average, ratings, areas_for_improvement }``
        where ``ratings`` is a list of ``{ fieldname, label, fieldtype, value, stars,
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
        "customer": data.customer,
        "feedback_by": data.feedback_by,
        "period_from": data.feedback_from_date,
        "period_to": data.feedback_to_date,
        "average": round(mean * DEFAULT_STAR_MAX, 1) if mean is not None else None,
        "ratings": ratings,
        "areas_for_improvement": data.additional_comments__feedback,
    }
