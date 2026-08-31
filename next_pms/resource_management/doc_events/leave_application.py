# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import getdate

from next_pms.resource_management.api.utils import leave_sync
from next_pms.resource_management.api.utils.query import get_employee_leaves


def resync_allocations(doc, method=None):
    """Re-derive leave-driven day overrides on every allocation this leave touches.

    Handles a leave approved after its allocation already existed, an amended date range —
    the dates the leave moved off are resynced too, so they return to their base hours — and
    cancellation or deletion.

    Flushes the leave cache first: `get_employee_leaves` is cached, and the resync would
    otherwise re-derive the overrides from the leave state that just changed.
    """
    get_employee_leaves.clear_cache()

    dates = [getdate(doc.from_date), getdate(doc.to_date)]

    previous = doc.get_doc_before_save()
    if previous:
        dates += [getdate(previous.from_date), getdate(previous.to_date)]

    frappe.enqueue(
        resync_allocations_for_range,
        queue="default",
        enqueue_after_commit=True,
        now=frappe.in_test,
        employee=doc.employee,
        start_date=min(dates),
        end_date=max(dates),
    )


def resync_allocations_for_range(employee: str, start_date, end_date) -> None:
    """Resave every allocation overlapping the range so its leave overrides are re-derived.

    Saved with `ignore_permissions` because the trigger is a leave approver, who is not
    expected to hold write access on Resource Allocation. A failure on one allocation is
    logged and skipped rather than raised, so a stale allocation can never block an approval.
    """
    allocation_names = frappe.get_all(
        "Resource Allocation",
        filters={
            "employee": employee,
            "allocation_start_date": ["<=", getdate(end_date)],
            "allocation_end_date": [">=", getdate(start_date)],
        },
        pluck="name",
    )

    for name in allocation_names:
        try:
            allocation = frappe.get_doc("Resource Allocation", name)
            before = leave_sync.override_signature(allocation)
            leave_sync.sync_leave_overrides(allocation)

            if leave_sync.override_signature(allocation) == before:
                continue

            allocation.save(ignore_permissions=True)
        except Exception:
            frappe.log_error(
                title="Resource Allocation leave resync failed",
                message=f"Allocation: {name}\n{frappe.get_traceback()}",
            )
