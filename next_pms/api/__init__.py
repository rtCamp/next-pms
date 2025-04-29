from datetime import datetime

import frappe
from frappe import _
from frappe.integrations.doctype.google_calendar.google_calendar import (
    get_google_calendar_object,
)

from next_pms.api.utils import transform_google_events


def check_app_permission():
    if frappe.session.user == "Administrator":
        return True

    roles = frappe.get_roles()
    if any(
        role in ["Projects User", "Projects Manager", "Timesheet User", "Timesheet Manager", "Desk User", "Employee"]
        for role in roles
    ):
        return True

    return False


class GoogleBadRequest(Exception):
    pass


@frappe.whitelist()
def get_user_calendar_events(start_date: datetime, end_date: datetime):
    """
    Fetch all calendar events for the current user.

    Args:
        start_date (str): Start date for filtering events.
        end_date (str): End date for filtering events.

    Returns:
        list: List of calendar events for the user
    """
    try:
        user = frappe.session.user
        if not user:
            return None

        google_calendar = frappe.get_all("Google Calendar", filters={"user": user}, fields=["*"])[0]
        google_calendar_api_obj, account = get_google_calendar_object(google_calendar.name)
        time_min = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        time_max = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)
        time_min_str = time_min.isoformat() + "Z"
        time_max_str = time_max.isoformat() + "Z"
        events = (
            google_calendar_api_obj.events()
            .list(
                calendarId=google_calendar.google_calendar_id,
                maxResults=2000,
                singleEvents=True,
                timeMax=time_max_str,
                timeMin=time_min_str,
                orderBy="startTime",
            )
            .execute()
        )
        if events:
            return transform_google_events(events)
        return []

    except Exception:
        frappe.throw(_("Could not fetch events from Google Calendar"), exc=GoogleBadRequest)


@frappe.whitelist()
def get_doc_with_meta(doctype, docname):
    """Fetch all fields (excluding non-data fields) and their values categorized under respective tabs."""

    doc = frappe.get_doc(doctype, docname)

    doctype_meta = doc.meta

    tab_fields = {}
    current_tab = "Details"

    permitted_fields = doctype_meta.get_permitted_fieldnames()

    for df in doctype_meta.fields:
        if df.fieldtype == "Tab Break":
            current_tab = df.label
            tab_fields[current_tab] = []
            continue

        if df.fieldtype not in ["Section Break", "Column Break"]:
            if df.fieldname not in permitted_fields and df.fieldtype != "Table":
                continue

        if df.fieldtype in ["HTML", "HTML Editor"]:
            continue

        field_value = doc.get(df.fieldname)

        if current_tab not in tab_fields:
            tab_fields[current_tab] = []

        field_info = {
            "label": df.label,
            "fieldname": df.fieldname,
            "fieldtype": df.fieldtype,
            "description": getattr(df, "description", ""),
            "value": field_value,
            "creation": doc.creation,
            "modified": doc.modified,
            "options": getattr(df, "options", None),
            "reqd": getattr(df, "reqd", 0),
            "default": getattr(df, "default", None),
            "read_only": getattr(df, "read_only", 0),
            "hidden": getattr(df, "hidden", 0),
            "precision": getattr(df, "precision", None),
            "in_list_view": getattr(df, "in_list_view", 0),
            "depends_on": getattr(df, "depends_on", None),
        }

        if df.fieldtype == "Link" and field_value:
            field_info["link"] = {
                "doctype": df.options,
                "name": field_value,
                "route": f"/app/{df.options.lower().replace(' ', '-').replace('_', '-')}/{field_value}",
            }

        if df.fieldtype == "Table":
            child_doctype = df.options
            child_meta = frappe.get_meta(child_doctype)

            field_info["child_meta"] = [
                {
                    "label": f.label,
                    "fieldname": f.fieldname,
                    "fieldtype": f.fieldtype,
                    "options": getattr(f, "options", None),
                    "reqd": getattr(f, "reqd", 0),
                    "default": getattr(f, "default", None),
                    "read_only": getattr(f, "read_only", 0),
                    "hidden": getattr(f, "hidden", 0),
                    "in_list_view": getattr(f, "in_list_view", None),
                    "parentfield": df.fieldname,
                }
                for f in child_meta.fields
            ]
            field_info["value"] = [
                {
                    **row.as_dict(),
                    "parenttype": row.parenttype,
                    "parent": row.parent,
                    "parentfield": row.parentfield,
                    "idx": row.idx,
                }
                for row in (field_value or [])
            ]

        tab_fields[current_tab].append(field_info)

    return {"tabs": tab_fields}
