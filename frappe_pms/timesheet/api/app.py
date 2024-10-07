import frappe


@frappe.whitelist()
def get_current_user_roles(user: str = None):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles
