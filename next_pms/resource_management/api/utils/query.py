import datetime

import frappe
from frappe.query_builder.functions import Sum
from frappe.utils.caching import redis_cache


def get_allocation_list_for_employee_for_given_range(
    columns: list[str],
    value_key: str,
    values: list[str],
    start_date: str | datetime.date,
    end_date: str | datetime.date,
    is_billable: list | int | None = None,
    allocation_status: list | None = None,
    is_need_fetch_all_weeks: bool = False,
) -> list[dict]:
    """Return Resource Allocation records for a list of employees or projects.

    Supports two fetching strategies controlled by `is_need_fetch_all_weeks`:

    - is_need_fetch_all_weeks=True: fetches ALL allocations for the given employees/
      projects with no date filter. `start_date` and `end_date` are ignored.

    - is_need_fetch_all_weeks=False (default): fetches only allocations that overlap
      the [start_date, end_date] window.

    Args:
        columns (list[str]): Fields to SELECT from the Resource Allocation doctype.
        value_key (str): Either "employee" or "project" — the filter column to match
            `values` against.
        values (list): List of employee IDs or project names to filter by.
            Returns [] immediately if empty.
        start_date (str | datetime.date): Range start. Ignored when
            `is_need_fetch_all_weeks` is True.
        end_date (str | datetime.date): Range end. Ignored when
            `is_need_fetch_all_weeks` is True.
        is_billable (list | int | None): Billable filter. Use ``[0]``, ``[1]``, or ``[0, 1]``.
            Legacy callers may pass ``0`` or ``1``; ``-1`` means no filter. ``None`` or
            ``[]`` also skips the filter. Defaults to None.
        allocation_status (list | None): Status values to match, e.g. ``["Active", "Tentative"]``.
            ``None`` or ``[]`` skips the filter. Defaults to None.
        is_need_fetch_all_weeks (bool): When True, skips the date range filter and
            returns all allocations for the given employees/projects. Defaults to False.

    Returns:
        ```py
        >>> get_allocation_list_for_employee_for_given_range(
        ...     columns=["name", "employee", "allocation_start_date", "allocation_end_date", "is_billable", "status"],
        ...     value_key="employee",
        ...     values=["HR-EMP-00001"],
        ...     start_date="2026-05-18",
        ...     end_date="2026-05-24",
        ...     is_billable=[1],
        ...     allocation_status=["Active"],
        ... )
        [
            {
                "name": "RA-00001",
                "employee": "HR-EMP-00001",
                "allocation_start_date": datetime.date(2026, 5, 1),
                "allocation_end_date": datetime.date(2026, 6, 30),
                "is_billable": 1,
                "status": "Active",
            },
        ]
        ```
    """
    if not values:
        return []

    if is_need_fetch_all_weeks:
        filters = {}

        if value_key == "employee":
            filters["employee"] = ["in", values]
        else:
            filters["project"] = ["in", values]

        billable_values = _normalize_is_billable_filter(is_billable)
        if billable_values:
            filters["is_billable"] = ["in", billable_values]
        if allocation_status:
            filters["status"] = ["in", allocation_status]

        return frappe.db.get_all(
            "Resource Allocation",
            filters=filters,
            fields=columns,
            order_by="employee_name, allocation_start_date, allocation_end_date",
        )

    # Only ways was to write sql for this, normal frappe methods are not working, also try with query build but looks like it dont have support of nesting condition.
    # nosemgrep
    sql_params = {
        "list_key": value_key,
        "names": values,
        "start_date": start_date,
        "end_date": end_date,
    }
    status_condition = ""
    if allocation_status:
        sql_params["allocation_status"] = allocation_status
        status_condition = "AND status IN %(allocation_status)s"

    return frappe.db.sql(
        f"""
        SELECT {", ".join(columns)} FROM `tabResource Allocation`
            WHERE {"employee" if value_key == "employee" else "project"} IN %(names)s
            {get_is_billable_condition(is_billable)}
            {status_condition}
            AND allocation_start_date <= %(end_date)s
            AND allocation_end_date >= %(start_date)s
            ORDER BY employee_name, allocation_start_date, allocation_end_date;
    """,
        sql_params,
        as_dict=True,
    )  # nosemgrep


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


def get_is_billable_condition(is_billable: list | int | None) -> str:
    """Return a raw SQL fragment for the ``is_billable`` filter, or an empty string.
    Args:
        is_billable (list | int | None): Accepts the same forms as
            ``_normalize_is_billable_filter``.

    Returns:
        str: ``"AND (is_billable IN (0, 1))"`` (or a subset), or ``""`` when no
        filter is needed. The fragment is safe to interpolate directly into the
        query because it only contains integer literals — no user-supplied strings.
    """
    billable_values = _normalize_is_billable_filter(is_billable)
    if not billable_values:
        return ""
    in_clause = ", ".join(str(v) for v in billable_values)
    return f"AND (is_billable IN ({in_clause}))"


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


@redis_cache
def get_employee_leaves(employee: str | tuple, start_date: str, end_date: str):
    """Get the total leave days for given employee for given time range.
    Args:
        employee (str | tuple): employee name or tuple of employee names
        start_date (str): start date
        end_date (str): end date
    Returns:
        list: list of leave applications
    """

    LeaveApplication = frappe.qb.DocType("Leave Application")
    LeaveType = frappe.qb.DocType("Leave Type")

    query = (
        frappe.qb.from_(LeaveApplication)
        .join(LeaveType)
        .on(LeaveApplication.leave_type == LeaveType.name)
        .select(
            LeaveApplication.employee,
            LeaveApplication.from_date,
            LeaveApplication.to_date,
            LeaveApplication.half_day,
            LeaveApplication.half_day_date,
            LeaveApplication.total_leave_days,
            LeaveApplication.name,
            LeaveApplication.leave_type,
            LeaveType.is_lwp,
        )
    )
    if isinstance(employee, tuple):
        query = query.where(LeaveApplication.employee.isin(employee))
    else:
        query = query.where(LeaveApplication.employee == employee)
    query = (
        query.where(
            ((LeaveApplication.from_date <= start_date) & (LeaveApplication.to_date >= start_date))
            | ((LeaveApplication.from_date >= start_date) & (LeaveApplication.to_date <= end_date))
            | ((LeaveApplication.from_date <= end_date) & (LeaveApplication.to_date >= end_date))
            | ((LeaveApplication.from_date <= start_date) & (LeaveApplication.to_date >= end_date))
        )
        .where((LeaveApplication.docstatus == 1) | (LeaveApplication.docstatus == 0))
        .where((LeaveApplication.status == "Approved") | (LeaveApplication.status == "Open"))
        .orderby(LeaveApplication.from_date)
        .orderby(LeaveApplication.to_date)
    )

    results = query.run(as_dict=True)

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
