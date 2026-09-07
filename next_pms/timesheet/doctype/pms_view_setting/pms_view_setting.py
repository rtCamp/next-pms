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
    views = frappe.get_all(
        "PMS View Setting",
        filters={"dt": dt},
        or_filters=[{"user": frappe.session.user}, {"public": 1}],
        fields=["*"],
    )
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
def create_view(view: dict):
    """Endpoint to create a new view. It accepts view object as parameter and creates a new view for the user."""
    import json

    view = frappe._dict(view)
    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")

    roles = set(frappe.get_roles(frappe.session.user))
    manager_roles = {"Administrator", "System Manager", "Projects Manager", "Timesheet Manager"}

    if view.public:
        if not (roles & manager_roles) and frappe.session.user != "Administrator":
            frappe.throw(frappe._("Only Managers or Administrator can create public views"), frappe.PermissionError)

    user = frappe.session.user
    if view.user and view.user != frappe.session.user:
        if "System Manager" not in roles and frappe.session.user != "Administrator":
            frappe.throw(frappe._("You cannot create views for other users"), frappe.PermissionError)
        user = view.user

    doc = frappe.new_doc("PMS View Setting")
    doc.label = view.label
    doc.type = view.type or "List"
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
def update_view(view: dict):
    """Endpoint to update an existing view. It accepts view object as parameter and updates the view for the user."""
    import json

    view = frappe._dict(view)
    if not frappe.db.exists("PMS View Setting", view.name):
        frappe.throw(frappe._("View '{0}' does not exist").format(view.name), frappe.DoesNotExistError)

    doc = frappe.get_doc("PMS View Setting", view.name)
    roles = set(frappe.get_roles(frappe.session.user))
    is_admin = frappe.session.user == "Administrator" or "System Manager" in roles
    is_owner = frappe.session.user in (doc.owner, doc.user)

    if view.public or doc.public:
        if not (is_admin or is_owner):
            frappe.throw(
                frappe._("Only Administrator or Owner can update public view"),
                frappe.PermissionError,
            )
        manager_roles = {"Administrator", "System Manager", "Projects Manager", "Timesheet Manager"}
        if view.public and not doc.public and not (roles & manager_roles) and not is_admin:
            frappe.throw(
                frappe._("Only Managers or Administrator can make a view public"),
                frappe.PermissionError,
            )
    else:
        if not (is_admin or is_owner):
            frappe.throw(
                frappe._("You do not have permission to update this view"),
                frappe.PermissionError,
            )

    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")
    view.pinnedColumns = parse_json(view.pinnedColumns or "[]")

    user = doc.user
    if view.user and view.user != doc.user:
        if not is_admin:
            frappe.throw(frappe._("You cannot reassign view ownership to another user"), frappe.PermissionError)
        user = view.user

    doc.label = view.label
    doc.type = view.type or "List"
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
    doc.save()
    updated_view = doc.as_dict()
    updated_view.filters = frappe.parse_json(updated_view.filters)
    updated_view.order_by = frappe.parse_json(updated_view.order_by)
    updated_view.rows = frappe.parse_json(updated_view.rows)
    updated_view.columns = frappe.parse_json(updated_view.columns)
    updated_view.pinnedColumns = frappe.parse_json(updated_view.pinned_columns)

    return updated_view
