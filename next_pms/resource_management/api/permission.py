import frappe

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check


@frappe.whitelist(methods=["GET"])
def get_user_resources_permissions():
    """return read,write, delete permissions for the user"""
    return resource_api_permissions_check()
