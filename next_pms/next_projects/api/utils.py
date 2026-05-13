# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe


def get_user_image_map(users: list[str]) -> dict[str, str | None]:
    """Fetch user_image for multiple users in a single query."""
    if not users:
        return {}
    rows = frappe.get_all("User", filters={"name": ["in", users]}, fields=["name", "user_image"])
    return {row.name: row.user_image for row in rows}


def get_user_image(user: str) -> str | None:
    """Get user's avatar image URL."""
    if not user:
        return None
    return frappe.db.get_value("User", user, "user_image")


def build_person_data(
    user: str,
    full_name: str,
    user_image_map: dict[str, str | None] | None = None,
) -> dict | None:
    """Build person data object with user, full_name, and image."""
    if not user:
        return None
    image = user_image_map.get(user) if user_image_map is not None else get_user_image(user)
    return {
        "user": user,
        "full_name": full_name or "",
        "image": image,
    }
