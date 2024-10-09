import frappe


def execute():
    settings = frappe.get_doc("Currency Exchange Settings")
    if settings.service_provider != "frankfurter.app":
        return

    settings.api_endpoint = "https://api.frankfurter.app/{transaction_date}"
    settings.flags.ignore_validate = True
    settings.save()
    frappe.db.commit()
