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


def get_employee_image_map(employees: list[str]) -> dict[str, str | None]:
    """Map each employee to their linked User's avatar image, in two bulk queries."""
    if not employees:
        return {}
    emp_rows = frappe.get_all("Employee", filters={"name": ["in", employees]}, fields=["name", "user_id"])
    user_image_map = get_user_image_map([row.user_id for row in emp_rows if row.user_id])
    return {row.name: user_image_map.get(row.user_id) for row in emp_rows}


def get_employee_image(employee: str) -> str | None:
    """Get an employee's avatar image from their linked User."""
    if not employee:
        return None
    user_id = frappe.db.get_value("Employee", employee, "user_id")
    return get_user_image(user_id)


def get_contact_image_map(contacts: list[str]) -> dict[str, str | None]:
    """Fetch the avatar image for multiple contacts in a single query."""
    if not contacts:
        return {}
    rows = frappe.get_all("Contact", filters={"name": ["in", contacts]}, fields=["name", "image"])
    return {row.name: row.image for row in rows}


def get_contact_image(contact: str) -> str | None:
    """Get a contact's avatar image URL."""
    if not contact:
        return None
    return frappe.db.get_value("Contact", contact, "image")


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
