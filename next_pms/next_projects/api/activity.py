# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import cstr, strip_html_tags

from next_pms.next_projects.api.utils import get_user_details_map

VERSION_LIMIT = 50
VALUE_MAX_LENGTH = 40
ROW_CHANGE_KEYS = {"added": "added", "removed": "removed", "row_changed": "changed"}


@frappe.whitelist(methods=["GET"])
def get_activity(doctype: str, name: str) -> dict:
    """Creation, last edit and tracked field changes of a document, newest first.

    Mirrors the desk form timeline: hidden fields (unless `show_on_timeline`) and
    fields outside the user's readable permlevels are left out, values are
    stripped of HTML and clipped like the desk builder does.
    """
    doc = frappe.get_doc(doctype, name)
    doc.check_permission("read")

    items = [{"type": "created", "user": doc.owner, "timestamp": doc.creation}]
    if doc.modified != doc.creation:
        items.append({"type": "edited", "user": doc.modified_by, "timestamp": doc.modified})
    items.extend(get_version_items(doc))
    items.sort(key=lambda item: item["timestamp"], reverse=True)

    users = {item["user"] for item in items} | {
        item["impersonated_by"] for item in items if item.get("impersonated_by")
    }
    return {"items": items, "users": get_user_details_map(list(users))}


def get_version_items(doc) -> list[dict]:
    if not doc.meta.track_changes:
        return []

    versions = frappe.get_all(
        "Version",
        filters={"ref_doctype": doc.doctype, "docname": str(doc.name)},
        fields=["owner", "creation", "data"],
        order_by="creation desc",
        limit=VERSION_LIMIT,
    )
    readable_permlevels = doc.get_permlevel_access("read")

    items = []
    for version in versions:
        data = frappe.parse_json(version.data) or {}
        changes = [
            change
            for entry in data.get("changed") or []
            if (change := build_field_change(doc.meta, entry, readable_permlevels))
        ]
        table_changes = build_table_changes(doc.meta, data)
        if not changes and not table_changes:
            continue
        items.append(
            {
                "type": "changed",
                "user": version.owner,
                "timestamp": version.creation,
                "changes": changes,
                "table_changes": table_changes,
                "impersonated_by": data.get("impersonated_by"),
            }
        )
    return items


def build_field_change(meta, entry: list, readable_permlevels: list[int]) -> dict | None:
    fieldname, old, new = entry
    df = meta.get_field(fieldname)
    if not df or df.permlevel not in readable_permlevels:
        return None
    if df.hidden and not df.get("show_on_timeline"):
        return None
    return {
        "label": _(df.label),
        "old": format_for_timeline(old),
        "new": format_for_timeline(new),
    }


def build_table_changes(meta, data: dict) -> list[dict]:
    counts: dict[str, dict] = {}
    for key, counter in ROW_CHANGE_KEYS.items():
        for entry in data.get(key) or []:
            df = meta.get_field(entry[0])
            if not df:
                continue
            label = _(df.label)
            counts.setdefault(label, {"added": 0, "removed": 0, "changed": 0})[counter] += 1
    return [{"label": label, **count} for label, count in counts.items()]


def format_for_timeline(value) -> str:
    """Version rows already hold display-formatted values (see `Version.get_diff`),
    so only HTML and whitespace are normalised here, as the desk builder does."""
    if value is None or value == "":
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    text = " ".join(strip_html_tags(cstr(value)).split())
    if len(text) > VALUE_MAX_LENGTH:
        return text[: VALUE_MAX_LENGTH - 3] + "..."
    return text
