import frappe
from frappe.share import add_docshare

MANAGER_FIELDS = ["custom_project_manager", "custom_engineering_manager", "custom_account_manager_"]


def execute():
    """Share every project with its project, engineering and account managers (read access) if not shared already."""
    projects = frappe.get_all(
        "Project",
        or_filters=[[field, "is", "set"] for field in MANAGER_FIELDS],
        fields=["name", *MANAGER_FIELDS],
    )

    user_exists = {}

    for project in projects:
        for user in {project.get(field) for field in MANAGER_FIELDS}:
            if not user:
                continue
            if user not in user_exists:
                user_exists[user] = frappe.db.exists("User", user)
            if not user_exists[user]:
                continue
            if frappe.db.exists(
                "DocShare",
                {"share_doctype": "Project", "share_name": project.name, "user": user},
            ):
                continue
            add_docshare(
                "Project",
                project.name,
                user=user,
                read=1,
                flags={"ignore_share_permission": True},
            )
