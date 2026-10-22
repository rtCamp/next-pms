# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe import _
from frappe.utils import flt, nowdate

from next_pms.next_pms.notifications import notify_growth_comment_mentions
from next_pms.utils.comments import (
    get_comment_doc,
    get_comment_tree,
    insert_comment,
    soft_delete_comment,
    update_comment_content,
)
from next_pms.utils.permissions import has_owner_gated_permission

GROWTH_DOCTYPE = "PMS Growth Initiative"
PIPELINE_FIELDS = [
    "name",
    "activity",
    "customer",
    "project",
    "status",
    "closed_status",
    "is_closed",
    "client_priority",
    "category",
    "activity_owner",
    "project_manager",
    "billable_outcome",
    "modified",
]


@frappe.whitelist(methods=["GET"])
def get_growth_pipeline(
    currency: str = "USD",
    search: str | None = None,
    customer: str | None = None,
    activity_owner: str | None = None,
    project_manager: str | None = None,
    category: str | None = None,
    client_priority: str | None = None,
    status: str | None = None,
) -> dict:
    """Growth initiatives the session user can read, across every client, with amounts in `currency`.

    An initiative's own amounts are in its client's currency, else its project's, else the
    system default; they are converted at today's exchange rate.

    Returns:
        dict: currency; initiatives, each with its fields, project_name, currency (its own),
        converted_outcome and can_write; clients keyed by name with customer_name and
        hourly_rate in `currency` (None when the user can't read Customer).
    """
    if not frappe.db.exists("Currency", currency):
        frappe.throw(_("Currency {0} not found").format(currency))

    filters = {
        field: value
        for field, value in {
            "customer": customer,
            "activity_owner": activity_owner,
            "project_manager": project_manager,
            "category": category,
            "client_priority": client_priority,
            "status": status,
        }.items()
        if value
    }
    if search:
        filters["activity"] = ["like", f"%{search}%"]
    initiatives = frappe.get_list(
        GROWTH_DOCTYPE, fields=PIPELINE_FIELDS, filters=filters, order_by="modified desc", limit_page_length=0
    )

    clients = {
        row.name: row
        for row in frappe.get_all(
            "Customer",
            filters={"name": ["in", list({row.customer for row in initiatives if row.customer})]},
            fields=["name", "customer_name", "default_currency", "custom_hourly_rate"],
        )
    }
    projects = {
        row.name: row
        for row in frappe.get_all(
            "Project",
            filters={"name": ["in", list({row.project for row in initiatives if row.project})]},
            fields=["name", "project_name", "custom_currency"],
        )
    }

    default_currency = frappe.db.get_default("currency")
    rates = {currency: 1.0}

    def convert(amount, from_currency):
        if from_currency not in rates:
            rates[from_currency] = flt(get_exchange_rate(from_currency, currency, nowdate()))
        return flt(amount) * rates[from_currency]

    user = frappe.session.user
    can_write_doctype = frappe.has_permission(GROWTH_DOCTYPE, "write")
    for row in initiatives:
        client = clients.get(row.customer) or {}
        project = projects.get(row.project) or {}
        row.currency = client.get("default_currency") or project.get("custom_currency") or default_currency
        row.project_name = project.get("project_name")
        row.converted_outcome = convert(row.billable_outcome, row.currency)
        row.can_write = can_write_doctype and has_owner_gated_permission(row.activity_owner, "write", user)

    can_read_rate = frappe.has_permission("Customer", "read")
    return {
        "currency": currency,
        "initiatives": initiatives,
        "clients": {
            name: {
                "customer_name": client.customer_name,
                "hourly_rate": convert(client.custom_hourly_rate, client.default_currency or default_currency)
                if can_read_rate and client.custom_hourly_rate
                else None,
            }
            for name, client in clients.items()
        },
    }


@frappe.whitelist(methods=["POST"])
def move_growth_stage(
    name: str,
    status: str,
    closed_status: str | None = None,
    billable_outcome: float | None = None,
    client_priority: str | None = None,
    note: str | None = None,
) -> dict:
    """Move a growth initiative to `status` by adding a status update, so its Updates history stays complete.

    Unset priority and billable outcome carry forward from the previous update.

    Returns:
        dict: name, status and closed_status after the move.
    """
    doc = frappe.get_doc(GROWTH_DOCTYPE, name)
    doc.check_permission("write")
    doc.append(
        "update_log",
        {
            "status": status,
            "closed_status": closed_status,
            "client_priority": client_priority,
            "billable_outcome": None if billable_outcome in (None, "") else flt(billable_outcome),
            "note": note,
        },
    )
    doc.save()
    return {"name": doc.name, "status": doc.status, "closed_status": doc.closed_status}


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
