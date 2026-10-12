import frappe
from frappe import _

from next_pms.utils.linked_todos import LINKED_TODO_DOCTYPE, get_todo_owner_rows


def validate(doc, method=None):
    if doc.is_new() or not (doc.has_value_changed("reference_type") or doc.has_value_changed("reference_name")):
        return

    for row in get_todo_owner_rows([doc.name]):
        project = frappe.db.get_value(row.parenttype, row.parent, "project")
        if doc.reference_type != "Project" or doc.reference_name != project:
            frappe.throw(
                _("This ToDo is linked to {0} {1} of project {2}. Unlink it before moving it.").format(
                    _(row.parenttype), frappe.bold(row.parent), frappe.bold(project)
                )
            )


def on_trash(doc, method=None):
    frappe.db.delete(LINKED_TODO_DOCTYPE, {"todo": doc.name})
