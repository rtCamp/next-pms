import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import add_days

from next_pms.resource_management.api.utils.http import send_http_response


@frappe.whitelist(methods=["POST"])
def handle_create_and_update_of_allocation(allocation: object, repeat_till_week_count: int = 0):
    try:
        if not allocation:
            return send_http_response(400, {"message": "Allocation is required."})

        if allocation.get("name"):
            updated_allocation = update_allocation(allocation)
            return send_http_response(200, {"message": updated_allocation})

        new_allocation = add_allocation(allocation, repeat_till_week_count)

        return new_allocation
    except Exception as e:
        return send_http_response(500, {"message": str(e)})


def add_allocation(allocation: object, repeat_till_week_count: int = 0):
    new_allocation = frappe.get_doc(allocation)
    new_allocation.save()

    if repeat_till_week_count:
        for count in range(repeat_till_week_count):
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
