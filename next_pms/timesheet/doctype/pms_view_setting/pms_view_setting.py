# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import parse_json


class PMSViewSetting(Document):
    def validate(self):
        if self.public and self.user:
            self.user = None


@frappe.whitelist(methods=["GET", "POST"])
def get_view(dt: str):
    """Endpoint to get all views for a doctype. It accepts doctype as parameter and returns list of views for that doctype."""
    views = frappe.get_all("PMS View Setting", filters={"dt": dt}, fields=["*"])
    for view in views:
        view.filters = frappe.parse_json(view.filters)
        view.order_by = frappe.parse_json(view.order_by)
        view.rows = frappe.parse_json(view.rows)
        view.columns = frappe.parse_json(view.columns)
        view.pinnedColumns = frappe.parse_json(view.pinned_columns)
    return views


@frappe.whitelist(methods=["GET", "POST"])
def get_views():
    """Endpoint to get all views for a user. It returns list of views for the user."""
    views = frappe.get_all(
        "PMS View Setting",
        fields=["*"],
        or_filters=[{"user": frappe.session.user}, {"public": 1}],
    )
    for view in views:
        view.filters = frappe.parse_json(view.filters)
        view.order_by = frappe.parse_json(view.order_by)
        view.rows = frappe.parse_json(view.rows)
        view.columns = frappe.parse_json(view.columns)
        view.pinnedColumns = frappe.parse_json(view.pinned_columns)
    return views


@frappe.whitelist(methods=["POST"])
def create_view(view):
    """Endpoint to create a new view. It accepts view object as parameter and creates a new view for the user."""
    import json

    view = frappe._dict(view)
    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")

    doc = frappe.new_doc("PMS View Setting")
    user = view.user or frappe.session.user
    doc.label = view.label
    doc.type = view.type or "list"
    doc.dt = view.dt
    doc.user = user if not view.public else ""
    doc.filters = json.dumps(view.filters)
    doc.order_by = json.dumps(view.order_by)
    doc.rows = json.dumps(view.rows)
    doc.columns = json.dumps(view.columns)
    doc.route = view.route
    doc.default = view.default or 0
    doc.public = view.public or 0
    doc.icon = view.icon
    doc.pinned_columns = json.dumps(view.pinnedColumns)
    doc.insert(ignore_permissions=True)
    return get_views()


@frappe.whitelist(methods=["POST"])
def update_view(view):
    """Endpoint to update an existing view. It accepts view object as parameter and updates the view for the user."""
    import json

    view = frappe._dict(view)
    if view.public and frappe.session.user != "Administrator":
        frappe.throw(
            frappe._("Only Administrator or Owner can update public view"),
            frappe.PermissionError,
        )
    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")
    view.pinnedColumns = parse_json(view.pinnedColumns or "[]")

    doc = frappe.get_doc("PMS View Setting", view.name)
    user = view.user or frappe.session.user
    doc.label = view.label
    doc.type = view.type or "list"
    doc.dt = view.dt
    doc.user = user if not view.public else ""
    doc.filters = json.dumps(view.filters)
    doc.order_by = json.dumps(view.order_by)
    doc.rows = json.dumps(view.rows)
    doc.columns = json.dumps(view.columns)
    doc.route = view.route
    doc.default = view.default or 0
    doc.public = view.public or 0
    doc.pinned_columns = json.dumps(view.pinnedColumns)
    doc.save()
    updated_view = doc.as_dict()
    updated_view.filters = frappe.parse_json(updated_view.filters)
    updated_view.order_by = frappe.parse_json(updated_view.order_by)
    updated_view.rows = frappe.parse_json(updated_view.rows)
    updated_view.columns = frappe.parse_json(updated_view.columns)
    updated_view.pinnedColumns = frappe.parse_json(updated_view.pinned_columns)

    return updated_view
