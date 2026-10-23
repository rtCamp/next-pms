# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

SUBSCRIPTION_DOCTYPE = "PMS Project Update Subscription"
ACCOUNT_MANAGER_FIELD = "custom_account_manager_"


class PMSProjectUpdateSubscription(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        project: DF.Link
        user: DF.Link
    # end: auto-generated types

    pass


def on_doctype_update():
    frappe.db.add_unique(SUBSCRIPTION_DOCTYPE, ["project", "user"])


def delete_project_subscriptions(doc, method=None):
    frappe.db.delete(SUBSCRIPTION_DOCTYPE, {"project": doc.name})


def get_project_subscribers(project: str) -> list[str]:
    return frappe.get_all(SUBSCRIPTION_DOCTYPE, filters={"project": project}, pluck="user")


def get_project_account_manager(project: str) -> str | None:
    """Return the project's Account Manager, who is notified of every update without subscribing.

    The field is a site customization rather than part of next_pms, so it may not exist.
    """
    if not frappe.get_meta("Project").has_field(ACCOUNT_MANAGER_FIELD):
        return None
    return frappe.db.get_value("Project", project, ACCOUNT_MANAGER_FIELD)
