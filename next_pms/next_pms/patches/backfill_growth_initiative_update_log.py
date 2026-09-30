import frappe


def execute():
    """Give Growth Initiatives that predate the update log a first row timestamped at creation."""
    with_updates = set(frappe.get_all("PMS Growth Initiative Update", pluck="parent", distinct=True))
    for initiative in frappe.get_all(
        "PMS Growth Initiative",
        fields=["name", "status", "closed_status", "client_priority", "billable_outcome", "creation", "owner"],
    ):
        if initiative.name in with_updates:
            continue
        frappe.get_doc(
            {
                "doctype": "PMS Growth Initiative Update",
                "parent": initiative.name,
                "parenttype": "PMS Growth Initiative",
                "parentfield": "update_log",
                "idx": 1,
                "status": initiative.status,
                "closed_status": initiative.closed_status,
                "client_priority": initiative.client_priority or "",
                "billable_outcome": initiative.billable_outcome,
                "updated_at": initiative.creation,
                "updated_by": initiative.owner,
            }
        ).db_insert()
