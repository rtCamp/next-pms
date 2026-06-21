# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import json
from datetime import timedelta

import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe import only_for, whitelist
from frappe.core.doctype.recorder.recorder import redis_cache
from frappe.query_builder import DocType
from frappe.query_builder.functions import Sum
from frappe.utils import add_days, cint, flt, getdate, today
from pypika import Case
from pypika.functions import Date

from next_pms.api.utils import (
    error_logger,
    get_employee_allocated_hours_for_date,
    get_holidays_by_employee,
    get_working_dates_for_range,
    is_full_day_leave,
    is_holiday,
    sum_to_usd,
)
from next_pms.next_projects.api.constant import TIMELINE_ITEM_FIELDS
from next_pms.next_projects.api.project_timeline_item import enrich_timeline_item
from next_pms.resource_management.api.utils.query import attach_extra_entries, get_employee_leaves
from next_pms.timesheet.api.employee import get_employee_daily_working_norm, get_employee_from_user

ALLOWED_ROLES = ["Projects Manager", "Projects User"]


@whitelist(methods=["GET"])
def get_active_projects_count(client: str | None = None, project: str | None = None) -> int:
    only_for(["System Manager"], message=True)

    filters = {"is_active": "Yes"}
    if client:
        filters["customer"] = client
    if project:
        filters["name"] = project
    return frappe.db.count("Project", filters=filters)


@whitelist(methods=["GET"])
def get_at_risk_projects_count(client: str | None = None, project: str | None = None) -> int:
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    filters = {
        "is_active": "Yes",
        "custom_project_rag_status": ["in", ["Red", "Amber"]],
    }
    if client:
        filters["customer"] = client
    if project:
        filters["name"] = project
    return frappe.db.count("Project", filters=filters)


@whitelist(methods=["GET"])
def get_timesheets_to_review(
    days: int = 7,
    client: str | None = None,
    project: str | None = None,
) -> list:
    """Return timesheets pending approval from direct reports of the current user.

    Parameters
    ----------
    days : int, optional
        Look-back window in days from today. Defaults to 7.

    Returns
    -------
    list of dict
        Each item has: name, employee, employee_name, start_date, end_date,
        custom_approval_status.
        Empty list if the user has no employee record or no direct reports.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    manager_employee = get_employee_from_user()
    if not manager_employee:
        return []

    since = add_days(today(), -days)

    reportee_ids = frappe.get_all(
        "Employee",
        filters={"reports_to": manager_employee, "status": "Active"},
        pluck="name",
    )
    if not reportee_ids:
        return []

    filters = {
        "employee": ["in", reportee_ids],
        "start_date": [">=", since],
        "custom_approval_status": "Approval Pending",
    }
    if client:
        filters["customer"] = client
    if project:
        filters["parent_project"] = project

    timesheets = frappe.get_all(
        "Timesheet",
        filters=filters,
        fields=["name", "employee", "employee_name", "start_date", "end_date", "custom_approval_status"],
        order_by="start_date desc",
    )
    return timesheets


@whitelist(methods=["GET"])
def get_non_billable_hours(
    days: int = 30,
    client: str | None = None,
    project: str | None = None,
) -> float:
    """Return total non-billable hours logged across all timesheets in the given window.

    Parameters
    ----------
    days : int, optional
        Look-back window in days from today. Defaults to 30.

    Returns
    -------
    float
        Sum of hours from Timesheet Detail rows where is_billable = 0
        within the window.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)
    return _get_non_billable_hours(days, client, project)


@redis_cache(ttl=21600)
def _get_non_billable_hours(days: int, client: str | None, project: str | None) -> float:
    TimesheetDetail = DocType("Timesheet Detail")
    since = add_days(today(), -days)

    query = (
        frappe.qb.from_(TimesheetDetail)
        .select(Sum(TimesheetDetail.hours).as_("total"))
        .where(TimesheetDetail.is_billable == 0)
        .where(Date(TimesheetDetail.from_time) >= since)
    )
    if client:
        Project = DocType("Project")
        query = query.join(Project).on(TimesheetDetail.project == Project.name).where(Project.customer == client)
    if project:
        query = query.where(TimesheetDetail.project == project)
    result = query.run(as_dict=True)

    return flt(result[0].total) if result else 0.0


@whitelist(methods=["GET"])
def get_members_without_allocation(days: int = 7) -> dict:
    """Return active employees who are under-allocated on at least one working day.

    A working day is any calendar day in the look-back window. Weekends are
    included only when Allow Weekend Entries is enabled in Timesheet Settings.

    An employee is counted when their total confirmed allocation hours for a day
    are less than their expected daily working hours (from Employee custom fields,
    falling back to HR Settings standard_working_hours).

    Args:
        days: Inclusive look-back window length ending today. Must be at least 1.
            For example, days=7 on 9 Jun covers 3 Jun through 9 Jun inclusive.

    Returns:
        A dict with count (unique under-allocated employees), days (requested
        window length), start_date, end_date, and members. Each member entry
        includes employee, employee_name, daily_working_hours, and gap_dates.
        Each gap_dates item has date, allocated_hours, and missing_hours.

    Raises:
        frappe.PermissionError: If the caller lacks Projects Manager, Projects User,
            or System Manager role.
        frappe.ValidationError: If days is less than 1.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    if days < 1:
        frappe.throw(frappe._("days must be at least 1"))

    return _get_members_without_allocation(days)


@redis_cache(ttl=21600)
def _get_members_without_allocation(days: int) -> dict:
    end_date = getdate(today())
    start_date = end_date - timedelta(days=days - 1)
    allow_weekend_entries = cint(frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries"))
    working_dates = []
    for offset in range(days):
        date = start_date + timedelta(days=offset)
        if allow_weekend_entries or date.weekday() < 5:
            working_dates.append(date)

    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "employee_name", "custom_working_hours", "custom_work_schedule"],
    )

    if not employees or not working_dates:
        return {
            "count": 0,
            "days": days,
            "start_date": start_date,
            "end_date": end_date,
            "members": [],
        }

    default_daily_hours = flt(frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8)
    employee_names = [employee.name for employee in employees]

    ResourceAllocation = DocType("Resource Allocation")
    allocations_query = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.name,
            ResourceAllocation.employee,
            ResourceAllocation.employee_name,
            ResourceAllocation.allocation_start_date,
            ResourceAllocation.allocation_end_date,
            ResourceAllocation.hours_allocated_per_day,
            ResourceAllocation.status,
        )
        .where(ResourceAllocation.employee.isin(employee_names))
        .where(ResourceAllocation.allocation_start_date <= end_date)
        .where(ResourceAllocation.allocation_end_date >= start_date)
        .where(ResourceAllocation.status == "Confirmed")
    )
    allocations = allocations_query.run(as_dict=True)
    allocations = attach_extra_entries(allocations)

    allocations_by_employee = {}
    for allocation in allocations:
        allocations_by_employee.setdefault(allocation.employee, []).append(allocation)

    members = []
    for employee in employees:
        working_hours = flt(employee.custom_working_hours) or default_daily_hours
        daily_working_hours = working_hours / 5 if employee.custom_work_schedule == "Per Week" else working_hours
        daily_working_hours = flt(daily_working_hours)
        gap_dates = []

        for date in working_dates:
            allocated_hours = get_employee_allocated_hours_for_date(
                allocations_by_employee.get(employee.name, []),
                date,
            )
            if allocated_hours < daily_working_hours:
                gap_dates.append(
                    {
                        "date": date,
                        "allocated_hours": flt(allocated_hours, 2),
                        "missing_hours": flt(daily_working_hours - allocated_hours, 2),
                    }
                )

        if gap_dates:
            members.append(
                {
                    "employee": employee.name,
                    "employee_name": employee.employee_name,
                    "daily_working_hours": daily_working_hours,
                    "gap_dates": gap_dates,
                }
            )

    return {
        "count": len(members),
        "days": days,
        "start_date": start_date,
        "end_date": end_date,
        "members": members,
    }


@whitelist(methods=["GET"])
def get_outstanding_timesheets(
    days: int = 7,
    client: str | None = None,
    project: str | None = None,
) -> dict:
    """Return direct reports missing timesheets on one or more past working days.

    Only active employees who report to the current user's Employee record are
    checked. The look-back window is the past days calendar days ending yesterday
    (today is excluded). Weekends count as working days only when Allow Weekend
    Entries is enabled in Timesheet Settings. Full-day approved or open leave
    and holidays exempt a day from the check; half-day leave still requires a
    timesheet. An employee is flagged when distinct timesheet days in the window
    are fewer than required days; any day in the window counts toward the total.

    Args:
        days: Inclusive look-back length ending yesterday. Must be at least 1.
            For example, days=7 on 10 Mar covers 3 Mar through 9 Mar.

    Returns:
        A dict with count (flagged employees), days, start_date, end_date,
        and members. Each member has employee, employee_name, timesheet_count,
        expected_count (required days after excluding full-day leave and holidays),
        missing_count, and missing_dates. Returns an empty
        members list when the user has no linked Employee record or no active
        direct reports.

    Raises:
        frappe.PermissionError: If the caller lacks Projects Manager, Projects User,
            or System Manager role.
        frappe.ValidationError: If days is less than 1.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    if days < 1:
        frappe.throw(frappe._("days must be at least 1"))

    return _get_outstanding_timesheets(frappe.session.user, days, client, project)


@redis_cache(user=True, ttl=21600)
def _get_outstanding_timesheets(user: str, days: int, client: str | None, project: str | None) -> dict:
    end_date = getdate(add_days(today(), -1))
    start_date = end_date - timedelta(days=days - 1)
    allow_weekend_entries = cint(frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries"))
    working_dates = get_working_dates_for_range(start_date, end_date, allow_weekend_entries)

    empty_response = {
        "count": 0,
        "days": days,
        "start_date": start_date,
        "end_date": end_date,
        "members": [],
    }

    manager_employee = frappe.db.get_value("Employee", {"user_id": user})
    if not manager_employee or not working_dates:
        return empty_response

    employees = frappe.get_all(
        "Employee",
        filters={"reports_to": manager_employee, "status": "Active"},
        fields=["name", "employee_name"],
    )

    if not employees:
        return empty_response

    employee_names = [employee.name for employee in employees]
    Timesheet = DocType("Timesheet")
    if client or project:
        ResourceAllocation = DocType("Resource Allocation")
        allocation_query = (
            frappe.qb.from_(ResourceAllocation)
            .select(ResourceAllocation.employee)
            .where(ResourceAllocation.employee.isin(employee_names))
            .where(ResourceAllocation.allocation_start_date <= end_date)
            .where(ResourceAllocation.allocation_end_date >= start_date)
            .where(ResourceAllocation.status == "Confirmed")
        )
        if client:
            allocation_query = allocation_query.where(ResourceAllocation.customer == client)
        if project:
            allocation_query = allocation_query.where(ResourceAllocation.project == project)
        allocation_rows = allocation_query.run(as_dict=True)
        allocation_employee_names = {row.employee for row in allocation_rows if row.employee}

        employees = [employee for employee in employees if employee.name in allocation_employee_names]
        if not employees:
            return empty_response
        employee_names = [employee.name for employee in employees]

    leaves_by_employee = {}
    for leave in get_employee_leaves(tuple(employee_names), start_date, end_date):
        leaves_by_employee.setdefault(leave.employee, []).append(leave)

    holiday_list_by_employee = {}
    for employee in employees:
        holiday_list_by_employee[employee.name] = get_holiday_list_for_employee(employee.name, raise_exception=False)

    unique_holiday_lists = {holiday_list for holiday_list in holiday_list_by_employee.values() if holiday_list}
    holidays_by_list = {}
    for holiday_list in unique_holiday_lists:
        holidays_by_list[holiday_list] = frappe.get_all(
            "Holiday",
            filters={
                "parent": holiday_list,
                "holiday_date": ["between", (start_date, end_date)],
            },
            fields=["holiday_date"],
        )

    holidays_by_employee = {}
    for employee in employees:
        holiday_list = holiday_list_by_employee.get(employee.name)
        holidays_by_employee[employee.name] = holidays_by_list.get(holiday_list, [])

    timesheet_query = (
        frappe.qb.from_(Timesheet)
        .select(Timesheet.employee, Timesheet.start_date)
        .where(Timesheet.employee.isin(employee_names))
        .where(Timesheet.start_date >= start_date)
        .where(Timesheet.start_date <= end_date)
    )
    if client:
        timesheet_query = timesheet_query.where(Timesheet.customer == client)
    if project:
        timesheet_query = timesheet_query.where(Timesheet.parent_project == project)
    timesheet_rows = timesheet_query.run(as_dict=True)

    timesheet_days_by_employee = {}
    for row in timesheet_rows:
        timesheet_date = getdate(row.start_date)
        timesheet_days_by_employee.setdefault(row.employee, set()).add(timesheet_date)

    members = []
    for employee in employees:
        covered_dates = timesheet_days_by_employee.get(employee.name, set())
        employee_leaves = leaves_by_employee.get(employee.name, [])
        employee_holidays = holidays_by_employee.get(employee.name, [])
        missing_dates = []
        required_count = 0

        for date in sorted(working_dates):
            if is_full_day_leave(date, employee_leaves) or is_holiday(date, employee_holidays):
                continue
            required_count += 1
            if date not in covered_dates:
                missing_dates.append(date)

        timesheet_count = len(covered_dates)
        if timesheet_count >= required_count:
            continue

        members.append(
            {
                "employee": employee.name,
                "employee_name": employee.employee_name,
                "timesheet_count": timesheet_count,
                "expected_count": required_count,
                "missing_count": required_count - timesheet_count,
                "missing_dates": missing_dates,
            }
        )

    return {
        "count": len(members),
        "days": days,
        "start_date": start_date,
        "end_date": end_date,
        "members": members,
    }


@whitelist(methods=["GET"])
def get_my_projects_summary(days: int = 7, customer: str | None = None) -> list:
    """Return hour breakdowns for projects where the current user is the project manager.

    Parameters
    ----------
    days : int, optional
        Look-back window in days from today for the billable/non-billable sums.
        Defaults to 7.
    customer : str, optional
        Filter projects by customer name. Defaults to None (all customers).

    Returns
    -------
    list of dict
        One entry per project with keys:
            name, project_name, customer,
            total_hours_purchased, actual_time, total_hours_remaining,
            billable_hours, non_billable_hours  (both summed over the window).
        Empty list if the user manages no projects.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)
    return _get_my_projects_summary(frappe.session.user, days, customer)


@redis_cache(user=True, ttl=21600)
def _get_my_projects_summary(user: str, days: int, customer: str | None) -> list:
    since = add_days(today(), -days)

    filters = {"custom_project_manager": user, "status": "Open"}
    if customer:
        filters["customer"] = customer

    projects = frappe.get_all(
        "Project",
        filters=filters,
        fields=[
            "name",
            "project_name",
            "customer",
            "custom_total_hours_purchased",
            "actual_time",
            "custom_total_hours_remaining",
        ],
    )
    if not projects:
        return []

    project_names = [p.name for p in projects]

    TimesheetDetail = DocType("Timesheet Detail")
    Timesheet = DocType("Timesheet")

    hours_rows = (
        frappe.qb.from_(TimesheetDetail)
        .join(Timesheet)
        .on(TimesheetDetail.parent == Timesheet.name)
        .select(
            TimesheetDetail.project,
            TimesheetDetail.is_billable,
            Sum(TimesheetDetail.hours).as_("total_hours"),
        )
        .where(TimesheetDetail.project.isin(project_names))
        .where(TimesheetDetail.from_time >= since)
        .where(TimesheetDetail.from_time < add_days(today(), 1))
        .where(Timesheet.docstatus.isin([0, 1]))
        .groupby(TimesheetDetail.project, TimesheetDetail.is_billable)
        .run(as_dict=True)
    )

    billable_map = {}
    non_billable_map = {}

    for row in hours_rows:
        if row.is_billable:
            billable_map[row.project] = flt(row.total_hours)
        else:
            non_billable_map[row.project] = flt(row.total_hours)

    return [
        {
            "name": p.name,
            "project_name": p.project_name,
            "customer": p.customer,
            "total_hours_purchased": flt(p.custom_total_hours_purchased),
            "actual_time": flt(p.actual_time),
            "total_hours_remaining": flt(p.custom_total_hours_remaining),
            "billable_hours": billable_map.get(p.name, 0.0),
            "non_billable_hours": non_billable_map.get(p.name, 0.0),
        }
        for p in projects
    ]


@whitelist(methods=["GET"])
def get_leadership_kpis(
    cur_start: str,
    cur_end: str,
    prev_start: str,
    prev_end: str,
    client: str | None = None,
    project: str | None = None,
) -> dict:
    """Return revenue, cost and profit margin KPIs for the leadership dashboard.

    Parameters
    ----------
    cur_start : str
            Start date of the current period (YYYY-MM-DD) inclusive.
    cur_end : str
            End date of the current period (YYYY-MM-DD) inclusive.
    prev_start : str
            Start date of the comparison period (YYYY-MM-DD) inclusive.
    prev_end : str
            End date of the comparison period (YYYY-MM-DD) inclusive.
    client : str, optional
            Filter by Project.customer.
    project : str, optional
            Filter by a specific project name.

    Returns
    -------
    dict
            Keys: revenue, cost, profit_margin.
            Each value is a dict with current, previous, change_pct, trend.
            Example: {
            "revenue": {"current": 1000, "previous": 900, "change_pct": 10, "trend": "up"},
            "cost": {"current": 800, "previous": 700, "change_pct": 10, "trend": "up"},
            "profit_margin": {"current": 20, "previous": 10, "change_pct": 100, "trend": "up"}
            }
    """
    only_for(ALLOWED_ROLES, message=True)

    cur_start = getdate(cur_start)
    cur_end = getdate(cur_end)
    prev_start = getdate(prev_start)
    prev_end = getdate(prev_end)

    if cur_start > cur_end:
        frappe.throw(frappe._("cur_start must be on or before cur_end"))
    if prev_start > prev_end:
        frappe.throw(frappe._("prev_start must be on or before prev_end"))
    if prev_end >= cur_start:
        frappe.throw(frappe._("prev_end must be before cur_start"))

    return get_cached_leadership_kpis(cur_start, cur_end, prev_start, prev_end, client, project)


@redis_cache()
def get_cached_leadership_kpis(cur_start, cur_end, prev_start, prev_end, client, project) -> dict:
    cur_revenue, prev_revenue = get_revenue(cur_start, cur_end, prev_start, prev_end, client, project)
    cur_cost, prev_cost = get_cost(cur_start, cur_end, prev_start, prev_end, client, project)

    cur_margin = (cur_revenue - cur_cost) / cur_revenue * 100 if cur_revenue else 0
    prev_margin = (prev_revenue - prev_cost) / prev_revenue * 100 if prev_revenue else 0

    return {
        "revenue": build_kpi(cur_revenue, prev_revenue),
        "cost": build_kpi(cur_cost, prev_cost),
        "profit_margin": build_kpi(cur_margin, prev_margin),
    }


def build_kpi(current: float, previous: float) -> dict:
    """Build a single KPI card payload.

    Parameters
    ----------
    current : float
            Value for the current period.
    previous : float
            Value for the comparison period.

    Returns
    -------
    dict
            Keys: current, previous, change_pct (None if previous is 0), trend.
    """
    change_pct = ((current - previous) / previous * 100) if previous else None
    return {
        "current": flt(current, 2),
        "previous": flt(previous, 2),
        "change_pct": flt(change_pct, 2) if change_pct is not None else None,
        "trend": "up" if current >= previous else "down",
    }


def get_revenue(cur_start, cur_end, prev_start, prev_end, client, project) -> tuple[float, float]:
    """Query Sales Invoice grand_total for both periods, converted to USD.

    Parameters
    ----------
    cur_start, cur_end : date
            Current period date range (inclusive).
    prev_start, prev_end : date
            Comparison period date range (inclusive).
    client : str or None
            Filter by Project.customer.
    project : str or None
            Filter by Sales Invoice.project.

    Returns
    -------
    tuple[float, float]
            (cur_revenue, prev_revenue) in USD.
    """
    SalesInvoice = DocType("Sales Invoice")
    Project = DocType("Project")

    query = (
        frappe.qb.from_(SalesInvoice)
        .join(Project)
        .on(SalesInvoice.project == Project.name)
        .select(
            Sum(Case().when(SalesInvoice.posting_date[cur_start:cur_end], SalesInvoice.grand_total).else_(0)).as_(
                "cur_revenue"
            ),
            Sum(Case().when(SalesInvoice.posting_date[prev_start:prev_end], SalesInvoice.grand_total).else_(0)).as_(
                "prev_revenue"
            ),
            SalesInvoice.currency,
            SalesInvoice.posting_date.as_("transaction_date"),
        )
        .where(SalesInvoice.posting_date[prev_start:cur_end])
        .where(SalesInvoice.docstatus == 1)
        .groupby(SalesInvoice.currency, SalesInvoice.posting_date)
    )

    if client:
        query = query.where(Project.customer == client)
    if project:
        query = query.where(SalesInvoice.project == project)

    rows = query.run(as_dict=True)
    return sum_to_usd(rows, "cur_revenue", "prev_revenue")


def get_cost(cur_start, cur_end, prev_start, prev_end, client, project) -> tuple[float, float]:
    """Query Timesheet Detail costing_amount for both periods, converted to USD.

    Parameters
    ----------
    cur_start, cur_end : date
            Current period date range (inclusive).
    prev_start, prev_end : date
            Comparison period date range (inclusive).
    client : str or None
            Filter by Project.customer.
    project : str or None
            Filter by Timesheet Detail.project.

    Returns
    -------
    tuple[float, float]
            (cur_cost, prev_cost) in USD.
    """
    TimesheetDetail = DocType("Timesheet Detail")
    Timesheet = DocType("Timesheet")
    Project = DocType("Project")

    query = (
        frappe.qb.from_(TimesheetDetail)
        .join(Timesheet)
        .on(TimesheetDetail.parent == Timesheet.name)
        .join(Project)
        .on(TimesheetDetail.project == Project.name)
        .select(
            Sum(
                Case().when(Date(TimesheetDetail.from_time)[cur_start:cur_end], TimesheetDetail.costing_amount).else_(0)
            ).as_("cur_cost"),
            Sum(
                Case()
                .when(Date(TimesheetDetail.from_time)[prev_start:prev_end], TimesheetDetail.costing_amount)
                .else_(0)
            ).as_("prev_cost"),
            Timesheet.currency,
            Date(TimesheetDetail.from_time).as_("transaction_date"),
        )
        .where(Date(TimesheetDetail.from_time)[prev_start:cur_end])
        .where(Timesheet.docstatus.isin([0, 1]))
        .groupby(Timesheet.currency, Date(TimesheetDetail.from_time))
    )

    if client:
        query = query.where(Project.customer == client)
    if project:
        query = query.where(TimesheetDetail.project == project)

    rows = query.run(as_dict=True)
    return sum_to_usd(rows, "cur_cost", "prev_cost")


@whitelist(methods=["GET"])
def get_time_utilisation(days: int = 30, role: str | None = None) -> dict:
    """Return total billable and non-billable hours logged across all timesheets in the given window.

    Parameters
    ----------
    days : int, optional
        Inclusive look-back window of calendar days ending today.
        For example, days=30 on 10 Jun covers 12 May through 10 Jun.
        Defaults to 30.
    role : str, optional
        Filter by the timesheet employee's designation. Defaults to None (all roles).

    Returns
    -------
    dict
        billable_hours : float
        non_billable_hours : float
        total_hours : float
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    if days < 1:
        frappe.throw(frappe._("days must be at least 1"))

    return _get_time_utilisation(days, role)


@redis_cache(ttl=21600)
def _get_time_utilisation(days: int, role: str | None) -> dict:
    TimesheetDetail = DocType("Timesheet Detail")
    since = add_days(today(), -(days - 1))

    query = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            TimesheetDetail.is_billable,
            Sum(TimesheetDetail.hours).as_("total_hours"),
        )
        .where(Date(TimesheetDetail.from_time) >= since)
        .where(Date(TimesheetDetail.from_time) <= today())
    )

    if role:
        Timesheet = DocType("Timesheet")
        Employee = DocType("Employee")
        query = (
            query.join(Timesheet)
            .on(TimesheetDetail.parent == Timesheet.name)
            .join(Employee)
            .on(Timesheet.employee == Employee.name)
            .where(Employee.designation == role)
        )

    rows = query.groupby(TimesheetDetail.is_billable).run(as_dict=True)

    billable = 0.0
    non_billable = 0.0
    for row in rows:
        if row.is_billable:
            billable = flt(row.total_hours)
        else:
            non_billable = flt(row.total_hours)

    return {
        "billable_hours": billable,
        "non_billable_hours": non_billable,
        "total_hours": billable + non_billable,
    }


@whitelist(methods=["GET"])
def get_forecast_breakdown(days: int = 7) -> dict:
    """Return forward-looking allocation capacity totals grouped by designation.

    Looks at active employees and their Resource Allocations over an inclusive
    window starting today. For each working day (weekends and the employee's
    holidays are skipped; leaves are not), the employee's daily working hours are
    treated as their capacity, and confirmed and tentative allocation hours are
    summed against it. Any remaining capacity is counted as unallocated. Totals
    are grouped by the employee's designation so callers can filter client-side;
    employees without a designation are excluded.

    Args:
        days: Inclusive forecast window length starting today. Must be at least 1.
            For example, days=7 on 10 Jun covers 10 Jun through 16 Jun inclusive.

    Returns:
        A dict with days, start_date, end_date, and a roles list, where each entry
        has a designation and allocated_hours (confirmed), tentative_hours, and
        unallocated_hours summed across that designation's employees and working
        days.

    Raises:
        frappe.PermissionError: If the caller lacks Projects Manager, Projects User,
            or System Manager role.
        frappe.ValidationError: If days is less than 1.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    if days < 1:
        frappe.throw(frappe._("days must be at least 1"))

    return _get_forecast_breakdown(days)


@redis_cache(ttl=21600)
def _get_forecast_breakdown(days: int) -> dict:
    start_date = getdate(today())
    end_date = start_date + timedelta(days=days - 1)
    allow_weekend_entries = cint(frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries"))
    working_dates = get_working_dates_for_range(start_date, end_date, allow_weekend_entries)

    empty_response = {
        "days": days,
        "start_date": start_date,
        "end_date": end_date,
        "roles": [],
    }

    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "designation", "custom_working_hours", "custom_work_schedule"],
    )

    if not employees or not working_dates:
        return empty_response

    default_daily_hours = flt(frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8)
    employee_names = [employee.name for employee in employees]

    holiday_list_by_employee = {}
    for employee in employees:
        holiday_list_by_employee[employee.name] = get_holiday_list_for_employee(employee.name, raise_exception=False)

    unique_holiday_lists = {holiday_list for holiday_list in holiday_list_by_employee.values() if holiday_list}
    holidays_by_list = {}
    for holiday_list in unique_holiday_lists:
        holidays_by_list[holiday_list] = frappe.get_all(
            "Holiday",
            filters={
                "parent": holiday_list,
                "holiday_date": ["between", (start_date, end_date)],
            },
            fields=["holiday_date"],
        )

    ResourceAllocation = DocType("Resource Allocation")
    allocations = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.name,
            ResourceAllocation.employee,
            ResourceAllocation.allocation_start_date,
            ResourceAllocation.allocation_end_date,
            ResourceAllocation.hours_allocated_per_day,
            ResourceAllocation.status,
        )
        .where(ResourceAllocation.employee.isin(employee_names))
        .where(ResourceAllocation.allocation_start_date <= end_date)
        .where(ResourceAllocation.allocation_end_date >= start_date)
        .where(ResourceAllocation.status.isin(["Confirmed", "Tentative"]))
        .run(as_dict=True)
    )
    allocations = attach_extra_entries(allocations)

    confirmed_by_employee = {}
    tentative_by_employee = {}
    for allocation in allocations:
        bucket = tentative_by_employee if allocation.status == "Tentative" else confirmed_by_employee
        bucket.setdefault(allocation.employee, []).append(allocation)

    # designation -> {"allocated": float, "tentative": float, "unallocated": float}
    summary = {}

    for employee in employees:
        designation = employee.designation
        if not designation:
            continue

        working_hours = flt(employee.custom_working_hours) or default_daily_hours
        daily_working_hours = working_hours / 5 if employee.custom_work_schedule == "Per Week" else working_hours
        daily_working_hours = flt(daily_working_hours)

        employee_holidays = holidays_by_list.get(holiday_list_by_employee.get(employee.name), [])
        bucket = summary.setdefault(designation, {"allocated": 0.0, "tentative": 0.0, "unallocated": 0.0})

        for date in working_dates:
            if is_holiday(date, employee_holidays):
                continue
            confirmed = get_employee_allocated_hours_for_date(confirmed_by_employee.get(employee.name, []), date)
            tentative = get_employee_allocated_hours_for_date(tentative_by_employee.get(employee.name, []), date)
            bucket["allocated"] += confirmed
            bucket["tentative"] += tentative
            bucket["unallocated"] += max(0.0, daily_working_hours - confirmed - tentative)

    roles = [
        {
            "designation": designation,
            "allocated_hours": flt(bucket["allocated"], 2),
            "tentative_hours": flt(bucket["tentative"], 2),
            "unallocated_hours": flt(bucket["unallocated"], 2),
        }
        for designation, bucket in sorted(summary.items())
    ]

    return {
        "days": days,
        "start_date": start_date,
        "end_date": end_date,
        "roles": roles,
    }


@whitelist(methods=["GET"])
def get_employees_on_leave() -> list:
    """Return direct reports of the current user who are on leave today or upcoming.

    Returns
    -------
    list of dict
        employee, employee_name, from_date, to_date,
        half_day, custom_first_halfsecond_half, user_image.
        Empty list if the user has no employee record or no direct reports.
        Ordered by from_date ascending.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    manager_employee = get_employee_from_user()
    if not manager_employee:
        return []

    return _get_employees_on_leave(manager_employee)


@redis_cache(user=True)
def _get_employees_on_leave(manager_employee: str) -> list:
    reportee_ids = frappe.get_all(
        "Employee",
        filters={"reports_to": manager_employee, "status": "Active"},
        pluck="name",
    )
    if not reportee_ids:
        return []

    LeaveApplication = DocType("Leave Application")
    Employee = DocType("Employee")
    User = DocType("User")

    return (
        frappe.qb.from_(LeaveApplication)
        .join(Employee)
        .on(Employee.name == LeaveApplication.employee)
        .left_join(User)
        .on(User.name == Employee.user_id)
        .select(
            LeaveApplication.employee,
            LeaveApplication.employee_name,
            LeaveApplication.from_date,
            LeaveApplication.to_date,
            LeaveApplication.half_day,
            LeaveApplication.custom_first_halfsecond_half,
            User.user_image,
        )
        .where(LeaveApplication.docstatus == 1)
        .where(LeaveApplication.status == "Approved")
        .where(LeaveApplication.to_date >= frappe.utils.today())
        .where(LeaveApplication.employee.isin(reportee_ids))
        .orderby(LeaveApplication.from_date)
        .run(as_dict=True)
    )


@whitelist(methods=["GET"])
def get_team_timesheets(days: int = 7) -> list:
    """Return a per-member timesheet summary for the current user's direct reports.

    For each active employee reporting to the caller, sums billable and
    non-billable hours logged in the window, computes expected hours from the
    employee's daily working norm over the working days (weekends and the
    employee's holidays excluded; leaves are not), the delta between expected and
    logged hours, and the approval status of each timesheet in the window.

    Args:
        days: Inclusive look-back window of calendar days ending today. Must be at
            least 1. For example, days=7 on 11 Jun covers 5 Jun through 11 Jun.

    Returns:
        A list of dicts, each with employee ID,
        employee_name, user_image, billable_hours, non_billable_hours,
        expected_hours, delta, and timesheet_statuses (a list of
        {name, status} for each timesheet in the window). Empty list when the
        caller has no linked Employee record or no active direct reports.

    Raises:
        frappe.PermissionError: If the caller lacks Projects Manager, Projects User,
            or System Manager role.
        frappe.ValidationError: If days is less than 1.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    if days < 1:
        frappe.throw(frappe._("days must be at least 1"))

    manager_employee = get_employee_from_user()
    if not manager_employee:
        return []

    return _get_team_timesheets(manager_employee, days)


@redis_cache(user=True, ttl=86400)
def _get_team_timesheets(manager_employee: str, days: int) -> list:
    end_date = getdate(today())
    start_date = end_date - timedelta(days=days - 1)

    employees = frappe.get_all(
        "Employee",
        filters={"reports_to": manager_employee, "status": "Active"},
        fields=["name", "employee_name", "user_id"],
    )
    if not employees:
        return []

    employee_names = [employee.name for employee in employees]
    allow_weekend_entries = cint(frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries"))
    working_dates = get_working_dates_for_range(start_date, end_date, allow_weekend_entries)
    holidays_by_employee = get_holidays_by_employee(employee_names, start_date, end_date)

    user_ids = [employee.user_id for employee in employees if employee.user_id]
    user_image_by_id = {}
    if user_ids:
        users = frappe.get_all("User", filters={"name": ["in", user_ids]}, fields=["name", "user_image"])
        for user in users:
            user_image_by_id[user.name] = user.user_image

    Timesheet = DocType("Timesheet")
    TimesheetDetail = DocType("Timesheet Detail")
    hours_rows = (
        frappe.qb.from_(TimesheetDetail)
        .join(Timesheet)
        .on(TimesheetDetail.parent == Timesheet.name)
        .select(
            Timesheet.employee,
            TimesheetDetail.is_billable,
            Sum(TimesheetDetail.hours).as_("total_hours"),
        )
        .where(Timesheet.employee.isin(employee_names))
        .where(Timesheet.start_date >= start_date)
        .where(Timesheet.start_date <= end_date)
        .where(Timesheet.docstatus.isin([0, 1]))
        .groupby(Timesheet.employee, TimesheetDetail.is_billable)
        .run(as_dict=True)
    )

    billable_by_employee = {}
    non_billable_by_employee = {}
    for row in hours_rows:
        if row.is_billable:
            billable_by_employee[row.employee] = flt(row.total_hours)
        else:
            non_billable_by_employee[row.employee] = flt(row.total_hours)

    statuses_by_employee = {}
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_names],
            "start_date": ["between", (start_date, end_date)],
            "docstatus": ["in", [0, 1]],
        },
        fields=["name", "employee", "custom_approval_status"],
    )
    for timesheet in timesheets:
        if timesheet.employee not in statuses_by_employee:
            statuses_by_employee[timesheet.employee] = []
        statuses_by_employee[timesheet.employee].append(
            {"name": timesheet.name, "status": timesheet.custom_approval_status}
        )

    members = []
    for employee in employees:
        daily_norm = flt(get_employee_daily_working_norm(employee.name))
        employee_holidays = holidays_by_employee.get(employee.name, set())
        expected_days = 0
        for date in working_dates:
            if date in employee_holidays:
                continue
            expected_days += 1
        expected_hours = flt(daily_norm * expected_days, 2)
        billable = flt(billable_by_employee.get(employee.name, 0.0), 2)
        non_billable = flt(non_billable_by_employee.get(employee.name, 0.0), 2)

        members.append(
            {
                "employee": employee.name,
                "employee_name": employee.employee_name,
                "user_image": user_image_by_id.get(employee.user_id),
                "billable_hours": billable,
                "non_billable_hours": non_billable,
                "expected_hours": expected_hours,
                "delta": flt(expected_hours - billable - non_billable, 2),
                "timesheet_statuses": statuses_by_employee.get(employee.name, []),
            }
        )

    return members


@whitelist(methods=["GET"])
def get_allocation_heatmap(
    from_date: str,
    to_date: str,
    business_unit: str | list | None = None,
) -> dict:
    """Return weekly allocation-vs-capacity summaries grouped by designation.

    Buckets the date range into calendar weeks (Monday-Sunday) and, for every
    designation among active employees, reports each week's total working
    capacity and confirmed allocated hours. The frontend uses the
    allocated/capacity ratio per cell to colour the heatmap and groups weeks
    into months for column headers.

    Capacity for an employee on a working day is their daily working hours
    (custom_working_hours, divided by 5 when custom_work_schedule is "Per Week",
    falling back to HR Settings standard_working_hours). Weekends count only when
    Allow Weekend Entries is enabled in Timesheet Settings; the employee's
    holidays are always excluded. Allocated hours come from Confirmed Resource
    Allocations and respect per-day overrides and cancellations.

    Args:
        from_date: Inclusive range start (YYYY-MM-DD). Expanded to the Monday of
            its calendar week in the response.
        to_date: Inclusive range end (YYYY-MM-DD). Expanded to the Sunday of
            its calendar week in the response.
        business_unit: Optional business unit filter as a list or a JSON-encoded
            list of Business Unit names. Ignored when the Employee doctype has
            no custom_business_unit field.

    Returns:
        A dict with from_date, to_date, weeks (the ordered list of
        {week_start, week_end} column buckets) and roles. Each role has a
        designation and a weeks list aligned with the top-level weeks, where each
        entry adds capacity_hours and allocated_hours.

    Raises:
        frappe.PermissionError: If the caller lacks Projects Manager, Projects
            User, or System Manager role.
        frappe.ValidationError: If from_date is after to_date.
    """
    only_for(["Projects Manager", "Projects User", "System Manager"], message=True)

    start_date = getdate(from_date)
    end_date = getdate(to_date)
    if start_date > end_date:
        frappe.throw(frappe._("from_date must be on or before to_date"))

    if isinstance(business_unit, str):
        business_unit = json.loads(business_unit)
    business_units = tuple(business_unit) if business_unit else None

    range_start = start_date - timedelta(days=start_date.weekday())
    range_end = end_date + timedelta(days=6 - end_date.weekday())

    return _get_allocation_heatmap(range_start, range_end, business_units)


@redis_cache(ttl=86400)
def _get_allocation_heatmap(start_date, end_date, business_units: tuple | None) -> dict:
    week_starts = []
    week = start_date
    while week + timedelta(days=6) <= end_date:
        week_starts.append(week)
        week += timedelta(days=7)

    weeks = [{"week_start": ws, "week_end": ws + timedelta(days=6)} for ws in week_starts]
    empty_response = {
        "from_date": start_date,
        "to_date": end_date,
        "weeks": weeks,
        "roles": [],
    }

    allow_weekend_entries = cint(frappe.db.get_single_value("Timesheet Settings", "allow_weekend_entries"))
    working_dates = sorted(get_working_dates_for_range(start_date, end_date, allow_weekend_entries))
    if not working_dates:
        return empty_response

    employee_filters = {"status": "Active"}
    if business_units and frappe.get_meta("Employee").has_field("custom_business_unit"):
        employee_filters["custom_business_unit"] = ["in", list(business_units)]

    employees = frappe.get_all(
        "Employee",
        filters=employee_filters,
        fields=["name", "designation", "custom_working_hours", "custom_work_schedule"],
    )
    if not employees:
        return empty_response

    default_daily_hours = flt(frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8)
    employee_names = [employee.name for employee in employees]
    holidays_by_employee = get_holidays_by_employee(employee_names, start_date, end_date)

    ResourceAllocation = DocType("Resource Allocation")
    allocations = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.name,
            ResourceAllocation.employee,
            ResourceAllocation.allocation_start_date,
            ResourceAllocation.allocation_end_date,
            ResourceAllocation.hours_allocated_per_day,
            ResourceAllocation.status,
        )
        .where(ResourceAllocation.employee.isin(employee_names))
        .where(ResourceAllocation.allocation_start_date <= end_date)
        .where(ResourceAllocation.allocation_end_date >= start_date)
        .where(ResourceAllocation.status == "Confirmed")
        .run(as_dict=True)
    )
    allocations = attach_extra_entries(allocations)

    allocations_by_employee = {}
    for allocation in allocations:
        if allocation.employee not in allocations_by_employee:
            allocations_by_employee[allocation.employee] = []
        allocations_by_employee[allocation.employee].append(allocation)

    # designation -> week_start -> {"capacity": float, "allocated": float}
    summary = {}
    for employee in employees:
        designation = employee.designation
        if not designation:
            continue
        working_hours = flt(employee.custom_working_hours) or default_daily_hours
        daily_working_hours = working_hours / 5 if employee.custom_work_schedule == "Per Week" else working_hours
        daily_working_hours = flt(daily_working_hours)
        employee_holidays = holidays_by_employee.get(employee.name, set())
        employee_allocations = allocations_by_employee.get(employee.name, [])

        if designation not in summary:
            summary[designation] = {}
        for date in working_dates:
            if date in employee_holidays:
                continue
            week_start = date - timedelta(days=date.weekday())
            if week_start not in summary[designation]:
                summary[designation][week_start] = {"capacity": 0.0, "allocated": 0.0}
            bucket = summary[designation][week_start]
            bucket["capacity"] += daily_working_hours
            bucket["allocated"] += get_employee_allocated_hours_for_date(employee_allocations, date)

    roles = []
    for designation in sorted(summary):
        role_weeks = []
        for ws in week_starts:
            bucket = summary[designation].get(ws, {"capacity": 0.0, "allocated": 0.0})
            role_weeks.append(
                {
                    "week_start": ws,
                    "week_end": ws + timedelta(days=6),
                    "capacity_hours": flt(bucket["capacity"], 2),
                    "allocated_hours": flt(bucket["allocated"], 2),
                }
            )
        roles.append({"designation": designation, "weeks": role_weeks})

    return {
        "from_date": start_date,
        "to_date": end_date,
        "weeks": weeks,
        "roles": roles,
    }


@whitelist(methods=["GET"])
@error_logger
def get_calendar_timeline_items(
    from_date: str,
    to_date: str,
    project: str | None = None,
) -> dict:
    """Return Project Timeline Items for the dashboard calendar view.

    Items are scoped to the projects the current session.user is allowed to
    read. Access is enforced through frappe.get_list on Project, which applies
    the caller's User Permissions; only items belonging to those projects are
    returned.

        item.start_date < to_date AND item.planned_end_date > from_date

    Args:
        from_date: Lower bound of the overlap window (YYYY-MM-DD).
        to_date: Upper bound of the overlap window (YYYY-MM-DD).
        project: Optional single-project filter. When omitted, items for every
            accessible project are returned. An inaccessible project yields an
            empty result rather than an error.

    Returns:
        {"data": [...]} — a flat list of enriched timeline items (calendar mode,
        i.e. without owner images or watchers). Empty when the user can access no
        matching project.

    Raises:
        frappe.PermissionError: If the caller lacks an allowed role.
        frappe.ValidationError: If from_date or to_date is missing, or from_date is
            after to_date.
    """
    only_for(["Projects Manager", "Projects User", "Timesheet Manager"], message=True)

    if not from_date or not to_date:
        frappe.throw(frappe._("from_date and to_date are required"))

    range_start = getdate(from_date)
    range_end = getdate(to_date)
    if range_start > range_end:
        frappe.throw(frappe._("from_date must be on or before to_date"))

    return _get_calendar_timeline_items(range_start, range_end, project)


@redis_cache(user=True, ttl=21600)
def _get_calendar_timeline_items(range_start, range_end, project: str | None) -> dict:
    # User Permissions are applied by get_list — this is the access boundary.
    project_filters = [["name", "=", project]] if project else None
    accessible_projects = frappe.get_list(
        "Project",
        filters=project_filters,
        fields=["name", "project_name"],
        limit_page_length=0,
    )
    if not accessible_projects:
        return {"data": []}

    project_name_map = {p.name: p.project_name for p in accessible_projects}

    PTI = frappe.qb.DocType("Project Timeline Item")
    items = (
        frappe.qb.from_(PTI)
        .select(*[PTI[field] for field in TIMELINE_ITEM_FIELDS])
        .where(PTI.project.isin(list(project_name_map)))
        .where((PTI.start_date < range_end) & (PTI.planned_end_date > range_start))
        .orderby(PTI.start_date)
        .orderby(PTI.planned_end_date)
        .run(as_dict=True)
    )

    data = []
    for item in items:
        enriched = enrich_timeline_item(item, {}, {})
        enriched["project_name"] = project_name_map.get(item.get("project"))
        data.append(enriched)

    return {"data": data}
