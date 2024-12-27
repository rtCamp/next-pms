import frappe

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check


@frappe.whitelist()
def get_user_resources_permissions():
    return resource_api_permissions_check()
