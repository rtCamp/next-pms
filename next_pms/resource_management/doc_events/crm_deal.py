import frappe
from frappe.utils import cint, date_diff, nowdate
from frappe.utils.background_jobs import get_queue_list

from next_pms.resource_management.ai_staffing import crm_xt_installed

PIPELINE = "next_pms.resource_management.ai_staffing.pipeline"
STAFFING_QUEUE = "ai_staffing"
STAFFING_QUEUE_FALLBACK = "long"


def on_update(doc, method=None):
    """Queues AI staffing for a deal saved while it qualifies; for one already staffed, only
    its value is synced. Saving a deal again is also how a failed run is retried."""
    if not crm_xt_installed():
        return
    settings = frappe.get_cached_doc("AI Staffing Settings")
    if not settings.enabled or not _qualifies(doc, settings):
        return

    status = frappe.db.get_value("AI Staffing Request", doc.name, "status")
    if status == "Allocated":
        if doc.has_value_changed("expected_deal_value") or doc.has_value_changed("deal_value"):
            _enqueue("sync_project_value", doc.name, queue="short")
        return

    sow_link = doc.get("custom_handover_sheet_link")
    if not sow_link:
        return

    if status:
        frappe.db.set_value("AI Staffing Request", doc.name, {"status": "Pending", "sow_link": sow_link, "error": None})
    else:
        frappe.get_doc({"doctype": "AI Staffing Request", "deal": doc.name, "sow_link": sow_link}).insert(
            ignore_permissions=True
        )
    _enqueue("run_staffing", doc.name, queue=get_staffing_queue())


def _qualifies(doc, settings) -> bool:
    start = doc.get("custom_expected_start_date")
    return bool(
        start
        and doc.get("sales_stage") in {row.sales_stage for row in settings.qualifying_stages}
        and 0 <= date_diff(start, nowdate()) <= cint(settings.start_window_days)
    )


def get_staffing_queue() -> str:
    """The dedicated queue when the bench runs a worker for it, else the long queue."""
    return STAFFING_QUEUE if STAFFING_QUEUE in get_queue_list() else STAFFING_QUEUE_FALLBACK


def _enqueue(job: str, deal: str, queue: str) -> None:
    frappe.enqueue(
        f"{PIPELINE}.{job}",
        queue=queue,
        job_id=f"ai-staffing::{job}::{deal}",
        deduplicate=True,
        enqueue_after_commit=True,
        deal=deal,
    )
