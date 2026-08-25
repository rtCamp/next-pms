import frappe
import requests
from frappe import _, only_for

from next_pms.api.generate_pm_report import get_api_key

ALLOWED_ROLES = ["System Manager", "Projects Manager"]


def get_audit_url() -> str | None:
    audit_url = frappe.conf.get("llm_audit_url")
    if not audit_url:
        frappe.log_error(
            "LLM Audit URL is not configured. Please set `llm_audit_url` in site config.",
            "Audit Report — Config Error",
        )
        return None
    return audit_url


@frappe.whitelist(methods=["POST"])
def trigger_audit_report() -> dict:
    """
    Trigger bulk Audit Report for all open billable projects via the LLM microservice.
    Pings POST /api/audit/run-all endpoint.
    """
    only_for(ALLOWED_ROLES, message=True)

    audit_url = get_audit_url()
    if not audit_url:
        frappe.throw(_("LLM Audit service URL is not configured."))

    api_key = get_api_key()
    if not api_key:
        frappe.throw(_("PM Report API key is not configured."))

    try:
        response = requests.post(
            audit_url,
            headers={"Content-Type": "application/json", "x-api-key": api_key},
            timeout=60,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"Audit API Error: {e!s}", "Audit Report — API Error")
        frappe.throw(_("Failed to trigger Audit Report: {0}").format(str(e)))

    return {"status": "success", "message": _("Audit report triggered successfully.")}
