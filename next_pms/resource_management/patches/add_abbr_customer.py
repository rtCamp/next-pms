import frappe

from next_pms.project_currency.helpers.error import generate_the_error_log


def execute():
    try:
        customer_list = frappe.get_all("Customer", fields=["name", "customer_name"])

        for customer in customer_list:
            if not customer.customer_name:
                continue

            customer = frappe.get_doc("Customer", customer.name)
            customer.save(ignore_permissions=True)
    except Exception:
        generate_the_error_log("Error while updating customer abbreviation", is_mute_message=True)
