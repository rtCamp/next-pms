import frappe
from frappe import _

from next_pms.utils.linked_todos import LINKED_TODO_DOCTYPE, get_todo_owner_rows

INACTIVE_STATUSES = ("Closed", "Cancelled")


def validate(doc, method=None):
    keep_assignment_on_active_status_change(doc)
    validate_linked_todo_reference(doc)


def keep_assignment_on_active_status_change(doc):
    before = doc.get_doc_before_save()
    if before and before.status not in INACTIVE_STATUSES and doc.status not in INACTIVE_STATUSES:
        doc._assignment = None


def validate_linked_todo_reference(doc):
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
