import frappe

from next_pms.api.audit import trigger_audit_report


def trigger_weekly_audits():
    """
    Weekly scheduler task to trigger Audit Reports for all billable open projects.
    Pings the Audit microservice bulk audit endpoint.
    """
    try:
        trigger_audit_report()
    except Exception as e:
        frappe.log_error(f"Weekly Audit Schedule Error: {e!s}", "Audit Report — Scheduled Task Error")
