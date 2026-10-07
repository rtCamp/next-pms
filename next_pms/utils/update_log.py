import frappe
from frappe import _
from frappe.model import numeric_fieldtypes
from frappe.utils import flt

AUDIT_FIELDS = ("updated_at", "updated_by")


def stamp_new_update_rows(rows):
    for row in rows:
        if row.is_new():
            row.updated_by = frappe.session.user


def prevent_changing_others_update_rows(doc, table_field, content_fields):
    """Only the author of an update row may edit or delete it; System Manager is exempt."""
    if "System Manager" in frappe.get_roles():
        return

    rows = doc.get(table_field)
    child_meta = frappe.get_meta(doc.meta.get_field(table_field).options)
    compared_fields = (*content_fields, *AUDIT_FIELDS)
    numeric_fields = {f for f in compared_fields if child_meta.get_field(f).fieldtype in numeric_fieldtypes}
    existing_rows = {
        row.name: row
        for row in frappe.get_all(
            child_meta.name,
            filters={"parent": doc.name, "parenttype": doc.doctype, "parentfield": table_field},
            fields=["name", *compared_fields],
        )
    }

    submitted_names = {row.name for row in rows if row.name}
    for name, prev in existing_rows.items():
        if name not in submitted_names and prev.updated_by != frappe.session.user:
            frappe.throw(
                _("You can only delete rows you created. Row created by {0} cannot be removed.").format(
                    prev.updated_by
                ),
                frappe.PermissionError,
            )

    for row in rows:
        if row.is_new() or not row.name:
            continue
        prev = existing_rows.get(row.name)
        if not prev or prev.updated_by == frappe.session.user:
            continue
        if _comparable(row, compared_fields, numeric_fields) != _comparable(prev, compared_fields, numeric_fields):
            frappe.throw(
                _("You can only edit rows you created. Row created by {0} cannot be modified.").format(prev.updated_by),
                frappe.PermissionError,
            )


def _comparable(row, fields, numeric_fields):
    return tuple(
        flt(row.get(field)) if field in numeric_fields else str(row.get(field) or "") or None for field in fields
    )
