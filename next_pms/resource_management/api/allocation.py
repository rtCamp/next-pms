import uuid
from dataclasses import asdict, dataclass
from datetime import date, timedelta

import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import add_days
from frappe.utils import cint, getdate

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check
from next_pms.resource_management.doctype.resource_allocation.resource_allocation import clear_cache

NON_DATE_FIELDS = frozenset({"project", "customer", "is_billable", "status", "note", "hours_allocated_per_day"})
VALID_DELETE_MODES = frozenset({"only_this", "this_and_future", "all_in_series"})


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

    if allocation.name:
        frappe.throw(
            frappe._("Use edit_allocation to update an existing allocation."),
            exc=frappe.ValidationError,
        )

    if allocation.include_weekends and not cint(
        frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries")
    ):
        frappe.throw(
            frappe._(
                "Weekend allocations are not allowed. Enable 'Allow Weekend Entries' in Timesheet Settings to use this option."
            ),
            exc=frappe.ValidationError,
        )

    return add_allocation(allocation, repeat_till_week_count)


def add_allocation(allocation: AllocationPayload, repeat_till_week_count: int = 0):
    """Create a new resource allocation document."""

    doc_data = _to_doc_dict(allocation, include_name=False)
    recurrence_id = str(uuid.uuid4()) if repeat_till_week_count else None

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
                        **({"recurrence_id": recurrence_id} if recurrence_id else {}),
                    }
                )
                doc.save()
                if first_doc is None:
                    first_doc = doc
        return first_doc

    new_allocation = frappe.get_doc({**doc_data, **({"recurrence_id": recurrence_id} if recurrence_id else {})})
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
            frappe.get_doc({**doc_data, "recurrence_id": recurrence_id}).save()

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


def upsert_day_override(doc_name: str, override_date: str, override_fields: dict):
    """Add or update a single day override row on a Resource Allocation doc.

    If a row already exists for the given date it is updated in-place; otherwise
    a new row is appended and the parent doc is saved.

    ``hours`` and ``cancelled`` are mutually exclusive:
    - Setting ``cancelled=1`` clears ``hours`` to 0.
    - Setting ``hours`` to a value clears ``cancelled`` to 0.

    Args:
        doc_name (str): Name of the Resource Allocation document.
        override_date (str): The specific date to override (``"YYYY-MM-DD"``).
        override_fields (dict): Fields to set on the row, e.g. ``{"cancelled": 1}``
                                or ``{"hours": 4.0}``.
    """
    fields = dict(override_fields)
    is_cancelled = cint(fields.get("cancelled")) == 1
    has_hours = fields.get("hours") is not None

    if is_cancelled and has_hours:
        frappe.throw(
            frappe._("A day override cannot set both 'hours' and 'cancelled'. Use one or the other."),
            exc=frappe.ValidationError,
        )
    if is_cancelled:
        fields["cancelled"] = 1
        fields["hours"] = 0
    elif has_hours:
        fields["cancelled"] = 0

    existing_row = frappe.db.get_value(
        "Resource Allocation Extra Entry",
        {"parent": doc_name, "parenttype": "Resource Allocation", "date": override_date},
        "name",
    )
    if existing_row:
        frappe.db.set_value("Resource Allocation Extra Entry", existing_row, fields)
        clear_cache()  # set_value bypasses on_update, so invalidate manually
    else:
        doc = frappe.get_doc("Resource Allocation", doc_name)
        doc.append("override", {"date": override_date, **fields})
        doc.save()


@frappe.whitelist(methods=["POST"])
def edit_allocation(name: str, edit_mode: str, allocation: AllocationPayload, day_overrides: list[dict] | None = None):
    """Edit a Resource Allocation, optionally propagating changes to all docs in the series.

    Args:
        name (str): Name of the allocation being edited.
        edit_mode (str): ``"only_this"`` — update just this doc.
                         ``"whole_series"`` — update all docs sharing the same ``recurrence_id``.
                         ``"this_and_future"`` — used with ``day_overrides`` to apply per-day
                         changes to this doc and all later docs in the series.
        allocation (AllocationPayload): New field values (ignored when ``day_overrides`` is provided).
        day_overrides (list[dict] | None): Optional list of per-day overrides, each a dict with a
                                           ``"date"`` key plus the fields to set, e.g.
                                           ``[{"date": "2025-06-05", "cancelled": 1}, {"date": "2025-06-06", "hours": 4.0}]``.
                                           When provided, ``edit_mode`` controls scope:
                                           ``"only_this"`` — apply to this doc only.
                                           ``"this_and_future"`` — apply to this and all later docs in the series,
                                           targeting the same weekday in each doc's range.
    """
    permission = resource_api_permissions_check()
    if not permission["write"]:
        frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    if day_overrides:
        if edit_mode == "this_and_future":
            recurrence_id, this_start = frappe.db.get_value(
                "Resource Allocation", name, ["recurrence_id", "allocation_start_date"]
            )
            if recurrence_id:
                series = frappe.get_all(
                    "Resource Allocation",
                    filters={"recurrence_id": recurrence_id, "allocation_start_date": [">=", this_start]},
                    fields=["name", "allocation_start_date", "allocation_end_date"],
                )
                for override in day_overrides:
                    override_date = getdate(override.get("date"))
                    override_fields = {k: v for k, v in override.items() if k != "date"}
                    target_weekday = override_date.weekday()
                    for series_doc in series:
                        doc_start = getdate(series_doc.allocation_start_date)
                        doc_end = getdate(series_doc.allocation_end_date)
                        offset = (target_weekday - doc_start.weekday()) % 7
                        target_date = doc_start + timedelta(days=offset)
                        if target_date <= doc_end:
                            upsert_day_override(series_doc.name, str(target_date), override_fields)
                return {"success": True}

        for override in day_overrides:
            override_date = getdate(override.get("date"))
            override_fields = {k: v for k, v in override.items() if k != "date"}
            upsert_day_override(name, str(override_date), override_fields)
        return {"success": True}

    allocation.name = name

    if edit_mode == "whole_series":
        recurrence_id = frappe.db.get_value("Resource Allocation", name, "recurrence_id")
        if recurrence_id:
            series = frappe.get_all(
                "Resource Allocation",
                filters={"recurrence_id": recurrence_id},
                fields=["name", "allocation_start_date", "allocation_end_date"],
            )
            update_fields = {k: v for k, v in asdict(allocation).items() if k in NON_DATE_FIELDS and v is not None}
            for series_doc_meta in series:
                series_doc = frappe.get_doc("Resource Allocation", series_doc_meta.name)
                day_count = (
                    getdate(series_doc_meta.allocation_end_date) - getdate(series_doc_meta.allocation_start_date)
                ).days + 1
                series_doc.update(
                    {
                        **update_fields,
                        "total_allocated_hours": update_fields.get(
                            "hours_allocated_per_day", series_doc.hours_allocated_per_day
                        )
                        * day_count,
                    }
                )
                series_doc.save()
            return frappe.get_doc("Resource Allocation", name)

    return update_allocation(allocation)


@frappe.whitelist(methods=["POST"])
def delete_allocation(name: str, delete_mode: str):
    """Delete a Resource Allocation, optionally deleting all or future docs in the series.

    Args:
        name (str): Name of the allocation to delete.
        delete_mode (str): ``"only_this"`` — delete just this doc.
                           ``"this_and_future"`` — delete this doc and all later docs in the series.
                           ``"all_in_series"`` — delete every doc sharing the same ``recurrence_id``.
    """
    permission = resource_api_permissions_check()
    if not permission["write"]:
        frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    if delete_mode not in VALID_DELETE_MODES:
        frappe.throw(
            frappe._("Invalid delete_mode '{0}'. Allowed values: {1}.").format(
                delete_mode, ", ".join(sorted(VALID_DELETE_MODES))
            ),
            exc=frappe.ValidationError,
        )

    if not frappe.db.exists("Resource Allocation", name):
        frappe.throw(
            frappe._("Resource Allocation {0} does not exist.").format(name),
            exc=frappe.DoesNotExistError,
        )

    if delete_mode == "only_this":
        frappe.delete_doc("Resource Allocation", name)
        return {"success": True}

    recurrence_id = frappe.db.get_value("Resource Allocation", name, "recurrence_id")
    if not recurrence_id:
        frappe.delete_doc("Resource Allocation", name)
        return {"success": True}

    filters = {"recurrence_id": recurrence_id}
    if delete_mode == "this_and_future":
        this_start = frappe.db.get_value("Resource Allocation", name, "allocation_start_date")
        filters["allocation_start_date"] = [">=", this_start]

    names = frappe.db.get_all("Resource Allocation", filters=filters, pluck="name")
    for doc_name in names:
        frappe.delete_doc("Resource Allocation", doc_name)
    return {"success": True}
