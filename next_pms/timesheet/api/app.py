import frappe


@frappe.whitelist()
def get_app_data(user: str = None):
    return {"roles": get_current_user_roles(user), "currencies": get_currencies()}


@frappe.whitelist()
def get_current_user_roles(user: str = None):
    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles


def get_currencies():
    return frappe.get_all("Currency", pluck="name", filters={"enabled": 1})
