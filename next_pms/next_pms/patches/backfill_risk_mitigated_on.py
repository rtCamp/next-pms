import frappe

from next_pms.next_pms.doctype.risk.risk import get_mitigated_on


def execute():
    mitigated = frappe.get_all("Risk", filters={"status": "Mitigated", "mitigated_on": ["is", "not set"]}, pluck="name")
    if not mitigated:
        return

    logs = {}
    for row in frappe.get_all(
        "Risk Update",
        filters={"parenttype": "Risk", "parentfield": "risk_update_log", "parent": ["in", mitigated]},
        fields=["parent", "idx", "status", "updated_at"],
        order_by="parent asc, idx asc",
    ):
        logs.setdefault(row.parent, []).append(row)

    for name in mitigated:
        mitigated_on = get_mitigated_on("Mitigated", logs.get(name, []))
        if mitigated_on:
            frappe.db.set_value("Risk", name, "mitigated_on", mitigated_on, update_modified=False)
