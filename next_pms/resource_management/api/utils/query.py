import datetime

import frappe
from frappe.query_builder.functions import Sum
from frappe.utils import cint, date_diff, flt, getdate
from frappe.utils.caching import redis_cache


def get_allocation_list_for_employee_for_given_range(
    columns: list[str],
    value_key: str,
    values: list[str],
    start_date: str | datetime.date,
    end_date: str | datetime.date,
    is_billable: list | int | None = None,
    allocation_status: list | None = None,
) -> list[dict]:
    """Return Resource Allocation records for a list of employees or projects.

    Fetches only allocations that overlap the [start_date, end_date] window.

    Args:
        columns (list[str]): Fields to SELECT from the Resource Allocation doctype.
        value_key (str): Either "employee" or "project" — the filter column to match
            `values` against.
        values (list): List of employee IDs or project names to filter by.
            Returns [] immediately if empty.
        start_date (str | datetime.date): Range start.
        end_date (str | datetime.date): Range end.
        is_billable (list | int | None): Billable filter. Use ``[0]``, ``[1]``, or ``[0, 1]``.
            Legacy callers may pass ``0`` or ``1``; ``-1`` means no filter. ``None`` or
            ``[]`` also skips the filter. Defaults to None.
        allocation_status (list | None): Status values to match, e.g. ``["Confirmed", "Tentative"]``.
            ``None`` or ``[]`` skips the filter. Defaults to None.

    Returns:
        ```py
        >>> get_allocation_list_for_employee_for_given_range(
        ...     columns=["name", "employee", "allocation_start_date", "allocation_end_date", "is_billable", "status"],
        ...     value_key="employee",
        ...     values=["HR-EMP-00001"],
        ...     start_date="2026-05-18",
        ...     end_date="2026-05-24",
        ...     is_billable=[1],
        ...     allocation_status=["Confirmed"],
        ... )
        [
            {
                "name": "RA-00001",
                "employee": "HR-EMP-00001",
                "allocation_start_date": datetime.date(2026, 5, 1),
                "allocation_end_date": datetime.date(2026, 6, 30),
                "is_billable": 1,
                "status": "Confirmed",
            },
        ]
        ```
    """
    if not values:
        return []

    ResourceAllocation = frappe.qb.DocType("Resource Allocation")
    filter_column = ResourceAllocation.employee if value_key == "employee" else ResourceAllocation.project

    query = (
        frappe.qb.from_(ResourceAllocation)
        .select(*(getattr(ResourceAllocation, column) for column in columns))
        .where(filter_column.isin(values))
        .where(ResourceAllocation.allocation_start_date <= end_date)
        .where(ResourceAllocation.allocation_end_date >= start_date)
        .orderby(ResourceAllocation.employee_name)
        .orderby(ResourceAllocation.allocation_start_date)
        .orderby(ResourceAllocation.allocation_end_date)
    )

    billable_values = _normalize_is_billable_filter(is_billable)
    if billable_values:
        query = query.where(ResourceAllocation.is_billable.isin(billable_values))
    if allocation_status:
        query = query.where(ResourceAllocation.status.isin(allocation_status))

    return query.run(as_dict=True)


def get_projects_with_allocations(
    start_date: str | datetime.date,
    end_date: str | datetime.date,
    is_billable: list | int | None = None,
    allocation_status: list | None = None,
) -> list[str]:
    """Return the distinct projects having at least one Resource Allocation in the window.

    Mirrors the predicates of get_allocation_list_for_employee_for_given_range (window
    overlap, is_billable, status) without the project restriction, so the two queries
    can never disagree on which allocations "match".

    Args:
        start_date (str | datetime.date): Range start.
        end_date (str | datetime.date): Range end.
        is_billable (list | int | None): Billable filter, same conventions as
            get_allocation_list_for_employee_for_given_range. Defaults to None.
        allocation_status (list | None): Status values to match. ``None`` or ``[]``
            skips the filter. Defaults to None.

    Returns:
        list[str]: Distinct project names with a matching allocation in the window.
    """
    ResourceAllocation = frappe.qb.DocType("Resource Allocation")

    query = (
        frappe.qb.from_(ResourceAllocation)
        .select(ResourceAllocation.project)
        .distinct()
        .where(ResourceAllocation.allocation_start_date <= end_date)
        .where(ResourceAllocation.allocation_end_date >= start_date)
    )

    billable_values = _normalize_is_billable_filter(is_billable)
    if billable_values:
        query = query.where(ResourceAllocation.is_billable.isin(billable_values))
    if allocation_status:
        query = query.where(ResourceAllocation.status.isin(allocation_status))

    return query.run(pluck=True)


def has_active_allocation_filter(is_billable: list | int | None, allocation_status: list | None) -> bool:
    """Whether the caller requested an allocation-level filter (billable or status)."""
    return bool(allocation_status) or bool(_normalize_is_billable_filter(is_billable))


def _normalize_is_billable_filter(is_billable: list | int | None) -> list[int]:
    """Normalise the ``is_billable`` argument into a clean list of integers.

    Handles the three call-site conventions that exist in this codebase:

    - ``None`` or ``[]`` — no filter requested; returns ``[]``.
    - ``-1`` (legacy) — no filter; returns ``[]``.
    - ``0`` or ``1`` (plain int) — single-value filter; returns ``[0]`` or ``[1]``.
    - ``[0]``, ``[1]``, or ``[0, 1]`` (list) — already the canonical form; values are
      cast to ``int`` and returned as-is.

    Returns:
        list[int]: Values to use in an ``IN (...)`` clause, or ``[]`` when no
        billable filter should be applied.
    """
    if is_billable is None:
        return []
    if isinstance(is_billable, int):
        return [] if is_billable < 0 else [is_billable]
    return [int(v) for v in is_billable]


def attach_extra_entries(allocations: list[dict]) -> list[dict]:
    """Batch-fetch all Resource Allocation Extra Entry rows for a list of allocations and attach them in-place.

    Issues one query regardless of how many allocations are on the page, avoiding N+1.

    Args:
        allocations: List of Resource Allocation dicts — each must have a ``"name"`` key.

    Returns:
        The same list, each dict now containing an ``"override"`` key with a
        (possibly empty) list of extra entry row dicts.
    """
    if not allocations:
        return allocations

    parent_names = [a["name"] for a in allocations]
    rows = frappe.db.get_all(
        "Resource Allocation Extra Entry",
        filters={"parent": ["in", parent_names], "parenttype": "Resource Allocation"},
        fields=["name", "parent", "date", "hours", "cancelled", "source"],
        order_by="parent, date",
    )

    by_parent: dict[str, list] = {}
    for row in rows:
        by_parent.setdefault(row["parent"], []).append(row)

    for alloc in allocations:
        alloc["override"] = by_parent.get(alloc["name"], [])

    return allocations


def _working_days_between(start: datetime.date, end: datetime.date) -> int:
    """Count Mon-Fri days in the inclusive range, in constant time.

    Allocations routinely span months, so this must not iterate days.
    """
    total_days = (end - start).days + 1
    if total_days <= 0:
        return 0

    full_weeks, remainder = divmod(total_days, 7)
    weekday = start.weekday()

    return full_weeks * 5 + sum(1 for offset in range(remainder) if (weekday + offset) % 7 < 5)


def get_remaining_allocation_hours_by_project(
    projects: list[str],
    on_or_after: datetime.date,
    is_billable: list[int] | int | None = None,
    allocation_status: list[str] | None = None,
) -> dict[str, float]:
    """Return still-to-come allocated hours per project, keyed by project name.

    Sums each allocation's hours from ``on_or_after`` to its end date over the allocation's
    full span — deliberately not bounded by the view's week window, so the figure stays
    stable as the user scrolls. Per-day overrides (cancelled days, adjusted hours) are
    applied so the total agrees with the bars the grid draws.

    Costs two queries regardless of how many projects or weeks are on the page.
    """
    if not projects:
        return {}

    ResourceAllocation = frappe.qb.DocType("Resource Allocation")
    query = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.name,
            ResourceAllocation.project,
            ResourceAllocation.allocation_start_date,
            ResourceAllocation.allocation_end_date,
            ResourceAllocation.hours_allocated_per_day,
            ResourceAllocation.include_weekends,
        )
        .where(ResourceAllocation.project.isin(projects))
        .where(ResourceAllocation.allocation_end_date >= on_or_after)
    )

    billable_values = _normalize_is_billable_filter(is_billable)
    if billable_values:
        query = query.where(ResourceAllocation.is_billable.isin(billable_values))
    if allocation_status:
        query = query.where(ResourceAllocation.status.isin(allocation_status))

    allocations = attach_extra_entries(query.run(as_dict=True))

    remaining_hours = {}
    for allocation in allocations:
        start = max(getdate(allocation.allocation_start_date), on_or_after)
        end = getdate(allocation.allocation_end_date)
        includes_weekends = cint(allocation.include_weekends)
        hours_per_day = flt(allocation.hours_allocated_per_day)

        days = (end - start).days + 1 if includes_weekends else _working_days_between(start, end)
        hours = days * hours_per_day

        for entry in allocation.override or []:
            date = getdate(entry.date)
            if not start <= date <= end:
                continue
            if not includes_weekends and date.weekday() >= 5:
                continue
            hours += (0 if cint(entry.cancelled) else flt(entry.hours)) - hours_per_day

        remaining_hours[allocation.project] = remaining_hours.get(allocation.project, 0.0) + hours

    return remaining_hours


def get_allocation_worked_hours_for_given_projects(project: str, start_date: str, end_date: str):
    """Get the total hours spend for given projects for given time range.

    Args:
        project (str): project name
        start_date (str): start date
        end_date (str): end date

    Returns:
        flot: total hours spend for given project
    """
    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")

    total_hours = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            Sum(TimesheetDetail.hours).as_("time"),
        )
        .where(TimesheetDetail.project == project)
        .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
        .where((TimesheetDetail.from_time >= start_date) & (TimesheetDetail.to_time <= end_date))
    ).run(as_dict=True)[0]

    return total_hours.get("time") or 0.0


def leave_includes_holidays(leave: dict) -> bool:
    """Return whether a leave's stored day count covers the holidays inside its range.

    Leave Application.total_leave_days is recomputed server-side on every save by
    get_number_of_leave_days, which honours Leave Type.include_holiday and any
    site-level override of that policy (rtCamp, for instance, monkey-patches it so that
    unpaid leave spanning fewer than five working days drops holidays while longer runs
    keep them). Comparing the stored count against the raw calendar span therefore tells
    us what was actually counted, without restating any of those rules here.
    """
    span = date_diff(leave["to_date"], leave["from_date"]) + 1

    if cint(leave.get("half_day")):
        half_day_date = leave.get("half_day_date")
        if getdate(leave["from_date"]) == getdate(leave["to_date"]):
            span = 0.5
        elif half_day_date and getdate(leave["from_date"]) <= getdate(half_day_date) <= getdate(leave["to_date"]):
            span -= 0.5

    # total_leave_days is persisted at 2-decimal precision; round the span to match so the
    # comparison never trips on sub-precision float noise (e.g. a stored 6.999999 vs a span of 7).
    return flt(leave.get("total_leave_days"), 2) >= flt(span, 2)


@redis_cache
def get_employee_leaves(employee: str | tuple, start_date: str, end_date: str):
    """Return Leave Application records that overlap a date range for one or more employees.

    Fetches approved or open leave applications whose ``from_date``/``to_date`` window
    overlaps ``[start_date, end_date]``. Joins ``Leave Type`` to include ``is_lwp`` (is leave without pay),
    and derives ``includes_holidays`` (see :func:`leave_includes_holidays`) so callers can render a leave
    across its whole range or skip the holidays inside it without re-deriving leave policy.

    Pass a single employee ID for one person, or a ``tuple`` of IDs to batch-fetch
    leaves for multiple employees in one query.

    Only rows with ``docstatus`` in ``(0, 1)`` and ``status`` in
    ``("Approved", "Open")`` are returned. Results are ordered by ``from_date``,
    then ``to_date``.

    Args:
        employee (str | tuple): Employee ID, or a tuple of employee IDs for a
            multi-employee ``IN`` filter.
        start_date (str): Range start (``"YYYY-MM-DD"``). Any leave overlapping this
            date is included.
        end_date (str): Range end (``"YYYY-MM-DD"``).

    Returns:
        ```py
        >>> get_employee_leaves(
        ...     employee="HR-EMP-00001",
        ...     start_date="2026-05-18",
        ...     end_date="2026-05-24",
        ... )
        [
            {
                "employee": "HR-EMP-00001",
                "from_date": datetime.date(2026, 5, 20),
                "to_date": datetime.date(2026, 5, 22),
                "half_day": 0,
                "half_day_date": None,
                "total_leave_days": 3.0,
                "name": "HR-LAP-00001",
                "leave_type": "Casual Leave",
                "custom_first_halfsecond_half": None,
                "is_lwp": 0,
                "includes_holidays": True,
            },
        ]

        >>> get_employee_leaves(
        ...     employee=("HR-EMP-00001", "HR-EMP-00002"),
        ...     start_date="2026-05-18",
        ...     end_date="2026-05-24",
        ... )
        [
            {
                "employee": "HR-EMP-00001",
                "from_date": datetime.date(2026, 5, 20),
                "to_date": datetime.date(2026, 5, 22),
                "half_day": 0,
                "half_day_date": None,
                "total_leave_days": 3.0,
                "name": "HR-LAP-00001",
                "leave_type": "Casual Leave",
                "custom_first_halfsecond_half": None,
                "is_lwp": 0,
                "includes_holidays": True,
            },
            {
                "employee": "HR-EMP-00002",
                "from_date": datetime.date(2026, 5, 19),
                "to_date": datetime.date(2026, 5, 19),
                "half_day": 1,
                "half_day_date": datetime.date(2026, 5, 19),
                "total_leave_days": 0.5,
                "name": "HR-LAP-00002",
                "leave_type": "Sick Leave",
                "custom_first_halfsecond_half": "First Half",
                "is_lwp": 0,
                "includes_holidays": True,
            },
        ]
        ```
    """

    if isinstance(employee, tuple) and not employee:
        return []

    LeaveApplication = frappe.qb.DocType("Leave Application")
    LeaveType = frappe.qb.DocType("Leave Type")

    has_first_half_column = frappe.db.has_column("Leave Application", "custom_first_halfsecond_half")

    select_fields = [
        LeaveApplication.employee,
        LeaveApplication.from_date,
        LeaveApplication.to_date,
        LeaveApplication.half_day,
        LeaveApplication.half_day_date,
        LeaveApplication.total_leave_days,
        LeaveApplication.name,
        LeaveApplication.leave_type,
        LeaveType.is_lwp,
    ]
    if has_first_half_column:
        select_fields.append(LeaveApplication.custom_first_halfsecond_half)

    query = (
        frappe.qb.from_(LeaveApplication)
        .join(LeaveType)
        .on(LeaveApplication.leave_type == LeaveType.name)
        .select(*select_fields)
    )
    if isinstance(employee, tuple):
        query = query.where(LeaveApplication.employee.isin(employee))
    else:
        query = query.where(LeaveApplication.employee == employee)
    query = (
        query.where(LeaveApplication.from_date <= end_date)
        .where(LeaveApplication.to_date >= start_date)
        .where((LeaveApplication.docstatus == 1) | (LeaveApplication.docstatus == 0))
        .where((LeaveApplication.status == "Approved") | (LeaveApplication.status == "Open"))
        .orderby(LeaveApplication.from_date)
        .orderby(LeaveApplication.to_date)
    )

    results = query.run(as_dict=True)

    for row in results:
        if not has_first_half_column:
            row["custom_first_halfsecond_half"] = None
        row["includes_holidays"] = leave_includes_holidays(row)

    return results


def get_allocation_worked_hours_for_given_employee(project: str, employee: str, start_date: str, end_date: str):
    """Get the total hours spend for given projects for given time range.

    Args:
        project (str): project name
        start_date (str): start date
        end_date (str): end date

    Returns:
        flot: total hours spend for given project
    """
    Timesheet = frappe.qb.DocType("Timesheet")

    all_timesheets = (
        frappe.qb.from_(Timesheet)
        .select(Timesheet.name)
        .where(Timesheet.employee == employee)
        .where(Timesheet.parent_project == project)
        .where((Timesheet.docstatus == 1) | (Timesheet.docstatus == 0))
        .where((Timesheet.start_date >= start_date) & (Timesheet.end_date <= end_date))
    ).run(as_dict=True)

    if not all_timesheets:
        return 0.0

    timesheets = [timesheet["name"] for timesheet in all_timesheets]

    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")

    total_hours = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            Sum(TimesheetDetail.hours).as_("time"),
        )
        .where(TimesheetDetail.parent.isin(timesheets))
        .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
        .where((TimesheetDetail.from_time >= start_date) & (TimesheetDetail.to_time <= end_date))
    ).run(as_dict=True)[0]

    return total_hours.get("time") or 0.0
