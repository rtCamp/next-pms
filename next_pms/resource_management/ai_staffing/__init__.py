import frappe

CRM_XT_APP = "frappe_crm_xt"


def crm_xt_installed() -> bool:
    """Staffing reads the deal fields frappe_crm_xt adds, so it only runs where that app is installed."""
    return CRM_XT_APP in frappe.get_installed_apps()
