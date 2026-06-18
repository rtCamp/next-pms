import uuid
from dataclasses import asdict, dataclass
from datetime import date, timedelta

import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import add_days
from frappe.utils import cint, getdate

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check
from next_pms.resource_management.doctype.resource_allocation.resource_allocation import clear_cache

NON_DATE_FIELDS = frozenset({"project", "customer", "is_billable", "status", "note", "hours_allocated_per_day"})
RECURRING_IMMUTABLE_FIELDS = ("employee", "project", "customer")
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


def delete_day_override(doc_name: str, override_date: str):
    """Remove a single day override row from a Resource Allocation doc.

    Deleting the row (as opposed to setting ``cancelled=1``) reverts the day back to the
    allocation's default hours. No-op if no row exists for the given date.

    Args:
        doc_name (str): Name of the Resource Allocation document.
        override_date (str): The specific date to clear (``"YYYY-MM-DD"``).
    """
    existing_row = frappe.db.get_value(
        "Resource Allocation Extra Entry",
        {"parent": doc_name, "parenttype": "Resource Allocation", "date": override_date},
        "name",
    )
    if not existing_row:
        return

    doc = frappe.get_doc("Resource Allocation", doc_name)
    doc.override = [row for row in doc.override if row.name != existing_row]
    doc.save()


def apply_day_overrides(doc_name: str, day_overrides: list[dict] | None, deleted_day_overrides: list[str] | None):
    """Apply a batch of add/edit (``day_overrides``) and delete (``deleted_day_overrides``)
    operations to a single Resource Allocation doc, keyed on the literal override dates."""
    for override in day_overrides or []:
        override_fields = {k: v for k, v in override.items() if k != "date"}
        upsert_day_override(doc_name, str(getdate(override.get("date"))), override_fields)

    for deleted_date in deleted_day_overrides or []:
        delete_day_override(doc_name, str(getdate(deleted_date)))


def _assert_recurring_immutable(allocation: AllocationPayload, stored: dict):
    """For a recurring allocation, employee/project/customer must not change."""
    changed = [
        f
        for f in RECURRING_IMMUTABLE_FIELDS
        if getattr(allocation, f) is not None and getattr(allocation, f) != stored.get(f)
    ]
    if changed:
        frappe.throw(
            frappe._("Cannot change {0} for a recurring allocation.").format(", ".join(changed)),
            exc=frappe.ValidationError,
        )


def clear_day_overrides(doc_name: str):
    """Remove all day-override rows from a Resource Allocation doc."""
    doc = frappe.get_doc("Resource Allocation", doc_name)
    if doc.override:
        doc.override = []
        doc.save()


def _propagate_day_overrides_to_series(
    series: list, day_overrides: list[dict] | None, deleted_day_overrides: list[str] | None
):
    """Propagate day-override add/edit/delete to each series doc, matching by weekday.

    A source override date is mapped onto the corresponding weekday within each series doc's
    own date range, so e.g. a Tuesday override applies to every doc's Tuesday.
    """

    def each_series_target(source_date):
        """Yield (series_doc_name, target_date) for the weekday matching source_date."""
        target_weekday = getdate(source_date).weekday()
        for series_doc in series:
            doc_start = getdate(series_doc.allocation_start_date)
            doc_end = getdate(series_doc.allocation_end_date)
            offset = (target_weekday - doc_start.weekday()) % 7
            target_date = doc_start + timedelta(days=offset)
            if target_date <= doc_end:
                yield series_doc.name, str(target_date)

    for override in day_overrides or []:
        override_fields = {k: v for k, v in override.items() if k != "date"}
        for doc_name, target_date in each_series_target(override.get("date")):
            upsert_day_override(doc_name, target_date, override_fields)

    for deleted_date in deleted_day_overrides or []:
        for doc_name, target_date in each_series_target(deleted_date):
            delete_day_override(doc_name, target_date)


@frappe.whitelist(methods=["POST"])
def edit_allocation(
    name: str,
    edit_mode: str,
    allocation: AllocationPayload,
    day_overrides: list[dict] | None = None,
    deleted_day_overrides: list[str] | None = None,
):
    """Edit a Resource Allocation, optionally propagating changes to all docs in the series.

    Args:
        name (str): Name of the allocation being edited.
        edit_mode (str): ``"only_this"`` — update this doc: apply ``allocation`` (duration +
                         fields) and then any day-override add/edit/delete in a single pass.
                         ``"whole_series"`` — update all docs sharing the same ``recurrence_id``
                         with the non-date ``allocation`` fields.
                         ``"this_and_future"`` — update this doc and all later docs in the series
                         with the non-date ``allocation`` fields, and propagate the day-override
                         add/edit/delete to each (matched by weekday). Individual date ranges are
                         left unchanged.
        allocation (AllocationPayload): New field values. Always applied for ``only_this``
                                        (alongside any overrides); the non-date fields are applied
                                        under ``whole_series`` and ``this_and_future``.
        day_overrides (list[dict] | None): Per-day overrides to add or edit, each a dict with a
                                           ``"date"`` key plus the fields to set, e.g.
                                           ``[{"date": "2025-06-05", "cancelled": 1}, {"date": "2025-06-06", "hours": 4.0}]``.
        deleted_day_overrides (list[str] | None): Dates whose override rows should be removed,
                                           e.g. ``["2025-06-05"]``. Deleting reverts the day to
                                           the allocation's default hours (unlike ``cancelled=1``).

    Notes:
        - For a recurring allocation (one with a ``recurrence_id``), ``employee``, ``project`` and
          ``customer`` are immutable: a request that changes any of them raises ``ValidationError``.
        - Changing ``hours_allocated_per_day`` wipes the entire day-override table on every affected
          doc, since overrides store absolute per-day hours that no longer reflect the new default.
    """
    permission = resource_api_permissions_check()
    if not permission["write"]:
        frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    allocation.name = name
    stored = frappe.db.get_value(
        "Resource Allocation",
        name,
        ("recurrence_id", "employee", "project", "customer", "hours_allocated_per_day", "allocation_start_date"),
        as_dict=True,
    )

    if stored.recurrence_id:
        _assert_recurring_immutable(allocation, stored)

    hours_changed = allocation.hours_allocated_per_day is not None and float(
        allocation.hours_allocated_per_day
    ) != float(stored.hours_allocated_per_day or 0)

    if edit_mode in ("whole_series", "this_and_future") and stored.recurrence_id:
        filters = {"recurrence_id": stored.recurrence_id}
        if edit_mode == "this_and_future":
            filters["allocation_start_date"] = [">=", stored.allocation_start_date]
        series = frappe.get_all(
            "Resource Allocation",
            filters=filters,
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
            if hours_changed:
                series_doc.override = []
            series_doc.save()

        if edit_mode == "this_and_future":
            _propagate_day_overrides_to_series(series, day_overrides, deleted_day_overrides)
        return frappe.get_doc("Resource Allocation", name)

    result = update_allocation(allocation)
    if hours_changed:
        clear_day_overrides(name)
    apply_day_overrides(name, day_overrides, deleted_day_overrides)
    return result


@frappe.whitelist()
def get_series_remaining_weeks(name: str):
    """Return how many weeks of the recurrence series run from this allocation onward.

    Used by the edit-schedule modal to show how far the series still repeats from the
    picked allocation (e.g. "Repeats for 3 weeks till Feb 18"). The count is inclusive
    of the picked allocation: for a 5-week series, the 3rd week reports 3 remaining
    weeks (weeks 3, 4 and 5).

    Args:
        name (str): Name of the picked allocation. The series is resolved from this
                    doc's own ``recurrence_id``.

    Returns:
        dict: ``allocation_start_date`` / ``allocation_end_date`` of the picked doc,
        ``remaining_weeks`` (count from this doc onward, inclusive), and
        ``series_end_date`` (the last allocation's end date in the series).
    """
    permission = resource_api_permissions_check()
    if not permission["read"]:
        frappe.throw(frappe._("You are not allowed to perform this action."), exc=frappe.PermissionError)

    allocation = frappe.db.get_value(
        "Resource Allocation",
        name,
        ["allocation_start_date", "allocation_end_date", "recurrence_id"],
        as_dict=True,
    )
    if not allocation:
        frappe.throw(
            frappe._("Resource Allocation {0} does not exist.").format(name),
            exc=frappe.DoesNotExistError,
        )

    # a standalone allocation (no series) is its own single remaining week
    if not allocation.recurrence_id:
        return {
            "allocation_start_date": allocation.allocation_start_date,
            "allocation_end_date": allocation.allocation_end_date,
            "remaining_weeks": 1,
            "series_end_date": allocation.allocation_end_date,
        }

    future_filters = {
        "recurrence_id": allocation.recurrence_id,
        "allocation_start_date": [">=", allocation.allocation_start_date],
    }
    remaining_weeks = frappe.db.count("Resource Allocation", filters=future_filters)
    series_end_date = frappe.db.get_value(
        "Resource Allocation",
        future_filters,
        "allocation_end_date",
        order_by="allocation_start_date desc",
    )

    return {
        "allocation_start_date": allocation.allocation_start_date,
        "allocation_end_date": allocation.allocation_end_date,
        "remaining_weeks": remaining_weeks,
        "series_end_date": series_end_date or allocation.allocation_end_date,
    }


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
