import frappe


@frappe.whitelist()
def app_logo():
    from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

    return get_app_logo()


@frappe.whitelist()
def get_current_user_roles(user: str = None):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles
