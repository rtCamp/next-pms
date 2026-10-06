# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _, whitelist

from next_pms.api.utils import error_logger
from next_pms.utils.linked_todos import LINKED_TODO_OWNERS, get_todo_owner_rows

TODO_FIELDS = (
    "description",
    "status",
    "priority",
    "allocated_to",
    "date",
    "custom_title",
    "custom_from_time",
    "custom_to_time",
)
GROWTH_INITIATIVE_TYPE = "Growth Initiative"


@whitelist(methods=["POST"])
@error_logger
def create_linked_todo(doctype: str, name: str, todo: str | dict):
    """Create a Project ToDo on the owner's project and link it to the owner in one transaction.

    Args:
        doctype: Owner doctype — "Project Timeline Item" or "PMS Growth Initiative"
        name: Owner document name
        todo: ToDo field values (description, status, priority, allocated_to, date and the
            optional custom_title / custom_from_time / custom_to_time); reference fields are
            always set to the owner's project and assigned_by to the current user

    Returns:
        The created ToDo.
    """
    owner = get_owner(doctype, name)
    owner.check_permission("write")

    values = frappe.parse_json(todo) or {}
    todo_doc = frappe.get_doc(
        {
            **{field: values[field] for field in TODO_FIELDS if field in values},
            "doctype": "ToDo",
            "assigned_by": frappe.session.user,
            "reference_type": "Project",
            "reference_name": owner.project,
        }
    ).insert()
    add_todo_to_owner(owner, todo_doc.name)

    return todo_doc.as_dict()


@whitelist(methods=["POST"])
@error_logger
def link_todo(todo: str, doctype: str, name: str):
    """Link a ToDo to an owner, moving it off its current owner if it has one.

    Args:
        todo: ToDo name
        doctype: Owner doctype — "Project Timeline Item" or "PMS Growth Initiative"
        name: Owner document name

    Returns:
        {"todo": str, "doctype": str, "name": str}
    """
    owner = get_owner(doctype, name)
    check_todo_permission(todo)

    current = get_todo_owner(todo)
    if not current or (current.doctype, current.name) != (owner.doctype, owner.name):
        if current:
            remove_todo_from_owner(current, todo)
        add_todo_to_owner(owner, todo)

    return {"todo": todo, "doctype": owner.doctype, "name": owner.name}


@whitelist(methods=["POST"])
@error_logger
def unlink_todo(todo: str):
    """Remove a ToDo from the owner it is linked to; the ToDo itself is kept.

    Args:
        todo: ToDo name

    Returns:
        {"todo": str}
    """
    check_todo_permission(todo)

    if current := get_todo_owner(todo):
        remove_todo_from_owner(current, todo)

    return {"todo": todo}


@whitelist(methods=["GET"])
@error_logger
def get_todo_links(todos: str | list[str]) -> dict[str, dict]:
    """Owner of each ToDo the user can read, for showing the association on the ToDo tab.

    Args:
        todos: ToDo names, as a list or a JSON-encoded list

    Returns:
        {todo: {"doctype": str, "name": str, "title": str, "type": str}} — unlinked ToDos
        are left out.
    """
    todos = frappe.parse_json(todos) if isinstance(todos, str) else todos
    if not todos:
        return {}

    readable = frappe.get_list("ToDo", filters={"name": ["in", todos]}, pluck="name", limit_page_length=0)
    rows = get_todo_owner_rows(readable)

    owners = {}
    for doctype in {row.parenttype for row in rows}:
        names = [row.parent for row in rows if row.parenttype == doctype]
        for record in frappe.get_all(doctype, filters={"name": ["in", names]}, fields=get_owner_fields(doctype)):
            owners[(doctype, record.name)] = to_linkable_record(doctype, record)

    return {row.todo: owners[(row.parenttype, row.parent)] for row in rows}


@whitelist(methods=["GET"])
@error_logger
def get_linkable_records(project: str) -> list[dict]:
    """Milestones, Touchpoints and Growth Initiatives of a project the user may link ToDos to.

    Args:
        project: Project name

    Returns:
        [{"doctype": str, "name": str, "title": str, "type": str}]
    """
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found").format(project), frappe.DoesNotExistError)
    frappe.has_permission("Project", doc=project, ptype="read", throw=True)

    records = []
    for doctype, title_field in LINKED_TODO_OWNERS.items():
        if not frappe.has_permission(doctype, "write"):
            continue
        for record in frappe.get_list(
            doctype,
            filters={"project": project},
            fields=get_owner_fields(doctype),
            order_by=f"{title_field} asc",
            limit_page_length=0,
        ):
            if frappe.has_permission(doctype, "write", doc=record.name):
                records.append(to_linkable_record(doctype, record))
    return records


def get_owner(doctype: str, name: str):
    if doctype not in LINKED_TODO_OWNERS:
        frappe.throw(_("ToDos cannot be linked to {0}.").format(_(doctype)))
    return frappe.get_doc(doctype, name)


def get_owner_fields(doctype: str) -> list[str]:
    fields = ["name", LINKED_TODO_OWNERS[doctype]]
    if frappe.get_meta(doctype).has_field("type"):
        fields.append("type")
    return fields


def to_linkable_record(doctype: str, record: dict) -> dict:
    return {
        "doctype": doctype,
        "name": record.name,
        "title": record.get(LINKED_TODO_OWNERS[doctype]),
        "type": record.get("type") or GROWTH_INITIATIVE_TYPE,
    }


def check_todo_permission(todo: str):
    frappe.get_doc("ToDo", todo).check_permission("read")


def get_todo_owner(todo: str):
    rows = get_todo_owner_rows([todo])
    return frappe.get_doc(rows[0].parenttype, rows[0].parent) if rows else None


def add_todo_to_owner(owner, todo: str):
    owner.append("linked_todos", {"todo": todo})
    owner.save()


def remove_todo_from_owner(owner, todo: str):
    owner.set("linked_todos", [row for row in owner.linked_todos if row.todo != todo])
    owner.save()
