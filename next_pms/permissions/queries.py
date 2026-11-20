import frappe
from frappe import _

from next_pms.permissions.capabilities import MANAGER_FIELD_ROLES


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def manager_user_query(doctype: str, txt: str, searchfield: str, start: int, page_len: int, filters: dict):
    """Link search for a Project manager field: enabled users holding a role the field accepts."""
    fieldname = (filters or {}).get("fieldname")
    if fieldname not in MANAGER_FIELD_ROLES:
        frappe.throw(_("Unknown manager field: {0}").format(fieldname))

    # get_all: the User roles table is permlevel 1, so callers without System Manager can't filter on it.
    holders = frappe.get_all(
        "Has Role",
        filters={"parenttype": "User", "role": ["in", MANAGER_FIELD_ROLES[fieldname]]},
        pluck="parent",
        distinct=True,
    )
    return frappe.get_list(
        "User",
        filters={"enabled": 1, "name": ["in", holders]},
        or_filters=[[field, "like", f"%{txt}%"] for field in ("name", "full_name")],
        fields=["name", "full_name"],
        order_by="name asc",
        limit_start=start,
        limit_page_length=page_len,
        as_list=True,
    )
