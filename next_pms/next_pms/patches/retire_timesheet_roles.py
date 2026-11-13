import frappe

RETIRED_ROLES = ("Timesheet Manager", "Timesheet User")


def execute() -> None:
    """Delete the Timesheet roles PMS created. Their permission rows go first, then every
    assignment (role profiles and other non-user parents, then users), then the role."""
    for role in RETIRED_ROLES:
        if not frappe.db.exists("Role", role):
            continue
        frappe.db.delete("Custom DocPerm", {"role": role})
        frappe.db.delete("Has Role", {"role": role, "parenttype": ["!=", "User"]})
        frappe.db.delete("Has Role", {"role": role, "parenttype": "User"})
        frappe.delete_doc("Role", role, force=True, ignore_permissions=True)
    frappe.clear_cache()
