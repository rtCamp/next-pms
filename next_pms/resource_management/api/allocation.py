from dataclasses import asdict, dataclass
from datetime import date, timedelta

import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import add_days
from frappe.utils import cint, getdate

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check


@dataclass
class AllocationPayload:
    """
    Schema for the `allocation` argument passed to `handle_allocation`.
    """

    doctype: str  # always "Resource Allocation"
    employee: str
    customer: str
    allocation_start_date: str  # "YYYY-MM-DD"
    allocation_end_date: str  # "YYYY-MM-DD"
    hours_allocated_per_day: float
    include_weekends: bool
    project: str | None = None
    total_allocated_hours: float | None = None
    is_billable: int | None = None  # 1 or 0
    status: str | None = None  # "Confirmed" or "Tentative"
    note: str | None = None
    name: str | None = None  # present only in the edit flow


def _to_doc_dict(payload: AllocationPayload, include_name: bool = True) -> dict:
    """
    Convert an AllocationPayload to a clean dict for `frappe.get_doc`.
    """
    data = {k: v for k, v in asdict(payload).items() if v is not None}  # only keep the fields that are not None
    data.pop("include_weekends", None)  # include_weekends is not a DocType field, so removed
    if not include_name:
        data.pop("name", None)
    return data


def get_weekday_chunks(start_date: str | date, end_date: str | date) -> list[tuple[date, date]]:
    """
    Split a date range into Mon-Fri weekly chunks, skipping weekend days.

    Each chunk represents a contiguous weekday-only segment within a single
    calendar week (Monday to Friday). Weekend days at the start or end of
    the range are excluded. If the entire range falls on weekends, an empty
    list is returned.

    Args:
            start_date (str | date): Start of the allocation range (inclusive).
            end_date (str | date):   End of the allocation range (inclusive).

    Returns:
            list[tuple[date, date]]: A list of (chunk_start, chunk_end) pairs,
            one per week, where each date is a weekday (Mon-Fri).

    Example:
            >>> get_weekday_chunks("2026-05-04", "2026-05-17")
            [
                (date(2026, 5, 4),  date(2026, 5, 8)),   # week 1: Mon-Fri
                (date(2026, 5, 11), date(2026, 5, 15)),  # week 2: Mon-Fri
            ]
            # 2026-05-16 (Sat) and 2026-05-17 (Sun) are excluded.
    """

    chunks = []
    current = getdate(start_date)
    end = getdate(end_date)

    while current <= end:
        # if current lands on a weekend, advance to the following Monday
        if current.weekday() >= 5:
            current += timedelta(days=7 - current.weekday())
            continue

        # friday of the current week
        week_friday = current + timedelta(days=4 - current.weekday())
        chunk_end = min(week_friday, end)

        chunks.append((current, chunk_end))

        # advance to next monday (friday + 3 days)
        current = week_friday + timedelta(days=3)

    return chunks


@frappe.whitelist(methods=["POST"])
def handle_allocation(allocation: AllocationPayload, repeat_till_week_count: int = 0):
    """
    Create or update a Resource Allocation document.

    Branches on whether `allocation.name` is present:
    - With name: updates the existing allocation.
    - Without name: creates a new allocation.
      If `repeat_till_week_count` is given, additional allocations are
      created for each subsequent week (+7 days per iteration).

    Args:
            allocation (AllocationPayload): Allocation field values.
            repeat_till_week_count (int):   Number of additional weekly copies to
                                            create. Only applies to the add flow.

    Returns:
            The saved Resource Allocation document after create or update. When
            `include_weekends` is false and the range spans multiple weekday
            chunks, this is the document for the first chunk; additional chunks
            are saved as separate documents that are not returned.
    """

    permission = resource_api_permissions_check()

    if not permission["write"]:
        return frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    if allocation.include_weekends and not cint(
        frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries")
    ):
        frappe.throw(
            frappe._(
                "Weekend allocations are not allowed. Enable 'Allow Weekend Entries' in Timesheet Settings to use this option."
            ),
            exc=frappe.ValidationError,
        )

    if allocation.name:
        return update_allocation(allocation)

    return add_allocation(allocation, repeat_till_week_count)


def add_allocation(allocation: AllocationPayload, repeat_till_week_count: int = 0):
    """Create a new resource allocation document."""

    doc_data = _to_doc_dict(allocation, include_name=False)

    if not allocation.include_weekends:
        chunks = get_weekday_chunks(allocation.allocation_start_date, allocation.allocation_end_date)
        if not chunks:
            frappe.throw(
                frappe._(
                    "The selected date range contains no weekdays. Please choose a range that includes at least one weekday."
                ),
                exc=frappe.ValidationError,
            )
        if repeat_till_week_count and len(chunks) > 1:
            frappe.throw(
                frappe._(
                    "Repeat is only supported for single-week allocations. The selected date range spans multiple weeks."
                ),
                exc=frappe.ValidationError,
            )
        first_doc = None
        for week_offset in range(repeat_till_week_count + 1):
            week_delta = timedelta(days=7 * week_offset)
            for chunk_start, chunk_end in chunks:
                weekday_count = (chunk_end - chunk_start).days + 1
                doc = frappe.get_doc(
                    {
                        **doc_data,
                        "allocation_start_date": chunk_start + week_delta,
                        "allocation_end_date": chunk_end + week_delta,
                        "total_allocated_hours": weekday_count * allocation.hours_allocated_per_day,
                    }
                )
                doc.save()
                if first_doc is None:
                    first_doc = doc
        return first_doc

    new_allocation = frappe.get_doc(doc_data)
    new_allocation.save()

    if repeat_till_week_count:
        start = getdate(allocation.allocation_start_date)
        end = getdate(allocation.allocation_end_date)
        if (end - start).days >= 7:  # ranges shorter than 7 days never overlap when shifted by exactly 7 days
            frappe.throw(
                frappe._(
                    "Repeat is only supported for single-week allocations. The selected date range spans multiple weeks."
                ),
                exc=frappe.ValidationError,
            )
        for _ in range(repeat_till_week_count):
            doc_data["allocation_start_date"] = add_days(doc_data["allocation_start_date"], 7)
            doc_data["allocation_end_date"] = add_days(doc_data["allocation_end_date"], 7)
            frappe.get_doc(dict(doc_data)).save()

    return new_allocation


def update_allocation(allocation: AllocationPayload):
    """Update an existing resource allocation document."""

    allocation_doc = frappe.get_doc("Resource Allocation", allocation.name)
    doc_data = _to_doc_dict(allocation, include_name=True)

    if not allocation.include_weekends:
        chunks = get_weekday_chunks(allocation.allocation_start_date, allocation.allocation_end_date)

        if not chunks:
            frappe.throw(
                frappe._(
                    "The selected date range contains no weekdays. Please choose a range that includes at least one weekday."
                ),
                exc=frappe.ValidationError,
            )

        # shrink the existing allocation to the first chunk's date range
        first_start, first_end = chunks[0]
        first_weekday_count = (first_end - first_start).days + 1
        allocation_doc.update(
            {
                **doc_data,
                "allocation_start_date": first_start,
                "allocation_end_date": first_end,
                "total_allocated_hours": first_weekday_count * allocation.hours_allocated_per_day,
            }
        )
        allocation_doc.save()

        # create fresh allocations for the remaining weekly chunks
        base = {k: v for k, v in doc_data.items() if k != "name"}
        for chunk_start, chunk_end in chunks[1:]:
            weekday_count = (chunk_end - chunk_start).days + 1
            doc = frappe.get_doc(
                {
                    **base,
                    "allocation_start_date": chunk_start,
                    "allocation_end_date": chunk_end,
                    "total_allocated_hours": weekday_count * allocation.hours_allocated_per_day,
                }
            )
            doc.save()

        return allocation_doc

    allocation_doc.update(doc_data)
    allocation_doc.save()
    return allocation_doc
