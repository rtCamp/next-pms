# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import only_for

from next_pms.next_projects.api.constant import ALLOWED_ROLES


@frappe.whitelist(methods=["GET"])
def get_project_emails(project: str) -> list[dict]:
    """Return the email activities for a project's linked CRM Deal.

    Degrades to an empty list when frappe_crm_xt isn't installed or the
    project has no linked deal — the email tab simply renders empty.
    """
    only_for(ALLOWED_ROLES, message=True)

    if "frappe_crm_xt" not in frappe.get_installed_apps():
        return []

    deal = frappe.db.get_value("Project", project, "custom_deal")
    if not deal:
        return []

    from frappe_crm_xt.api.activity import get_activities

    activities = get_activities(deal)[0]

    return [_to_email(activity) for activity in activities if _is_email(activity)]


def _is_email(activity: dict) -> bool:
    return activity.get("activity_type") == "communication" and activity.get("communication_type") == "Email"


def _to_email(activity: dict) -> dict:
    data = activity.get("data") or {}
    return {
        "communication_date": activity.get("communication_date"),
        "creation": activity.get("creation"),
        "subject": data.get("subject"),
        "content": data.get("content"),
        "sender": data.get("sender"),
        "sender_full_name": data.get("sender_full_name"),
        "recipients": data.get("recipients"),
        "cc": data.get("cc"),
        "bcc": data.get("bcc"),
        "attachments": data.get("attachments") or [],
        "read_by_recipient": data.get("read_by_recipient"),
        "delivery_status": data.get("delivery_status"),
    }
