# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import parse_json

TRACKING_VIEW_TYPE = "Tracking"


TRACKING_LAYOUT_ROLES = frozenset({"Projects Manager"})


class PMSViewSetting(Document):
    def validate(self):
        if self.public and self.user:
            self.user = None


def check_tracking_layout_permission(project: str):
    if not TRACKING_LAYOUT_ROLES & set(frappe.get_roles()):
        frappe.throw(frappe._("Not permitted to customize the tracking page"), frappe.PermissionError)
    if not frappe.has_permission("Project", "write", project):
        frappe.throw(frappe._("Not permitted to customize this project"), frappe.PermissionError)


@frappe.whitelist(methods=["GET", "POST"])
def get_view(dt: str, project: str | None = None):
    """Endpoint to get all views for a doctype. It accepts doctype as parameter and returns list of views for that doctype.

    Passing a project returns that project's tracking layout instead. Tracking
    layouts are excluded otherwise so they never reach the list view switcher.
    """
    filters = {"dt": dt}
    if project:
        # The layout is public so that everyone on the project shares it, which means
        # the read has to be gated on the project itself rather than on the row.
        if not frappe.has_permission("Project", "read", project):
            frappe.throw(frappe._("Not permitted to read this project"), frappe.PermissionError)

        # Type is matched too, so a view of any other type that somehow carries a
        # project can never be served as that project's shared layout.
        filters["project"] = project
        filters["type"] = TRACKING_VIEW_TYPE
    else:
        # Excluded by project rather than by type because "type != Tracking" drops
        # any legacy row whose type is NULL, while "is not set" emits ifnull.
        filters["project"] = ["is", "not set"]

    views = frappe.get_all(
        "PMS View Setting",
        filters=filters,
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
        filters={"project": ["is", "not set"]},
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

    # A project scoped row is only ever a shared tracking layout, so it has to be
    # authorised here. Without this a caller could post any other type with a
    # project and have its rows served to everyone on that project.
    if view.project or view.type == TRACKING_VIEW_TYPE:
        if not view.project or view.type != TRACKING_VIEW_TYPE:
            frappe.throw(frappe._("A project scoped view must be of type Tracking"))

        check_tracking_layout_permission(view.project)

        # Always public: the layout belongs to the project, not to whoever saved it.
        # A private row would take the project's only slot while staying invisible to
        # everyone else, and their saves would land in a row they cannot read back.
        view.public = 1

        # Two managers can both read no layout and both post a create, so the
        # second one updates the first one's row instead of adding a rival.
        existing = frappe.db.get_value(
            "PMS View Setting",
            {"project": view.project, "type": TRACKING_VIEW_TYPE},
            "name",
        )
        if existing:
            return update_view({"name": existing, "rows": view.rows})

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
    doc.project = view.project
    doc.pinned_columns = json.dumps(view.pinnedColumns)
    doc.insert(ignore_permissions=True)

    if doc.type == TRACKING_VIEW_TYPE:
        return as_view(doc)

    return get_views()


@frappe.whitelist(methods=["POST"])
def update_view(view: dict):
    """Endpoint to update an existing view. It accepts view object as parameter and updates the view for the user."""
    import json

    view = frappe._dict(view)
    doc = frappe.get_doc("PMS View Setting", view.name)

    # A tracking layout is shared by everyone on the project, so it is saved
    # against project write access rather than doc ownership, and only its rows
    # change - the caller never round-trips the rest of the document.
    if doc.type == TRACKING_VIEW_TYPE:
        check_tracking_layout_permission(doc.project)
        doc.public = 1
        doc.rows = json.dumps(parse_json(view.rows or "[]"))
        doc.save(ignore_permissions=True)
        return as_view(doc)

    # Stops a personal list view being converted into a project's shared layout,
    # which would otherwise bypass the tracking authorisation above.
    if view.type == TRACKING_VIEW_TYPE or view.project:
        frappe.throw(frappe._("A list view cannot be turned into a tracking layout"))

    if (view.public or doc.public) and frappe.session.user not in ("Administrator", doc.owner):
        frappe.throw(
            frappe._("Only Administrator or Owner can update public view"),
            frappe.PermissionError,
        )
    view.filters = parse_json(view.filters) or {}
    view.order_by = parse_json(view.order_by or "[]")
    view.rows = parse_json(view.rows or "[]")
    view.columns = parse_json(view.columns or "{}")
    view.pinnedColumns = parse_json(view.pinnedColumns or "[]")
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
    doc.save()

    return as_view(doc)


def delete_project_views(doc, method=None):
    """Clears a project's tracking layouts when the project is deleted.

    `ignore_links_on_delete` lets the project go while these rows still point at
    it, so without this they linger, and a later project reusing the same name
    would silently inherit the old layout.
    """
    for name in frappe.get_all("PMS View Setting", filters={"project": doc.name}, pluck="name"):
        frappe.delete_doc("PMS View Setting", name, ignore_permissions=True, force=True)


def as_view(doc):
    """Serialises a saved view with its JSON fields parsed, as the endpoints return them."""
    view = doc.as_dict()
    view.filters = frappe.parse_json(view.filters)
    view.order_by = frappe.parse_json(view.order_by)
    view.rows = frappe.parse_json(view.rows)
    view.columns = frappe.parse_json(view.columns)
    view.pinnedColumns = frappe.parse_json(view.pinned_columns)

    return view
