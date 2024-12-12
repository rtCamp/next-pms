from frappe import get_all, whitelist


@whitelist()
def get_data(user: str = None):
    return {"roles": get_current_user_roles(user), "currencies": get_currencies()}


@whitelist()
def get_current_user_roles(user: str = None):
    import frappe

    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles


def get_currencies():
    return get_all("Currency", pluck="name", filters={"enabled": 1})
