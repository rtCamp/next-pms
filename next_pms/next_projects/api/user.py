# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe

from next_pms.next_projects.api.utils import get_user_details_map


@frappe.whitelist()
def get_user_details(users: list[str] | str) -> list[dict]:
    """Full name and avatar for a list of user emails.

    The User list API hides `user_image` from non-System-Manager sessions, so
    frontends that need avatars for arbitrary users go through this endpoint.
    """
    if isinstance(users, str):
        users = frappe.parse_json(users)
    details = get_user_details_map(users or [])
    return [{"name": name, **row} for name, row in details.items()]
