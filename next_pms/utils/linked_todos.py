import frappe
from frappe import _

LINKED_TODO_DOCTYPE = "PMS Linked ToDo"
LINKED_TODO_OWNERS = {
    "Project Timeline Item": "title",
    "PMS Growth Initiative": "activity",
}


def validate_linked_todos(doc):
    """A linked ToDo must be a ToDo of the owner's project and belong to no other owner."""
    todos = [row.todo for row in doc.get("linked_todos") if row.todo]
    if not todos:
        return

    duplicates = {todo for todo in todos if todos.count(todo) > 1}
    if duplicates:
        frappe.throw(_("ToDo {0} is linked more than once.").format(frappe.bold(sorted(duplicates)[0])))

    references = {
        row.name: row
        for row in frappe.get_all(
            "ToDo",
            filters={"name": ["in", todos]},
            fields=["name", "reference_type", "reference_name"],
        )
    }
    for todo in todos:
        reference = references.get(todo)
        if not reference or reference.reference_type != "Project" or reference.reference_name != doc.project:
            frappe.throw(
                _("ToDo {0} does not belong to project {1}.").format(frappe.bold(todo), frappe.bold(doc.project))
            )

    if not doc.flags.ignore_permissions:
        before = doc.get_doc_before_save()
        already_linked = {row.todo for row in before.get("linked_todos")} if before else set()
        for todo in set(todos) - already_linked:
            frappe.has_permission("ToDo", "read", doc=todo, throw=True)

    for row in get_todo_owner_rows(todos):
        if (row.parenttype, row.parent) != (doc.doctype, doc.name):
            frappe.throw(
                _("ToDo {0} is already linked to {1} {2}.").format(
                    frappe.bold(row.todo), _(row.parenttype), frappe.bold(row.parent)
                )
            )


def get_todo_owner_rows(todos: list[str]) -> list[dict]:
    if not todos:
        return []
    return frappe.get_all(
        LINKED_TODO_DOCTYPE,
        filters={"todo": ["in", todos], "parenttype": ["in", list(LINKED_TODO_OWNERS)]},
        fields=["todo", "parenttype", "parent"],
    )
