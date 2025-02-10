import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import add_days

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check


@frappe.whitelist(methods=["POST"])
def handle_allocation(allocation: object, repeat_till_week_count: int = 0):
    permission = resource_api_permissions_check()

    if not permission["write"]:
        return frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    if not allocation:
        return frappe.throw(frappe._("Allocation is required."), exc=frappe.ValidationError)

    if allocation.get("name"):
        updated_allocation = update_allocation(allocation)
        return updated_allocation

    new_allocation = add_allocation(allocation, repeat_till_week_count)

    return new_allocation


def add_allocation(allocation: object, repeat_till_week_count: int = 0):
    new_allocation = frappe.get_doc(allocation)
    new_allocation.save()

    if repeat_till_week_count:
        for _ in range(repeat_till_week_count):
            next_allocation_dict = allocation

            next_allocation_dict["allocation_start_date"] = add_days(allocation["allocation_start_date"], 7)

            next_allocation_dict["allocation_end_date"] = add_days(allocation["allocation_end_date"], 7)

            next_allocation = frappe.get_doc(next_allocation_dict)
            next_allocation.save()

    return new_allocation


def update_allocation(allocation: object):
    allocation_doc = frappe.get_doc("Resource Allocation", allocation["name"])
    allocation_doc.update(allocation)
    allocation_doc.save()

    return allocation_doc
