import frappe

from next_pms.api.audit import trigger_audit_report


def trigger_weekly_audits():
    """
    Weekly scheduler task to trigger Audit Reports for all billable open projects.
    Pings the Audit microservice bulk audit endpoint.
    """
    try:
        trigger_audit_report()
    except Exception:
        frappe.log_error(
            title="Audit Report — Scheduled Task Error",
            message=frappe.get_traceback(),
        )
