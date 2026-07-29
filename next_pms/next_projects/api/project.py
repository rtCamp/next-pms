# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import json
from datetime import date
from typing import Literal

import frappe
from frappe import get_list, only_for, whitelist
from frappe.query_builder.functions import Coalesce, Count, Sum
from frappe.utils import cint, flt, getdate, today

from next_pms.api.utils import error_logger
from next_pms.next_projects.api.constant import (
    ALLOWED_ROLES,
    COMPUTED_SORT_FIELDS,
    KANBAN_VIEW_FIELDS,
    LIST_VIEW_FIELDS,
    SORT_KEY_FIELDS,
    TASK_TRACKING_COMPLETED_STATUS,
    TASK_TRACKING_OPEN_STATUSES,
    TASK_TRACKING_TOTAL_STATUSES,
)
from next_pms.next_projects.api.utils import build_person_data, get_employee_image_map, get_user_image_map
from next_pms.timesheet.api import get_count
from next_pms.utils.employee import (
    get_employee_salary,
)


# Calculated field helpers
def get_total_budget(project: dict) -> float:
    """
    For billable projects: use total_sales_amount (from Sales Orders)
    For non-billable: use estimated_costing
    """
    billing_type = project.get("custom_billing_type")
    if billing_type and billing_type != "Non-Billable":
        return flt(project.get("total_sales_amount"))
    return flt(project.get("estimated_costing"))


def get_budget_burn_accrued(project: dict) -> float:
    """
    Amount burnt against the budget, as shown by the Budget Burn bar.

    Paired with get_total_budget: for billable projects the budget is revenue
    (total_sales_amount), so what burns it is billed work (total_billable_amount).
    For non-billable there is no billing, so cost (total_costing_amount) burns the
    estimated_costing budget.

    Distinct from cost incurred, which is always total_costing_amount.
    """
    billing_type = project.get("custom_billing_type")
    if billing_type and billing_type != "Non-Billable":
        return flt(project.get("total_billable_amount"))
    return flt(project.get("total_costing_amount"))


def _allocated_day_count(start: date, end: date, include_weekends: bool) -> int:
    """Number of days an allocation charges for between start and end, both inclusive.

    Weekends only count when the allocation includes them.
    """
    if end < start:
        return 0

    total = (end - start).days + 1
    if include_weekends:
        return total

    full_weeks, remainder = divmod(total, 7)
    first_weekday = start.weekday()
    return full_weeks * 5 + sum(1 for offset in range(remainder) if (first_weekday + offset) % 7 < 5)


def _chargeable_hours(
    start: date,
    end: date,
    include_weekends: bool,
    hours_per_day: float,
    overrides: dict[date, float],
) -> float:
    """Hours an allocation charges for between start and end, both inclusive.

    Every chargeable day contributes hours_per_day, and a day override replaces that
    default for its own date. An override counts even on a day the allocation would
    otherwise skip: a per-day entry is a deliberate instruction, so it outranks the
    weekday rule.

    Applied as deltas off the day count rather than by walking the range, so the cost
    is proportional to the number of overrides, not to the length of the allocation.
    """
    if end < start:
        return 0.0

    hours = _allocated_day_count(start, end, include_weekends) * hours_per_day
    for override_date, override_hours in overrides.items():
        if start <= override_date <= end:
            if include_weekends or override_date.weekday() < 5:
                hours -= hours_per_day
            hours += override_hours

    return hours


def _remaining_cost_ratio(
    start: date,
    end: date,
    include_weekends: bool,
    hours_per_day: float,
    overrides: dict[date, float],
    as_on: date,
) -> float:
    """Fraction of an allocation's total_cost that still lies on or after as_on.

    Split by chargeable hours rather than by days, so a shortened or cancelled day
    moves cost across the today boundary in proportion to the hours it changes.
    """
    if as_on <= start:
        return 1.0
    if as_on > end:
        return 0.0

    if not _allocated_day_count(start, end, include_weekends):
        # No chargeable day in the range at all (a weekday allocation sitting on a
        # weekend): the hour model cannot split it, so fall back to calendar days
        # rather than dropping a non-zero total_cost.
        return ((end - as_on).days + 1) / ((end - start).days + 1)

    total_hours = _chargeable_hours(start, end, include_weekends, hours_per_day, overrides)
    if total_hours <= 0:
        # Overrides cancelled out every day: nothing is left to spend.
        return 0.0

    return _chargeable_hours(as_on, end, include_weekends, hours_per_day, overrides) / total_hours


def _get_day_overrides(allocation_names: list[str]) -> dict[str, dict[date, float]]:
    """Per-day override hours for the given allocations, keyed by allocation then date.

    A cancelled day is read as zero hours regardless of what its hours column holds.
    """
    if not allocation_names:
        return {}

    ExtraEntry = frappe.qb.DocType("Resource Allocation Extra Entry")
    rows = (
        frappe.qb.from_(ExtraEntry)
        .select(ExtraEntry.parent, ExtraEntry.date, ExtraEntry.hours, ExtraEntry.cancelled)
        .where(ExtraEntry.parenttype == "Resource Allocation")
        .where(ExtraEntry.parent.isin(allocation_names))
        .run(as_dict=True)
    )

    overrides: dict[str, dict[date, float]] = {}
    for row in rows:
        overrides.setdefault(row.parent, {})[getdate(row.date)] = 0.0 if cint(row.cancelled) else flt(row.hours)
    return overrides


def get_cost_forecasted(project_name: str) -> float:
    """Forecasted cost still ahead of today for the project's Resource Allocations."""
    return get_cost_forecasted_map([project_name]).get(project_name, 0.0)


def get_cost_forecasted_map(project_names: list[str]) -> dict[str, float]:
    """Forecasted costs for multiple projects, keyed by project name.

    Only cost that is still ahead of today counts: elapsed allocation days are already
    realized in the project's total_costing_amount (cost_accrued) via timesheets, so
    counting them here would double-count them.

    An allocation that has not started yet is still fully ahead whatever its internal
    shape, so those are summed in the database and never inspected row by row. Only
    allocations straddling today need splitting, and that set holds at most one row per
    (employee, project) because the allocation API chunks every allocation into a single
    week. The split runs on chargeable hours so day overrides land on the right side of
    today, and stops at the employee's relieving date, which total_cost is already
    clamped to. Today counts as forecast, since today's timesheet is typically not
    submitted yet.
    """
    if not project_names:
        return {}

    as_on = getdate(today())
    ResourceAllocation = frappe.qb.DocType("Resource Allocation")
    Employee = frappe.qb.DocType("Employee")

    not_started = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.project,
            Coalesce(Sum(ResourceAllocation.total_cost), 0).as_("total"),
        )
        .where(ResourceAllocation.project.isin(project_names))
        .where(ResourceAllocation.allocation_start_date >= as_on)
        .groupby(ResourceAllocation.project)
        .run(as_dict=True)
    )
    forecast = {row.project: flt(row.total) for row in not_started}

    in_flight = (
        frappe.qb.from_(ResourceAllocation)
        .left_join(Employee)
        .on(Employee.name == ResourceAllocation.employee)
        .select(
            ResourceAllocation.name,
            ResourceAllocation.project,
            ResourceAllocation.total_cost,
            ResourceAllocation.allocation_start_date,
            ResourceAllocation.allocation_end_date,
            ResourceAllocation.include_weekends,
            ResourceAllocation.hours_allocated_per_day,
            Employee.relieving_date,
        )
        .where(ResourceAllocation.project.isin(project_names))
        .where(ResourceAllocation.allocation_start_date < as_on)
        .where(ResourceAllocation.allocation_end_date >= as_on)
        .run(as_dict=True)
    )
    overrides = _get_day_overrides([row.name for row in in_flight])

    for row in in_flight:
        end = getdate(row.allocation_end_date)
        if row.relieving_date:
            end = min(end, getdate(row.relieving_date))

        ratio = _remaining_cost_ratio(
            getdate(row.allocation_start_date),
            end,
            bool(cint(row.include_weekends)),
            flt(row.hours_allocated_per_day),
            overrides.get(row.name, {}),
            as_on,
        )
        if ratio:
            forecast[row.project] = forecast.get(row.project, 0.0) + flt(row.total_cost) * ratio

    return forecast


def get_burn_rate_per_week(project: dict) -> float | None:
    """
    Average budget consumed per week based on charge-out rate X hours worked.
    Returns None if no billing rate is defined (display blank in UI).
    """

    total_billable = flt(project.get("total_billable_amount"))
    if not total_billable:
        return None

    start_date = project.get("expected_start_date")
    if not start_date:
        return None

    days_elapsed = (getdate(today()) - getdate(start_date)).days
    weeks_elapsed = max(1, days_elapsed / 7)

    return total_billable / weeks_elapsed


def get_profit_margin(total_budget: float, cost_accrued: float, cost_forecasted: float) -> float:
    """
    Calculate profit margin percentage.
    Formula: (total_budget - (cost_accrued + cost_forecasted)) / total_budget X 100
    """
    if total_budget <= 0:
        return 0
    return ((total_budget - (cost_accrued + cost_forecasted)) / total_budget) * 100


def parse_order_by(order_by: str) -> tuple[str, str]:
    """Return (field, direction) from the first clause of an order_by string."""
    first_clause = (order_by or "").split(",")[0].strip()
    parts = first_clause.split()
    field = parts[0].strip("`") if parts else ""
    direction = parts[1].lower() if len(parts) > 1 else "desc"
    if direction not in ("asc", "desc"):
        direction = "desc"
    return field, direction


def get_computed_sort_value(
    sort_field: str, project: dict, cost_forecasted_map: dict[str, float]
) -> float | date | None:
    if sort_field == "contract_end_date":
        end_date = get_end_date(project)
        return getdate(end_date) if end_date else None
    total_budget = get_total_budget(project)
    if sort_field == "burn_rate_per_week":
        return get_burn_rate_per_week(project)
    if sort_field == "cost_burn_percent":
        # Mirrors the frontend cost-burn cell: cost_burn.cost_accrued / total_budget * 100
        if total_budget <= 0:
            return 0
        return (get_budget_burn_accrued(project) / total_budget) * 100
    if sort_field == "total_budget":
        return total_budget
    if sort_field == "profit_margin":
        return get_profit_margin(
            total_budget,
            flt(project.get("total_costing_amount")),
            cost_forecasted_map.get(project.get("name"), 0),
        )
    return None


def get_page_names_for_computed_sort(
    sort_field: str,
    sort_direction: str,
    project_filters: list,
    or_filters: dict | None,
    start: int,
    limit: int,
) -> tuple[list[str], int]:
    """
    Sort-key pagination for computed fields: fetch only the component columns for
    every matching project, compute the sort value in Python (same helpers used for
    display), sort with nulls last, and return the page's names plus the total count.
    """
    rows = get_list(
        "Project",
        fields=SORT_KEY_FIELDS,
        filters=project_filters,
        or_filters=or_filters,
        limit_page_length=0,
        order_by="modified desc",
    )

    cost_forecasted_map = get_cost_forecasted_map([row.name for row in rows]) if sort_field == "profit_margin" else {}

    valued = [(get_computed_sort_value(sort_field, row, cost_forecasted_map), row.name) for row in rows]
    ranked = [entry for entry in valued if entry[0] is not None]
    ranked.sort(key=lambda entry: entry[0], reverse=sort_direction == "desc")

    ordered_names = [name for _, name in ranked] + [name for value, name in valued if value is None]
    return ordered_names[start : start + limit], len(ordered_names)


def get_end_date(project: dict) -> str | None:
    """
    Use actual_end_date if project is closed, otherwise expected_end_date.
    """
    status = project.get("status")
    if status in ["Completed", "Cancelled"]:
        return project.get("actual_end_date") or project.get("expected_end_date")
    return project.get("expected_end_date")


def enrich_project_with_calculated_fields(
    project: dict,
    cost_forecasted_map: dict[str, float] | None = None,
    user_image_map: dict[str, str | None] | None = None,
) -> dict:
    """Add calculated fields to a project dict for list view."""
    project_name = project.get("name")

    # Basic calculated values
    total_budget = get_total_budget(project)
    cost_accrued = flt(project.get("total_costing_amount"))
    budget_burn_accrued = get_budget_burn_accrued(project)
    cost_forecasted = (
        cost_forecasted_map.get(project_name, 0)
        if cost_forecasted_map is not None
        else get_cost_forecasted(project_name)
    )
    target_cost = flt(project.get("custom_target_cost"))

    # Build response object
    enriched = {
        "name": project_name,
        "project_name": project.get("project_name"),
        "customer": project.get("customer"),
        "customer_name": project.get("customer_name"),
        "status": project.get("status"),
        "rag_status": project.get("custom_project_rag_status"),
        "phase": project.get("custom_project_phase"),
        "billing_type": project.get("custom_billing_type"),
        "currency": project.get("custom_currency"),
        "project_type": project.get("project_type"),
        # Calculated financial fields
        "burn_rate_per_week": get_burn_rate_per_week(project),
        "cost_burn": {
            "cost_accrued": budget_burn_accrued,
            "cost_forecasted": cost_forecasted,
            "target_cost": target_cost,
            "total_budget": total_budget,
        },
        "total_budget": total_budget,
        "profit_margin": get_profit_margin(total_budget, cost_accrued, cost_forecasted),
        # Dates
        "start_date": project.get("expected_start_date"),
        "next_milestone": project.get("custom_next_milestone"),
        "end_date": get_end_date(project),
        "contract_end_date": get_end_date(project),
        # People
        "project_manager": build_person_data(
            project.get("custom_project_manager"),
            project.get("custom_project_manager_name"),
            user_image_map,
        ),
        "engineering_manager": build_person_data(
            project.get("custom_engineering_manager"),
            project.get("custom_engineering_manager_name"),
            user_image_map,
        ),
    }

    return enriched


def enrich_project_for_kanban(project: dict) -> dict:
    """Add minimal fields to a project dict for kanban view (no heavy calculations)."""
    return {
        "name": project.get("name"),
        "project_name": project.get("project_name"),
        "rag_status": project.get("custom_project_rag_status"),
        "start_date": project.get("expected_start_date"),
        "end_date": get_end_date(project),
        "project_manager": build_person_data(
            project.get("custom_project_manager"),
            project.get("custom_project_manager_name"),
        ),
        "engineering_manager": build_person_data(
            project.get("custom_engineering_manager"),
            project.get("custom_engineering_manager_name"),
        ),
        "billing_type": project.get("custom_billing_type"),
    }


def get_project_phases() -> list[dict]:
    """Get all project phases ordered by position."""
    phases = frappe.get_all(
        "Project Phase",
        fields=["phase as key", "phase as label", "color", "position"],
        order_by="position asc",
    )
    return phases


@whitelist(methods=["GET"])
@error_logger
def get_projects_view(
    view: Literal["list", "kanban"] = "list",
    filters: str | list | None = None,
    search: str | None = None,
    start: int = 0,
    limit: int = 20,
    order_by: str = "modified desc",
):
    """
    Get projects for list view or kanban view.

    Args:
        view: "list" or "kanban"
        filters: Frappe-style filters on Project fields
        search: Search in project_name only
        start: Pagination offset
        limit: Page size
        order_by: Sort order

    Returns:
        For list view: {"data": [...], "total_count": int, "has_more": bool}
        For kanban view: {"columns": [...], "data": {...}, "total_count": int}
    """
    # Permission check
    only_for(ALLOWED_ROLES, message=True)

    # Parse filters if string
    if isinstance(filters, str):
        filters = json.loads(filters)

    # Build filters
    project_filters = list(filters) if filters else []

    # Build or_filters for search
    or_filters = {}
    if search:
        or_filters["project_name"] = ["like", f"%{search}%"]

    # Select fields based on view
    fields = LIST_VIEW_FIELDS if view == "list" else KANBAN_VIEW_FIELDS

    sort_field, sort_direction = parse_order_by(order_by)
    use_computed_sort = view == "list" and sort_field in COMPUTED_SORT_FIELDS
    if sort_field in COMPUTED_SORT_FIELDS and not use_computed_sort:
        order_by = "modified desc"

    if use_computed_sort:
        page_names, total_count = get_page_names_for_computed_sort(
            sort_field,
            sort_direction,
            project_filters,
            or_filters if or_filters else None,
            cint(start),
            cint(limit),
        )
        projects = []
        if page_names:
            projects = get_list(
                "Project",
                fields=fields,
                filters=[["name", "in", page_names]],
                limit_page_length=0,
            )
            rank = {name: index for index, name in enumerate(page_names)}
            projects.sort(key=lambda p: rank[p.name])
    else:
        # Fetch projects
        projects = get_list(
            "Project",
            fields=fields,
            filters=project_filters,
            or_filters=or_filters if or_filters else None,
            limit_start=cint(start),
            limit_page_length=cint(limit),
            order_by=order_by,
        )

        # Get total count
        total_count = get_count(
            "Project",
            filters=project_filters,
            or_filters=or_filters if or_filters else None,
        )

    has_more = cint(start) + cint(limit) < total_count

    if view == "list":
        # Prefetch forecasted costs and user images in bulk to avoid N+1 queries
        project_names = [p.get("name") for p in projects if p.get("name")]
        cost_forecasted_map = get_cost_forecasted_map(project_names)

        users = list(
            {u for p in projects for u in [p.get("custom_project_manager"), p.get("custom_engineering_manager")] if u}
        )
        user_image_map = get_user_image_map(users)

        enriched_projects = [
            enrich_project_with_calculated_fields(p, cost_forecasted_map, user_image_map) for p in projects
        ]

        return {
            "data": enriched_projects,
            "total_count": total_count,
            "has_more": has_more,
        }

    else:  # kanban view
        # Get phases for columns
        phases = get_project_phases()

        # Group projects by phase
        phase_groups = {phase["key"]: [] for phase in phases}

        for project in projects:
            phase = project.get("custom_project_phase")
            if phase and phase in phase_groups:
                phase_groups[phase].append(enrich_project_for_kanban(project))
            elif phase:
                # Phase exists but not in predefined phases - create a group for it
                if phase not in phase_groups:
                    phase_groups[phase] = []
                phase_groups[phase].append(enrich_project_for_kanban(project))

        return {
            "columns": phases,
            "data": phase_groups,
            "total_count": total_count,
        }


# ---------------------------------------------------------------------------
# Project sidebar helpers
# ---------------------------------------------------------------------------


def _get_github_url(project_doc) -> str | None:
    """Return repository_url of the first GitHub repository connection."""
    connections = project_doc.get("custom_project_repository_connections") or []
    if not connections:
        return None
    repo_link = connections[0].get("github_repository")
    if not repo_link:
        return None
    return frappe.db.get_value("GitHub Repository", repo_link, "repository_url")


def _get_opportunity_link(project_doc) -> dict | None:
    """
    Return opportunity name + URL.
    Uses Next CRM URL when the app is installed, else falls back to desk.
    """
    opportunity = project_doc.get("custom_opportunity")
    if not opportunity:
        return None

    site_url = frappe.utils.get_url()
    if "next_crm" in frappe.get_installed_apps():
        url = f"{site_url}/next-crm/opportunities/{opportunity}"
    else:
        url = frappe.utils.get_url_to_form("Opportunity", opportunity)

    return {"name": opportunity, "url": url}


def _get_project_members(
    project_name: str,
    currency: str,
    project_manager: str | None = None,
    engineering_manager: str | None = None,
) -> list[dict]:
    """
    Return the project's people, with full_name, image, designation, and logged hours.

    The project manager and engineering manager are listed first (in that order),
    followed by the users the project has been shared with. Each user appears once,
    even when a manager is also a shared member.
    """
    shares = frappe.get_all(
        "DocShare",
        filters={"share_doctype": "Project", "share_name": project_name, "everyone": 0},
        fields=["user"],
    )

    role_map: dict[str, list[str]] = {}
    user_ids: list[str] = []

    def _add(uid: str | None, role: str | None = None) -> None:
        if not uid:
            return
        if uid not in role_map:
            role_map[uid] = []
            user_ids.append(uid)
        if role and role not in role_map[uid]:
            role_map[uid].append(role)

    _add(project_manager, "Project Manager")
    _add(engineering_manager, "Engineering Manager")
    for share in shares:
        _add(share.user)

    if not user_ids:
        return []

    users = frappe.get_all(
        "User",
        filters={"name": ["in", user_ids]},
        fields=["name", "full_name", "user_image"],
    )
    user_map = {u.name: u for u in users}

    employee_fields = ["name", "user_id", "designation", "department", "cell_number", "company_email"]
    if frappe.get_meta("Employee").has_field("custom_linkedin"):
        employee_fields.append("custom_linkedin")

    employees = frappe.get_all(
        "Employee",
        filters={"user_id": ["in", user_ids], "status": "Active"},
        fields=employee_fields,
    )
    employee_map = {e.user_id: e for e in employees}

    logged_hours_map = _get_member_logged_hours(project_name, [e.name for e in employees])

    def _hourly_rate(employee_name: str | None) -> float | None:
        if not employee_name or not currency:
            return None
        try:
            salary = get_employee_salary(employee_name, currency, throw=False)
        except Exception:
            return None
        return flt(salary.get("hourly_salary")) if salary else None

    return [
        {
            "user": uid,
            "employee": employee_map[uid].name if uid in employee_map else None,
            "full_name": user_map[uid].full_name or "",
            "image": user_map[uid].user_image,
            "designation": emp.designation if (emp := employee_map.get(uid)) else None,
            "department": emp.department if emp else None,
            "cell_number": emp.cell_number if emp else None,
            "company_email": emp.company_email if emp else None,
            "linkedin_url": emp.get("custom_linkedin") if emp else None,
            "hourly_rate": _hourly_rate(emp.name if emp else None),
            "currency": currency if emp else None,
            "logged_hours": logged_hours_map.get(emp.name, 0.0) if emp else 0.0,
            "project_roles": role_map.get(uid, []),
        }
        for uid in user_ids
        if uid in user_map
    ]


def _get_member_logged_hours(project_name: str, employee_names: list[str]) -> dict:
    """Return {employee: total hours logged to the project} in a single grouped query."""
    if not employee_names:
        return {}

    Timesheet = frappe.qb.DocType("Timesheet")
    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")
    rows = (
        frappe.qb.from_(TimesheetDetail)
        .join(Timesheet)
        .on(TimesheetDetail.parent == Timesheet.name)
        .select(Timesheet.employee, Sum(TimesheetDetail.hours).as_("hours"))
        .where(TimesheetDetail.project == project_name)
        .where(TimesheetDetail.docstatus.isin([0, 1]))
        .where(Timesheet.employee.isin(employee_names))
        .groupby(Timesheet.employee)
        .run(as_dict=True)
    )
    return {row.employee: flt(row.hours) for row in rows}


def _get_project_customers(project_doc) -> list[dict]:
    """Return contact details from custom_customer_contacts child table."""
    rows = project_doc.get("custom_customer_contacts") or []
    contact_names = [r.get("contact") for r in rows if r.get("contact")]
    if not contact_names:
        return []

    contact_fields = [
        "name",
        "full_name",
        "image",
        "designation",
        "company_name",
        "email_id",
        "phone",
        "mobile_no",
    ]
    if frappe.get_meta("Contact").has_field("custom_linkedin_url"):
        contact_fields.append("custom_linkedin_url")

    contacts = frappe.get_all(
        "Contact",
        filters={"name": ["in", contact_names]},
        fields=contact_fields,
    )
    contact_map = {c.name: c for c in contacts}

    return [
        {
            "contact": name,
            "full_name": c.full_name or "",
            "image": c.image,
            "designation": c.designation,
            "company_name": c.company_name,
            "email_id": c.email_id,
            "phone": c.phone or c.mobile_no,
            "linkedin_url": c.get("custom_linkedin_url"),
        }
        for name in contact_names
        if (c := contact_map.get(name))
    ]


def _get_project_billing_team(project_name: str) -> list[dict]:
    """Return billing team members with name, employee_id and user_id."""
    rows = frappe.get_all(
        "Project Billing Team",
        filters={"parent": project_name},
        fields=["employee", "user_name"],
        order_by="idx asc",
    )
    employee_ids = [row.employee for row in rows if row.employee]
    if not employee_ids:
        return []

    user_id_map = {
        e.name: e.user_id
        for e in frappe.get_all(
            "Employee",
            filters={"name": ["in", employee_ids]},
            fields=["name", "user_id"],
        )
    }

    return [
        {
            "name": row.user_name,
            "employee_id": row.employee,
            "user_id": user_id_map.get(row.employee),
        }
        for row in rows
        if row.employee
    ]


def _get_invoice_burn(project_name: str) -> dict:
    """
    Aggregate paid and unpaid amounts from submitted Sales Invoices in company currency.

    Parameters
    ----------
    project_name : str
        The name of the Project document.

    Returns
    -------
    dict
        currency : str or None
            Company default currency for the project. None when the project has no company.
        invoiced_and_paid : float
            Sum of (base_grand_total - outstanding in base) across submitted invoices.
        invoiced_but_not_paid : float
            Sum of outstanding_amount * conversion_rate across submitted invoices.
    """
    company = frappe.db.get_value("Project", project_name, "company")
    currency = frappe.db.get_value("Company", company, "default_currency") if company else None

    SalesInvoice = frappe.qb.DocType("Sales Invoice")
    base_outstanding = (
        SalesInvoice.outstanding_amount * SalesInvoice.conversion_rate
    )  # since base_outstanding may not be in company currency
    rows = (
        frappe.qb.from_(SalesInvoice)
        .select(
            Coalesce(Sum(SalesInvoice.base_grand_total - base_outstanding), 0).as_("paid"),
            Coalesce(Sum(base_outstanding), 0).as_("unpaid"),
        )
        .where(SalesInvoice.project == project_name)
        .where(SalesInvoice.docstatus == 1)
        .run(as_dict=True)
    )

    row = rows[0] if rows else {}
    return {
        "currency": currency,
        "invoiced_and_paid": flt(row.get("paid")),
        "invoiced_but_not_paid": flt(row.get("unpaid")),
    }


def _get_task_counts(project_name: str) -> dict:
    """
    Count tasks for a project by tracking-relevant statuses.

    Parameters
    ----------
    project_name : str
        The name of the Project document.

    Returns
    -------
    dict
        total : int
            Open, Working, Pending Review, Overdue, and Completed tasks.
        open : int
            Open, Working, Pending Review, and Overdue tasks.
        completed : int
            Completed tasks only. Template and Cancelled are excluded from all counts.
    """
    Task = frappe.qb.DocType("Task")
    rows = (
        frappe.qb.from_(Task)
        .select(Task.status, Count("*").as_("count"))
        .where(Task.project == project_name)
        .where(Task.status.isin(TASK_TRACKING_TOTAL_STATUSES))
        .groupby(Task.status)
        .run(as_dict=True)
    )

    total = 0
    open_count = 0
    completed = 0
    for row in rows:
        total += row.count
        if row.status == TASK_TRACKING_COMPLETED_STATUS:
            completed += row.count
        elif row.status in TASK_TRACKING_OPEN_STATUSES:
            open_count += row.count

    return {
        "total": total,
        "open": open_count,
        "completed": completed,
    }


def _get_hours_split(project: str) -> tuple[float, float]:
    """Billable and non-billable hours logged against the project via Timesheets."""
    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")
    rows = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            TimesheetDetail.is_billable,
            Coalesce(Sum(TimesheetDetail.hours), 0).as_("total"),
        )
        .where(TimesheetDetail.project == project)
        .where(TimesheetDetail.docstatus.isin([0, 1]))
        .groupby(TimesheetDetail.is_billable)
        .run(as_dict=True)
    )

    billable = 0
    non_billable = 0
    for row in rows:
        if cint(row.is_billable):
            billable += flt(row.total)
        else:
            non_billable += flt(row.total)

    return billable, non_billable


@whitelist(methods=["GET"])
@error_logger
def get_project_tracking(project: str):
    """
    Return tracking data for a project.

    Parameters
    ----------
    project : str
        The name of the Project document.

    Returns
    -------
    dict
        company : str
            Company linked to the project.
        billing_type : str
            One of Non-Billable, Fixed Cost, Retainer, Time and Material.
        currency : str
            Project currency code.
        hours_utilised : float
            Total hours logged via Timesheets (billable plus non-billable).
        hours_utilised_billable : float
            Billable hours logged via Timesheets.
        hours_utilised_non_billable : float
            Non-billable hours logged via Timesheets.
        hours_remaining : float
            Contracted hours (total hours purchased for hours-pool projects,
            target hours otherwise) minus utilised hours (may be negative).
        tasks : dict
            total, open, completed task counts.
        invoice_burn : dict
            currency (company default), invoiced_and_paid, invoiced_but_not_paid,
            total_project_amount. Omitted for Non-Billable projects.
        total_project_value : float
            Total budget/value for the project.
        project_profit : float
            Total project value minus actual and forecasted costs.
        projected_profit_margin : float
            Projected profit as a percentage of total project value.
        actual_cost_incurred : float
            Actual cost incurred from Timesheet Detail costing amounts.
        forecasted_cost_to_completion : float
            Remaining forecast cost from Resource Allocation total cost minus actual cost.
        expected_total_cost : float
            Static target/expected cost from the Project.
        contracts : list of dict or None
            Project Budget rows. None for Non-Billable and T&M.
        lifetime_values : dict or None
            Billable-only lifetime value metrics (None for Non-Billable):
            lifetime_value_to_date, expected_lifetime_value,
            lifetime_value_vs_billed_amount (each float or None).
        project_rates : list of dict or None
            Project Billing Team rows. None unless T&M.
            First element is always the flat-rate entry:
              flat_rate_hourly - custom_default_hourly_billing_rate (None if unset)
              flat_rate_valid_from - actual_start_date (None if unset)
            Subsequent elements are per-member rows. hourly_billing_rate and
            valid_from fall back to the flat-rate values when blank.
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(frappe._("Project is required"), frappe.MandatoryError)

    if not frappe.db.exists("Project", project):
        frappe.throw(frappe._("Project '{0}' does not exist").format(project), frappe.DoesNotExistError)

    frappe.has_permission(doctype="Project", doc=project, throw=True)

    p = frappe.db.get_value(
        "Project",
        project,
        [
            "company",
            "custom_billing_type",
            "total_costing_amount",
            "total_sales_amount",
            "custom_currency",
            "custom_target_cost",
            "custom_total_hours_purchased",
            "custom_target_hours",
            "actual_start_date",
            "custom_default_hourly_billing_rate",
            "custom_lifetime_value_to_date",
            "custom_expected_lifetime_value",
            "custom_lifetime_value_vs_billed_amount",
        ],
        as_dict=True,
    )

    billing_type = p.custom_billing_type
    is_billable = billing_type != "Non-Billable"
    has_hours_pool = billing_type in ("Fixed Cost", "Retainer")
    is_time_and_material = billing_type == "Time and Material"

    invoice_burn = _get_invoice_burn(project) if is_billable else None
    task_counts = _get_task_counts(project)
    actual_cost_incurred = flt(p.total_costing_amount)
    total_forecasted_cost = get_cost_forecasted(project)
    forecasted_cost_to_completion = max(0, total_forecasted_cost)

    total_project_value = flt(p.total_sales_amount)
    projected_profit = total_project_value - (actual_cost_incurred + forecasted_cost_to_completion)
    projected_profit_margin = (projected_profit / total_project_value * 100) if total_project_value else 0

    hours_utilised_billable, hours_utilised_non_billable = _get_hours_split(project)
    hours_utilised = hours_utilised_billable + hours_utilised_non_billable
    total_contracted_hours = flt(p.custom_total_hours_purchased) if has_hours_pool else flt(p.custom_target_hours)

    contracts = None
    if has_hours_pool:
        contracts = [
            {
                "name": row.name,
                "start_date": row.start_date,
                "end_date": row.end_date,
                "hours_purchased": flt(row.hours_purchased),
                "consumed_hours": flt(row.consumed_hours),
                "remaining_hours": flt(row.remaining_hours),
                "sales_order": row.sales_order,
                "sales_invoice": row.sales_invoice,
            }
            for row in frappe.get_all(
                "Project Budget",
                filters={"parent": project, "parentfield": "custom_project_budget_hours"},
                fields=[
                    "name",
                    "start_date",
                    "end_date",
                    "hours_purchased",
                    "consumed_hours",
                    "remaining_hours",
                    "sales_order",
                    "sales_invoice",
                ],
                order_by="idx asc",
            )
        ]

    project_rates = None
    if is_time_and_material:
        flat_rate_hourly = flt(p.custom_default_hourly_billing_rate) or None
        flat_rate_valid_from = p.actual_start_date

        billing_team_rows = frappe.get_all(
            "Project Billing Team",
            filters={"parent": project},
            fields=["name", "employee", "user_name", "hourly_billing_rate", "valid_from"],
            order_by="idx asc",
        )
        employee_image_map = get_employee_image_map([row.employee for row in billing_team_rows if row.employee])

        project_rates = [
            {
                "flat_rate_hourly": flat_rate_hourly,
                "flat_rate_valid_from": flat_rate_valid_from,
            },
            *[
                {
                    "name": row.name,
                    "employee": row.employee,
                    "employee_name": row.user_name,
                    "image": employee_image_map.get(row.employee),
                    "hourly_billing_rate": flt(row.hourly_billing_rate) or flat_rate_hourly,
                    "valid_from": row.valid_from or flat_rate_valid_from,
                }
                for row in billing_team_rows
            ],
        ]

    lifetime_values = None
    if is_billable:
        lifetime_values = {
            "lifetime_value_to_date": flt(v) if (v := p.custom_lifetime_value_to_date) not in (None, "") else None,
            "expected_lifetime_value": flt(v) if (v := p.custom_expected_lifetime_value) not in (None, "") else None,
            "lifetime_value_vs_billed_amount": flt(v)
            if (v := p.custom_lifetime_value_vs_billed_amount) not in (None, "")
            else None,
        }

    return {
        "company": p.company,
        "billing_type": billing_type,
        "currency": p.custom_currency,
        "total_project_value": total_project_value if is_billable else None,
        "project_profit": projected_profit if is_billable else None,
        "projected_profit_margin": projected_profit_margin if is_billable else None,
        "actual_cost_incurred": actual_cost_incurred,
        "forecasted_cost_to_completion": forecasted_cost_to_completion,
        "expected_total_cost": flt(p.custom_target_cost),
        "hours_utilised": hours_utilised,
        "hours_utilised_billable": hours_utilised_billable,
        "hours_utilised_non_billable": hours_utilised_non_billable,
        "hours_remaining": total_contracted_hours - hours_utilised,
        "tasks": task_counts,
        "invoice_burn": {
            **(invoice_burn or {}),
            "total_project_amount": flt(p.total_sales_amount) if is_billable else None,
        },
        "contracts": contracts,
        "project_rates": project_rates,
        "lifetime_values": lifetime_values,
    }


@whitelist(methods=["GET"])
@error_logger
def get_project_sidebar(project: str):
    """
    Return all data needed to render the project sidebar panel.

    Response shape:
        summary       - short summary text
        details       - project name, phase, status, customer
        links         - slack, google_drive, website, github, opportunity
        burn          - total_budget, cost_accrued, cost_forecasted, target_cost
        progress      - actual_time; total_hours_purchased (Retainer) or custom_target_hours (all other billing types)
        members       - users the project has been shared with
        customers     - contacts from custom_customer_contacts
        billing_team  - billing team members (name, employee_id, user_id)
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(frappe._("Project is required"), frappe.MandatoryError)

    if not frappe.db.exists("Project", project):
        frappe.throw(frappe._("Project '{0}' does not exist").format(project), frappe.DoesNotExistError)

    project_doc = frappe.get_doc("Project", project)

    is_retainer = project_doc.get("custom_billing_type") == "Retainer"

    total_budget = get_total_budget(project_doc)
    cost_accrued = get_budget_burn_accrued(project_doc)
    cost_forecasted = get_cost_forecasted(project)
    target_cost = flt(project_doc.custom_target_cost)

    return {
        "summary": project_doc.get("custom_short_summary"),
        "details": {
            "project_name": project_doc.project_name,
            "phase": project_doc.custom_project_phase,
            "status": project_doc.status,
            "customer": project_doc.customer,
        },
        "links": {
            "slack": project_doc.get("custom_internal_slack_channel"),
            "google_drive": project_doc.get("custom_google_drive_folder"),
            "website": project_doc.get("custom_website"),
            "github": _get_github_url(project_doc),
            "opportunity": _get_opportunity_link(project_doc),
        },
        "burn": {
            "total_budget": total_budget,
            "cost_accrued": cost_accrued,
            "cost_forecasted": cost_forecasted,
            "target_cost": target_cost,
        },
        "progress": {
            "actual_time": flt(project_doc.actual_time),
            "total_hours_purchased": (
                flt(project_doc.get("custom_total_hours_purchased"))
                if is_retainer
                else flt(project_doc.get("custom_target_hours"))
            ),
        },
        "members": _get_project_members(
            project,
            project_doc.get("custom_currency") or frappe.defaults.get_global_default("currency"),
            project_doc.get("custom_project_manager"),
            project_doc.get("custom_engineering_manager"),
        ),
        "customers": _get_project_customers(project_doc),
        "billing_team": _get_project_billing_team(project),
        "is_shared_with_everyone": bool(
            frappe.db.exists(
                "DocShare",
                {"share_doctype": "Project", "share_name": project, "everyone": 1},
            )
        ),
    }
