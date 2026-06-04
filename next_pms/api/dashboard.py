# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe import only_for, whitelist
from frappe.core.doctype.recorder.recorder import redis_cache
from frappe.query_builder import DocType
from frappe.query_builder.functions import Sum
from frappe.utils import flt, getdate
from pypika import Case
from pypika.functions import Date

CURRENCY = "USD"
ALLOWED_ROLES = ["Projects Manager", "Projects User"]


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

    from next_pms.timesheet.api.employee import get_employee_from_user

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
    return _sum_to_usd(rows, "cur_revenue", "prev_revenue")


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
    return _sum_to_usd(rows, "cur_cost", "prev_cost")


def _sum_to_usd(rows: list, cur_key: str, prev_key: str) -> tuple[float, float]:
    """Convert per-currency query rows to a single USD total for each period.

    Parameters
    ----------
    rows : list of dict
            Query result rows, each with currency, transaction_date, cur_key, prev_key fields.
    cur_key : str
            Field name for the current period amount.
    prev_key : str
            Field name for the previous period amount.

    Returns
    -------
    tuple[float, float]
            (current_usd, previous_usd)
    """
    current = 0.0
    previous = 0.0
    for row in rows:
        rate = 1.0
        if row.currency != CURRENCY:
            rate = get_exchange_rate(row.currency, CURRENCY, row.transaction_date) or 1
        current += flt(row[cur_key]) * rate
        previous += flt(row[prev_key]) * rate
    return current, previous
