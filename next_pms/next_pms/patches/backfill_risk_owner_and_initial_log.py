import frappe


def execute():
    """Fill risk_owner and a creation log row on Risks that predate those rules.

    Empty risk_owner is set to the document creator. Risks with an empty
    update log get a first row timestamped at creation.
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
    risks_with_updates = {row.parent for row in frappe.get_all("Risk Update", fields=["parent"])}
    for risk in frappe.get_all("Risk", fields=["name", "status", "risk_level", "creation", "owner"]):
        if risk.name in risks_with_updates:
            continue
        row = frappe.get_doc(
            {
                "doctype": "Risk Update",
                "parent": risk.name,
                "parenttype": "Risk",
                "parentfield": "risk_update_log",
                "idx": 1,
                "status": risk.status,
                "risk_level": risk.risk_level,
                "updated_at": risk.creation,
                "updated_by": risk.owner,
            }
        )
        row.db_insert()
