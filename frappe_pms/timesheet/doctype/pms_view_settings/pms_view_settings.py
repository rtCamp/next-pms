# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import parse_json


class PMSViewSettings(Document):
    pass


@frappe.whitelist()
def get_view(dt: str):
    views = frappe.get_all("PMS View Settings", filters={"dt": dt}, fields=["*"])
    for view in views:
        view.filters = frappe.parse_json(view.filters)
        view.order_by = frappe.parse_json(view.order_by)
        view.rows = frappe.parse_json(view.rows)
        view.columns = frappe.parse_json(view.columns)
    return views


@frappe.whitelist()
def get_views():
    views = frappe.get_all("PMS View Settings", fields=["*"])
    for view in views:
        view.filters = frappe.parse_json(view.filters)
        view.order_by = frappe.parse_json(view.order_by)
        view.rows = frappe.parse_json(view.rows)
        view.columns = frappe.parse_json(view.columns)
    return views


@frappe.whitelist()
def create_view(view):
    import json

    view = frappe._dict(view)
    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")

    doc = frappe.new_doc("PMS View Settings")
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
    doc.insert(ignore_permissions=True)
    return get_views()


@frappe.whitelist()
def update_view(view):
    import json

    view = frappe._dict(view)

    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")

    doc = frappe.get_doc("PMS View Settings", view.name)
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
    doc.save(ignore_permissions=True)
    return get_views()
