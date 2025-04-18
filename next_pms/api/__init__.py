from datetime import datetime

import frappe
from frappe import _
from frappe.integrations.doctype.google_calendar.google_calendar import (
    get_google_calendar_object,
)

from next_pms.api.utils import transform_google_events


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

    permissions = []

    if frappe.has_permission(doctype, "read"):
        permissions.append("read")
    if frappe.has_permission(doctype, "write"):
        permissions.append("write")
    if frappe.has_permission(doctype, "create"):
        permissions.append("create")
    if frappe.has_permission(doctype, "delete"):
        permissions.append("delete")

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

    return {"tabs": tab_fields, "permissions": permissions}


@frappe.whitelist()
def get_doc_meta(doctype: str):
    from frappe import get_meta
    from frappe.model import default_fields
    from frappe.model.meta import get_default_df

    default_fields = list(default_fields)
    default_fields.remove("doctype")
    default_fields.remove("idx")
    default_fields.remove("docstatus")

    doc = get_meta(doctype)
    # Get the permitted fields based on the user's permission
    permitted_fields = doc.get_permitted_fieldnames()
    # create df property map for these fields
    permitted_fields = [field for field in doc.fields if field.fieldname in permitted_fields]

    # add default fields to permitted fields
    for field in default_fields:
        if field not in permitted_fields:
            df = get_default_df(field)
            df.label = field
            permitted_fields.append(df)

    # Create map for default fields
    default_list_fields = [field for field in permitted_fields if field.in_list_view]

    # Check if title field is present in the default fields,if not then add it.
    title_field = doc.get_title_field()
    title_field_exists = any(field.fieldname == title_field for field in default_list_fields)

    if not title_field_exists:
        df = frappe._dict(fieldname=title_field, fieldtype="Data", label=title_field)
        default_list_fields.append(df)

    # Reorder the permitted_fields based on the order in doc.fields
    field_order = {field.fieldname: idx for idx, field in enumerate(doc.fields)}
    permitted_fields.sort(key=lambda field: field_order.get(field.fieldname, float("inf")))
    default_list_fields.sort(key=lambda field: field_order.get(field.fieldname, float("inf")))

    return {
        "fields": permitted_fields,
        "default_fields": default_list_fields,
        "doctype": doctype,
        "title_field": title_field,
        "meta": doc,  # Note: Adding meta to get entire form-view structure
    }


@frappe.whitelist()
def get_naming_rule(doctype):
    """Get the naming rule (autoname) and naming series options of any Doctype."""
    meta = frappe.get_meta(doctype)
    naming_rule = meta.get("autoname") or ""
    naming_series_field = naming_rule.split(":")[0]
    naming_series_options = []

    options = ""

    for field in meta.fields:
        if field.fieldname == naming_series_field:
            options = field.options

    naming_series_options = options.split("\n") if options else []

    return {"doctype": doctype, "naming_series_field": naming_series_field, "options": naming_series_options}


@frappe.whitelist(methods=["POST"])
def child_table_bulk_delete(doctype: str, parent_name: str, child_fieldname: str, child_names: list[str]):
    """Delete specific child table rows from the parent doctype."""

    if not frappe.has_permission(doctype, ptype="delete"):
        frappe.throw(_("You do not have permission to delete {0}").format(doctype))

    parent_doc = frappe.get_doc(doctype, parent_name)

    for child_name in child_names:
        for log in parent_doc.get(child_fieldname):
            if log.name == child_name:
                parent_doc.remove(log)

    parent_doc.save()

    return _("Row deleted successfully.")
