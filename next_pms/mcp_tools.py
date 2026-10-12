"""
Read-only tools for the rtCamp MCP server (the rtcamp_mcp app), listed in hooks.py under
rtcamp_mcp_tools. rtcamp_mcp builds each tool's description and arguments from its docstring and
runs it as the user who connects, so these check access the way Next PMS's own views do.
"""

import datetime
from collections import defaultdict

import frappe
from frappe import _
from frappe.desk.query_report import run as run_report
from frappe.utils import add_days, flt, getdate, now_datetime, today

from next_pms.api.utils import get_employee_allocated_hours_for_date
from next_pms.next_projects.api.constant import ALLOWED_ROLES
from next_pms.next_projects.api.project import get_project_tracking
from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check
from next_pms.resource_management.api.utils.leave_sync import allocation_dates, availability_factor, get_leave_calendar
from next_pms.resource_management.api.utils.query import (
    attach_extra_entries,
    get_allocation_list_for_employee_for_given_range,
)
from next_pms.timesheet.api.employee import apply_working_hours_fallback, get_employee_from_user
from next_pms.timesheet.api.task import get_project_names
from next_pms.timesheet.api.timesheet import get_timesheet

MAX_TIMESHEET_ROWS = 50_000
MAX_EMPLOYEES = 200
MAX_GROUPS = 500
MAX_DAYS = 366
TIMESHEET_OVERVIEW = "Timesheet Overview"
OPEN_TASK_STATUSES = ("Completed", "Cancelled", "Template")
TIMESHEET_GROUPS = ("project", "employee", "task", "date", "month")
PROJECT_FIELDS = (
    "project_name",
    "status",
    "is_active",
    "percent_complete",
    "priority",
    "customer",
    "department",
    "expected_start_date",
    "expected_end_date",
    "actual_start_date",
    "actual_end_date",
    "custom_project_rag_status",
    "custom_project_phase",
    "custom_billing_type",
    "custom_business_unit",
    "custom_project_manager_name",
    "custom_engineering_manager_name",
    "custom_next_milestone",
    "custom_target_hours",
    "custom_total_hours_purchased",
    "custom_total_hours_remaining",
    "custom_currency",
    "estimated_costing",
    "total_costing_amount",
    "total_billable_amount",
    "total_billed_amount",
    "gross_margin",
    "per_gross_margin",
)


def timesheet_summary(
    from_date: str,
    to_date: str,
    employee: str | None = None,
    project: str | None = None,
    group_by: str = "project",
    limit: int = 50,
) -> dict:
    """Total logged timesheet hours for a period, grouped by project, employee, task, date or month.

    The hours come from Next PMS: the user's own from their timesheet entries, as their Timesheet
    page shows them, and anyone else's from the Timesheet Overview report, for users who may run
    it. Draft and submitted timesheets count. For day-by-day detail, run the Next PMS reports
    "Timesheet Overview" or "Employee Billable Hour" with run_report.

    Args:
        from_date: Start date, "YYYY-MM-DD".
        to_date: End date, "YYYY-MM-DD".
        employee: Only this employee. Leave empty for everyone, or, for a user who may not run the
            Timesheet Overview report, their own hours.
        project: Only this project, e.g. "PROJ-0344".
        group_by: "project", "employee", "task", "date" or "month". Employees and tasks are
            grouped by name.
        limit: Maximum number of groups to return, largest first (at most 500).
    """
    if group_by not in TIMESHEET_GROUPS:
        frappe.throw(_("group_by must be one of: {0}").format(", ".join(TIMESHEET_GROUPS)))
    limit = max(1, min(limit, MAX_GROUPS))
    start, end = _date_range(from_date, to_date)

    own_employee = get_employee_from_user()
    if own_employee and (
        employee == own_employee
        or (not employee and not frappe.get_cached_doc("Report", TIMESHEET_OVERVIEW).is_permitted())
    ):
        rows = _own_timesheet_rows(own_employee, start, end, project)
    else:
        rows = _timesheet_overview_rows(start, end, employee, project)

    groups = defaultdict(lambda: {"hours": 0.0, "billable_hours": 0.0, "entries": 0})
    for row in rows:
        group = groups[_timesheet_group_key(row, group_by)]
        group["hours"] += flt(row.get("billable_hours")) + flt(row.get("non_billable_hours"))
        group["billable_hours"] += flt(row.get("billable_hours"))
        group["entries"] += 1

    labels = get_project_names([key for key in groups if key]) if group_by == "project" else {}
    ordered = sorted(groups.items(), key=lambda item: item[0] if group_by in ("date", "month") else -item[1]["hours"])
    result_groups = []
    for key, values in ordered[:limit]:
        entry = {group_by: key or _("(none)"), **({"label": labels[key]} if key in labels else {})}
        entry |= {
            "hours": round(values["hours"], 2),
            "billable_hours": round(values["billable_hours"], 2),
            "entries": values["entries"],
        }
        result_groups.append(entry)

    return {
        "from_date": str(start),
        "to_date": str(end),
        "group_by": group_by,
        "total_hours": round(sum(v["hours"] for v in groups.values()), 2),
        "total_billable_hours": round(sum(v["billable_hours"] for v in groups.values()), 2),
        "groups": result_groups,
        "has_more": len(ordered) > limit,
    }


def capacity(
    from_date: str,
    to_date: str,
    employee: str | None = None,
    business_unit: str | None = None,
    limit: int = 50,
) -> dict:
    """Capacity, bookings and logged hours for an employee or a business unit over a period.

    Computed with Next PMS's resource-management rules, so the numbers match its Resource
    Management views. Capacity is each weekday's working hours, reduced for public holidays and
    leave (approved or still open, half days included). Booked hours are Resource Allocations,
    with their per-day overrides. Logged and billable hours come from timesheets. Utilisation is
    logged / capacity; spare is capacity minus confirmed bookings.

    Args:
        from_date: Start date, "YYYY-MM-DD".
        to_date: End date, "YYYY-MM-DD".
        employee: One employee, e.g. "EMP-00397".
        business_unit: All active employees of this business unit, e.g. "Jupiter".
            With neither, the current user's own employee record is used.
        limit: Maximum number of employees (at most 200).
    """
    resource_api_permissions_check()
    start, end = _date_range(from_date, to_date)
    limit = max(1, min(limit, MAX_EMPLOYEES))
    employees = _capacity_employees(employee, business_unit, limit)
    apply_working_hours_fallback(employees)
    names = [e.name for e in employees]

    notes = [_("Leave includes applications that are still open, as in Next PMS.")]
    if "custom_working_hours" not in frappe.get_meta("Employee").get_permitted_fieldnames(permission_type=None):
        notes.append(_("Working hours use the HR Settings default: you may not see employees' own working hours."))
    booked, bookings_known = _booked_hours_by_employee(names, start, end)
    if not bookings_known:
        notes.append(_("Booked hours are hidden: you may not read Resource Allocations."))
    logged, billable_known = _logged_hours_by_employee(names, start, end)
    if not billable_known:
        notes.append(_("Billable hours are hidden: you may not see the billable flag on timesheets."))

    rows, totals = [], defaultdict(float)
    for emp in employees:
        daily = _daily_hours(emp)
        working_days, leave_days, capacity_hours = 0, 0.0, 0.0
        first, last = _employment_dates(emp, start, end)
        if first <= last:
            leaves, holidays = get_leave_calendar(emp.name, first, last)
            holiday_dates = {getdate(h.holiday_date) for h in holidays}
            for day in allocation_dates(first, last, include_weekends=False):
                if day in holiday_dates:
                    continue
                available = availability_factor(day, leaves, holidays)
                working_days += 1
                leave_days += 1 - available
                capacity_hours += daily * available

        bookings = booked.get(emp.name, {})
        hours = logged.get(emp.name, {})
        row = {
            "employee": emp.name,
            "employee_name": emp.get("employee_name"),
            "business_unit": emp.get("custom_business_unit"),
            "daily_hours": daily,
            "working_days": working_days,
            "leave_days": round(leave_days, 2),
            "capacity_hours": round(capacity_hours, 2),
            "logged_hours": round(hours.get("hours", 0.0), 2),
            "utilisation_percent": _percent(hours.get("hours", 0.0), capacity_hours),
        }
        if bookings_known:
            row["booked_hours"] = round(bookings.get("confirmed", 0.0), 2)
            row["tentative_hours"] = round(bookings.get("tentative", 0.0), 2)
            row["spare_hours"] = round(capacity_hours - bookings.get("confirmed", 0.0), 2)
        if billable_known:
            row["billable_hours"] = round(hours.get("billable", 0.0), 2)
            row["billable_percent"] = _percent(hours.get("billable", 0.0), capacity_hours)
        rows.append(row)
        for key in (
            "capacity_hours",
            "booked_hours",
            "tentative_hours",
            "logged_hours",
            "spare_hours",
            "billable_hours",
        ):
            if key in row:
                totals[key] += row[key]

    summary = {k: round(v, 2) for k, v in totals.items()}
    summary["head_count"] = len(rows)
    summary["utilisation_percent"] = _percent(totals["logged_hours"], totals["capacity_hours"])
    if billable_known:
        summary["billable_percent"] = _percent(totals["billable_hours"], totals["capacity_hours"])
    return {"from_date": str(start), "to_date": str(end), "totals": summary, "employees": rows, "notes": notes}


def project_health(project: str) -> dict:
    """Summarise a project's health: status, schedule, tasks, overdue work, hours and budget.

    Budget, billing and profit figures come from Next PMS project tracking (the same numbers as
    its project page) for users with the roles it requires. Only fields the user can read are
    included, and a list of warning signals is derived from them.

    Args:
        project: Project ID, e.g. "PROJ-0344".
    """
    doc = frappe.get_doc("Project", project)
    doc.check_permission("read")
    doc.apply_fieldlevel_read_permissions()
    data = doc.as_dict()
    summary = {field: data[field] for field in PROJECT_FIELDS if data.get(field) not in (None, "")}

    tasks = frappe.get_list(
        "Task",
        filters={"project": project},
        fields=["status", {"COUNT": "*", "as": "count"}],
        group_by="status",
        order_by="count desc",
    )
    overdue_filters = [
        ["project", "=", project],
        ["status", "not in", OPEN_TASK_STATUSES],
        # "is set" first: the query engine treats an empty date as the earliest date otherwise.
        ["exp_end_date", "is", "set"],
        ["exp_end_date", "<", now_datetime()],
    ]
    overdue_count = frappe.get_list("Task", filters=overdue_filters, fields=[{"COUNT": "*", "as": "count"}])[0]["count"]
    overdue = frappe.get_list(
        "Task",
        filters=overdue_filters,
        fields=["name", "subject", "status", "exp_end_date"],
        order_by="exp_end_date asc",
        limit=5,
    )

    hours = _project_hours(project)
    tracking, tracking_note = _project_tracking(project)
    result = {
        "project": project,
        "summary": summary,
        "tasks_by_status": {t.status: t.count for t in tasks},
        "overdue_tasks": {"count": overdue_count, "oldest": overdue},
        "hours": hours,
        "signals": _project_signals(summary, overdue_count, hours, tracking),
    }
    if tracking is not None:
        result["tracking"] = tracking
    if tracking_note:
        result["notes"] = [tracking_note]
    return result


def _date_range(from_date: str, to_date: str) -> tuple[datetime.date, datetime.date]:
    start, end = getdate(from_date), getdate(to_date)
    if start > end:
        frappe.throw(_("from_date must not be after to_date"))
    if (end - start).days > MAX_DAYS:
        frappe.throw(_("The period can be at most {0} days").format(MAX_DAYS))
    return start, end


def _timesheet_rows(filters: list) -> list[dict]:
    rows = frappe.get_list(
        "Timesheet",
        filters=filters,
        fields=[
            "name",
            "employee",
            "start_date",
            "time_logs.project",
            "time_logs.task",
            "time_logs.hours",
            "time_logs.is_billable",
        ],
        order_by=None,
        limit=MAX_TIMESHEET_ROWS + 1,
    )
    if len(rows) > MAX_TIMESHEET_ROWS:
        frappe.throw(
            _("More than {0} timesheet entries match; narrow the period or filters").format(MAX_TIMESHEET_ROWS)
        )
    return rows


def _timesheet_overview_rows(
    start: datetime.date, end: datetime.date, employee: str | None, project: str | None
) -> list[dict]:
    """The Timesheet Overview report's rows, run as the desk runs it: with the report's roles,
    the check that the user may read the employee and project filtered on, and their user
    permissions applied to the rows."""
    filters = {"from_date": str(start), "to_date": str(end)}
    if employee:
        filters["employee"] = employee
    if project:
        filters["project"] = project
    report = run_report(
        TIMESHEET_OVERVIEW,
        filters=filters,
        js_filters=[
            {"fieldname": "employee", "fieldtype": "Link", "options": "Employee"},
            {"fieldname": "project", "fieldtype": "Link", "options": "Project"},
        ],
    )
    rows = report["result"]
    return rows[:-1] if report.get("add_total_row") and rows else rows


def _own_timesheet_rows(employee: str, start: datetime.date, end: datetime.date, project: str | None) -> list[dict]:
    """The employee's time entries from get_timesheet, in the shape of the Timesheet Overview's rows."""
    dates = [str(add_days(start, day)) for day in range((end - start).days + 1)]
    tasks, _total_hours = get_timesheet(dates, employee)
    employee_name = frappe.db.get_value("Employee", employee, "employee_name")
    return [
        {
            "from_date": getdate(entry.get("from_time")),
            "employee_name": employee_name,
            "project": entry.get("project"),
            "task_subject": task.get("subject"),
            "billable_hours": flt(entry.get("hours")) if entry.get("is_billable") else 0,
            "non_billable_hours": 0 if entry.get("is_billable") else flt(entry.get("hours")),
        }
        for task in tasks.values()
        for entry in task.get("data", [])
        if not project or entry.get("project") == project
    ]


def _timesheet_group_key(row: dict, group_by: str) -> str | None:
    if group_by == "date":
        return str(row.get("from_date"))
    if group_by == "month":
        return str(row.get("from_date"))[:7]
    return row.get({"employee": "employee_name", "task": "task_subject"}.get(group_by, group_by))


def _capacity_employees(employee: str | None, business_unit: str | None, limit: int) -> list:
    meta = frappe.get_meta("Employee")
    wanted = (
        "name",
        "employee_name",
        "company",
        "holiday_list",
        "date_of_joining",
        "relieving_date",
        "custom_business_unit",
        "custom_work_schedule",
        "custom_working_hours",
    )
    fields = [f for f in wanted if f == "name" or meta.has_field(f)]

    if employee:
        filters = {"name": employee}
    elif business_unit:
        if not meta.has_field("custom_business_unit"):
            frappe.throw(_("Employees have no business unit field on this site"))
        filters = {"custom_business_unit": business_unit, "status": "Active"}
    else:
        filters = {"name": get_employee_from_user(throw_exception=True)}

    employees = frappe.get_list("Employee", filters=filters, fields=fields, order_by="employee_name asc", limit=limit)
    if not employees:
        frappe.throw(_("No employees found that you can read for these filters"), frappe.DoesNotExistError)
    return employees


def _daily_hours(emp) -> float:
    """Working hours are per day unless the schedule is per week (of 5 days)."""
    hours = flt(emp.get("custom_working_hours"))
    return round(hours if emp.get("custom_work_schedule") == "Per Day" else hours / 5, 2)


def _employment_dates(emp, start: datetime.date, end: datetime.date) -> tuple[datetime.date, datetime.date]:
    first = max(start, getdate(emp.date_of_joining)) if emp.get("date_of_joining") else start
    last = min(end, getdate(emp.relieving_date)) if emp.get("relieving_date") else end
    return first, last


def _booked_hours_by_employee(names, start, end) -> tuple[dict, bool]:
    """Resource Allocation hours per employee, confirmed and tentative, with per-day overrides."""
    if not frappe.has_permission("Resource Allocation", "select"):
        return {}, False

    allocations = attach_extra_entries(
        get_allocation_list_for_employee_for_given_range(
            [
                "name",
                "employee",
                "allocation_start_date",
                "allocation_end_date",
                "hours_allocated_per_day",
                "include_weekends",
                "status",
            ],
            "employee",
            names,
            start,
            end,
        )
    )
    hours = defaultdict(lambda: {"confirmed": 0.0, "tentative": 0.0})
    for allocation in allocations:
        status = "tentative" if allocation.status == "Tentative" else "confirmed"
        first = max(start, getdate(allocation.allocation_start_date))
        last = min(end, getdate(allocation.allocation_end_date))
        for day in allocation_dates(first, last, allocation.include_weekends):
            hours[allocation.employee][status] += flt(get_employee_allocated_hours_for_date([allocation], day))
    return hours, True


def _logged_hours_by_employee(names, start, end) -> tuple[dict, bool]:
    rows = _timesheet_rows(
        [["employee", "in", names], ["start_date", "between", [str(start), str(end)]], ["docstatus", "<", 2]]
    )
    billable_known = any("is_billable" in row for row in rows) or not rows
    hours = defaultdict(lambda: {"hours": 0.0, "billable": 0.0})
    for row in rows:
        hours[row.employee]["hours"] += flt(row.hours)
        if row.get("is_billable"):
            hours[row.employee]["billable"] += flt(row.hours)
    return hours, billable_known


def _project_hours(project: str) -> dict:
    """Logged hours on the project, all time and in the last 30 days, via permission-aware queries."""

    def total(extra_filters=None) -> float:
        rows = frappe.get_list(
            "Timesheet Detail",
            parent_doctype="Timesheet",
            filters=[["project", "=", project], ["docstatus", "<", 2], *(extra_filters or [])],
            fields=[{"SUM": "hours", "as": "hours"}],
        )
        return round(flt(rows[0].hours if rows else 0), 2)

    since = add_days(today(), -30)
    hours = {"total": total(), "last_30_days": total([["from_time", ">=", since]])}
    try:
        billable = frappe.get_list(
            "Timesheet Detail",
            parent_doctype="Timesheet",
            filters=[["project", "=", project], ["docstatus", "<", 2], ["is_billable", "=", 1]],
            fields=[{"SUM": "hours", "as": "hours"}],
        )
        hours["billable"] = round(flt(billable[0].hours if billable else 0), 2)
    except frappe.PermissionError:
        frappe.clear_last_message()
    return hours


def _project_tracking(project: str) -> tuple[dict | None, str | None]:
    """Next PMS's tracking figures for the project, or a note on why they are left out."""
    if frappe.session.user != "Administrator" and not set(ALLOWED_ROLES) & set(frappe.get_roles()):
        return None, _("Budget, billing and profit figures need one of these roles: {0}").format(
            ", ".join(ALLOWED_ROLES)
        )

    tracking = get_project_tracking(project=project)
    for rate in tracking.get("project_rates") or []:
        rate.pop("image", None)
    return tracking, None


def _project_signals(summary: dict, overdue_count: int, hours: dict, tracking: dict | None = None) -> list[str]:
    signals = []
    status = summary.get("status")
    rag = summary.get("custom_project_rag_status")
    if rag in ("Red", "Amber"):
        signals.append(_("RAG status is {0}").format(rag))

    expected_end = summary.get("expected_end_date")
    if expected_end and getdate(expected_end) < getdate(today()) and status not in ("Completed", "Cancelled"):
        signals.append(_("Past its expected end date ({0}) but still {1}").format(expected_end, status))

    if overdue_count:
        signals.append(_("{0} overdue task(s)").format(overdue_count))

    expected_start = summary.get("expected_start_date")
    if expected_start and expected_end and status == "Open":
        span = (getdate(expected_end) - getdate(expected_start)).days
        elapsed = (getdate(today()) - getdate(expected_start)).days
        if span > 0 and 0 < elapsed < span:
            elapsed_percent = elapsed * 100 / span
            done = flt(summary.get("percent_complete"))
            if done + 20 < elapsed_percent:
                signals.append(
                    _("{0}% complete with {1}% of the planned time gone").format(round(done), round(elapsed_percent))
                )

    purchased = flt(summary.get("custom_total_hours_purchased"))
    if purchased and hours.get("total", 0) > purchased:
        signals.append(_("Logged {0} h, more than the {1} h purchased").format(hours["total"], purchased))
    target = flt(summary.get("custom_target_hours"))
    if target and hours.get("total", 0) > target:
        signals.append(_("Logged {0} h, more than the {1} h target").format(hours["total"], target))

    if tracking:
        burn = tracking.get("budget_burn") or {}
        if flt(burn.get("total_budget")) and flt(burn.get("actual")) > flt(burn.get("total_budget")):
            signals.append(_("Billed {0} against a budget of {1}").format(burn["actual"], burn["total_budget"]))
        for key, label in (("projected_profit_margin", _("Projected")), ("current_profit_margin", _("Current"))):
            margin = tracking.get(key)
            if margin is not None and margin < 0:
                signals.append(_("{0} profit margin is negative ({1}%)").format(label, round(flt(margin), 1)))
    return signals


def _percent(part: float, whole: float) -> float | None:
    return round(part * 100 / whole, 1) if whole else None
