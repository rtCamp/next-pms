# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import json
from typing import Literal

import frappe
from frappe import get_list, only_for, whitelist
from frappe.query_builder.functions import Coalesce, Sum
from frappe.utils import cint, flt, getdate, today

from next_pms.api.utils import error_logger
from next_pms.next_projects.api.constant import ALLOWED_ROLES, KANBAN_VIEW_FIELDS, LIST_VIEW_FIELDS
from next_pms.next_projects.api.utils import build_person_data, get_user_image_map
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


def get_cost_forecasted(project_name: str) -> float:
    """Sum of total_cost from ALL Resource Allocations for the project."""
    ResourceAllocation = frappe.qb.DocType("Resource Allocation")
    result = (
        frappe.qb.from_(ResourceAllocation)
        .select(Coalesce(Sum(ResourceAllocation.total_cost), 0).as_("total"))
        .where(ResourceAllocation.project == project_name)
        .run(as_dict=True)
    )
    return flt(result[0].total) if result else 0


def get_cost_forecasted_map(project_names: list[str]) -> dict[str, float]:
    """Fetch forecasted costs for multiple projects in a single grouped query."""
    if not project_names:
        return {}
    ResourceAllocation = frappe.qb.DocType("Resource Allocation")
    rows = (
        frappe.qb.from_(ResourceAllocation)
        .select(
            ResourceAllocation.project,
            Coalesce(Sum(ResourceAllocation.total_cost), 0).as_("total"),
        )
        .where(ResourceAllocation.project.isin(project_names))
        .groupby(ResourceAllocation.project)
        .run(as_dict=True)
    )
    return {row.project: flt(row.total) for row in rows}


def get_burn_rate_per_week(project: dict) -> float | None:
    """
    Average budget consumed per week based on charge-out rate X hours worked.
    Returns None if no billing rate is defined (display blank in UI).
    """
    if not project.get("custom_default_hourly_billing_rate"):
        return None

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
            "cost_accrued": cost_accrued,
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


def _get_project_members(project_name: str, currency: str) -> list[dict]:
    """Return users shared with the project, with full_name, image, and designation."""
    shares = frappe.get_all(
        "DocShare",
        filters={"share_doctype": "Project", "share_name": project_name, "everyone": 0},
        fields=["user"],
    )
    if not shares:
        return []

    user_ids = [s.user for s in shares]

    users = frappe.get_all(
        "User",
        filters={"name": ["in", user_ids]},
        fields=["name", "full_name", "user_image"],
    )
    user_map = {u.name: u for u in users}

    employees = frappe.get_all(
        "Employee",
        filters={"user_id": ["in", user_ids], "status": "Active"},
        fields=["name", "user_id", "designation", "department", "cell_number", "company_email", "custom_linkedin"],
    )
    employee_map = {e.user_id: e for e in employees}

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
            "full_name": user_map[uid].full_name or "",
            "image": user_map[uid].user_image,
            "designation": emp.designation if (emp := employee_map.get(uid)) else None,
            "department": emp.department if emp else None,
            "cell_number": emp.cell_number if emp else None,
            "company_email": emp.company_email if emp else None,
            "linkedin_url": emp.custom_linkedin if emp else None,
            "hourly_rate": _hourly_rate(emp.name if emp else None),
            "currency": currency if emp else None,
        }
        for uid in user_ids
        if uid in user_map
    ]


def _get_project_customers(project_doc) -> list[dict]:
    """Return contact details from custom_customer_contacts child table."""
    rows = project_doc.get("custom_customer_contacts") or []
    contact_names = [r.get("contact") for r in rows if r.get("contact")]
    if not contact_names:
        return []

    contacts = frappe.get_all(
        "Contact",
        filters={"name": ["in", contact_names]},
        fields=[
            "name",
            "full_name",
            "image",
            "designation",
            "company_name",
            "email_id",
            "phone",
            "mobile_no",
            "custom_linkedin_url",
        ],
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
            "linkedin_url": c.custom_linkedin_url,
        }
        for name in contact_names
        if (c := contact_map.get(name))
    ]


@whitelist(methods=["GET"])
@error_logger
def get_project_sidebar(project: str):
    """
    Return all data needed to render the project sidebar panel.

    Response shape:
        summary       - short summary text
        details       - project name, phase, status, customer
        links         - slack, google_drive, website, github, opportunity
        burn          - total_budget, cost_accrued, cost_forecasted
        progress      - actual_time, total_hours_purchased
        members       - users the project has been shared with
        customers     - contacts from custom_customer_contacts
    """
    only_for(ALLOWED_ROLES, message=True)

    if not project:
        frappe.throw(frappe._("Project is required"), frappe.MandatoryError)

    if not frappe.db.exists("Project", project):
        frappe.throw(frappe._("Project '{0}' does not exist").format(project), frappe.DoesNotExistError)

    project_doc = frappe.get_doc("Project", project)

    total_budget = get_total_budget(project_doc)
    cost_accrued = flt(project_doc.total_costing_amount)
    cost_forecasted = get_cost_forecasted(project)

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
        },
        "progress": {
            "actual_time": flt(project_doc.actual_time),
            "total_hours_purchased": flt(project_doc.get("custom_total_hours_purchased")),
        },
        "members": _get_project_members(
            project,
            project_doc.get("custom_currency") or frappe.defaults.get_global_default("currency"),
        ),
        "customers": _get_project_customers(project_doc),
    }
