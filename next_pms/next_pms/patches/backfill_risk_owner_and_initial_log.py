import frappe


def execute():
    """Fill risk_owner and a creation log row on Risks that predate those rules.

    Empty risk_owner is set to the document creator. Every Risk gets a first
    log row timestamped at creation if it does not already have one.
    """
    _backfill_risk_owner()
    _backfill_initial_update_log()


def _backfill_risk_owner():
    for risk in frappe.get_all(
        "Risk",
        filters={
            "risk_owner": ["is", "not set"],
            "owner": ["is", "set"],
        },
        fields=["name", "owner"],
    ):
        frappe.db.set_value("Risk", risk.name, "risk_owner", risk.owner, update_modified=False)


def _backfill_initial_update_log():
    updates_by_parent = {}
    for row in frappe.get_all(
        "Risk Update",
        fields=["name", "parent", "idx", "status", "risk_level", "updated_at"],
        order_by="idx asc",
    ):
        updates_by_parent.setdefault(row.parent, []).append(row)

    for risk in frappe.get_all("Risk", fields=["name", "status", "risk_level", "creation", "owner"]):
        existing = updates_by_parent.get(risk.name, [])
        if existing:
            if str(existing[0].updated_at or "") == str(risk.creation or ""):
                continue
            for child in reversed(existing):
                frappe.db.set_value("Risk Update", child.name, "idx", child.idx + 1, update_modified=False)
            status = existing[0].status
            risk_level = existing[0].risk_level
        else:
            if not risk.status and not risk.risk_level:
                continue
            status = risk.status
            risk_level = risk.risk_level

        row = frappe.get_doc(
            {
                "doctype": "Risk Update",
                "parent": risk.name,
                "parenttype": "Risk",
                "parentfield": "risk_update_log",
                "idx": 1,
                "status": status,
                "risk_level": risk_level,
                "updated_at": risk.creation,
                "updated_by": risk.owner,
            }
        )
        row.db_insert()
