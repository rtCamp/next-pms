# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _, only_for

from next_pms.next_projects.api.constant import ALLOWED_ROLES

_COMMUNICATION_FIELDS = [
    "name",
    "communication_date",
    "creation",
    "subject",
    "content",
    "sender",
    "sender_full_name",
    "recipients",
    "cc",
    "bcc",
    "read_by_recipient",
    "delivery_status",
]


@frappe.whitelist(methods=["GET"])
def get_project_emails(project: str) -> list[dict]:
    """Return the emails linked to a project.

    Combines native Frappe ``Communication`` records (reference_doctype="Project")
    with any Gmail threads linked to the project via ``frappe_gmail_thread``.
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(_("Project is required"))
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found").format(project), frappe.DoesNotExistError)

    return _get_project_communications(project) + _get_project_gmail_threads(project)


def _get_project_communications(project: str) -> list[dict]:
    communications = frappe.get_all(
        "Communication",
        filters={
            "reference_doctype": "Project",
            "reference_name": project,
            "communication_medium": "Email",
        },
        fields=_COMMUNICATION_FIELDS,
    )
    if not communications:
        return []

    attachments_by_communication = _get_communication_attachments([c["name"] for c in communications])

    return [
        _to_email(communication, attachments_by_communication.get(communication["name"], []))
        for communication in communications
    ]


def _get_communication_attachments(communication_names: list[str]) -> dict[str, list[dict]]:
    files = frappe.get_all(
        "File",
        filters={
            "attached_to_doctype": "Communication",
            "attached_to_name": ("in", communication_names),
        },
        fields=["attached_to_name", "file_url", "is_private"],
    )
    grouped: dict[str, list[dict]] = {}
    for file in files:
        grouped.setdefault(file["attached_to_name"], []).append(
            {"file_url": file["file_url"], "is_private": file["is_private"]}
        )
    return grouped


def _get_project_gmail_threads(project: str) -> list[dict]:
    if "frappe_gmail_thread" not in frappe.get_installed_apps():
        return []

    from frappe_gmail_thread.api.activity import get_linked_gmail_threads

    threads = get_linked_gmail_threads("Project", project)
    return [_to_email((entry.get("template_data") or {}).get("doc") or {}) for entry in threads]


def _to_email(data: dict, attachments: list[dict] | None = None) -> dict:
    return {
        "name": data.get("name"),
        "communication_date": data.get("communication_date"),
        "creation": data.get("creation"),
        "subject": data.get("subject"),
        "content": data.get("content"),
        "sender": data.get("sender"),
        "sender_full_name": data.get("sender_full_name"),
        "recipients": data.get("recipients"),
        "cc": data.get("cc"),
        "bcc": data.get("bcc"),
        "read_by_recipient": data.get("read_by_recipient"),
        "delivery_status": data.get("delivery_status"),
        "attachments": attachments if attachments is not None else (data.get("attachments") or []),
    }
