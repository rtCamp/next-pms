# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe

# Composite-filter field name the projects view accepts for tags, and the
# operators it resolves against Tag Link.
TAG_FILTER_FIELD = "tag"
TAG_FILTER_OPERATORS = ("=", "!=", "like", "not like")


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


def get_user_details_map(users: list[str]) -> dict[str, dict]:
    """Fetch full_name and user_image for multiple users in a single query.

    Args:
        users: User names (emails) to look up; duplicates are collapsed.

    Returns:
        dict[str, dict]: Map of user name to a dict with full_name and user_image.
    """
    if not users:
        return {}
    rows = frappe.get_all(
        "User",
        filters={"name": ["in", list(set(users))]},
        fields=["name", "full_name", "user_image"],
    )
    return {row.name: {"full_name": row.full_name, "user_image": row.user_image} for row in rows}


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


def resolve_tag_filters(filters: list) -> list:
    """Rewrite `tag` conditions in a Project filter list into conditions on `name`.

    A tag is not a Project column: ERPNext keeps the project-tag mapping in the Tag
    Link doctype, so a tag condition is resolved there first and re-expressed as the
    set of project names carrying that tag. Every other condition passes through
    untouched.
    """
    resolved = []

    for condition in filters:
        if not (isinstance(condition, list | tuple) and len(condition) == 3 and condition[0] == TAG_FILTER_FIELD):
            resolved.append(condition)
            continue

        _, operator, value = condition
        if operator not in TAG_FILTER_OPERATORS:
            frappe.throw(frappe._("Unsupported operator {0} for the tag filter.").format(operator))

        is_like = operator in ("like", "not like")
        tagged_projects = frappe.get_all(
            "Tag Link",
            filters={
                "document_type": "Project",
                "tag": ["like", f"%{value}%"] if is_like else ["=", value],
            },
            pluck="document_name",
            distinct=True,
        )
        # An empty list keeps the semantics: `in ()` matches nothing, `not in ()` matches all.
        resolved.append(["name", "in" if operator in ("=", "like") else "not in", tagged_projects])

    return resolved
