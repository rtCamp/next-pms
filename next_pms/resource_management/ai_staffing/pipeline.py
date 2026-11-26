from collections.abc import Callable
from datetime import date
from typing import Any

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, strip_html, today

from next_pms.resource_management.ai_staffing import data, sow
from next_pms.resource_management.ai_staffing.constants import BILLABILITY_LOOKBACK_DAYS
from next_pms.resource_management.ai_staffing.margin import flag_margins, project_hourly_rate
from next_pms.resource_management.ai_staffing.matching import match_all_requirements
from next_pms.resource_management.ai_staffing.types import (
    MatchedAllocation,
    ProjectStaffingRequirement,
    SowEstimate,
)

logger = frappe.logger("ai_staffing")

DEAL_FIELDS = (
    "name",
    "organization",
    "organization_name",
    "company",
    "currency",
    "expected_deal_value",
    "deal_value",
    "custom_expected_start_date",
    "custom_project",
    "erpnext_customer",
)


def run_staffing(deal: str) -> None:
    """Staffs a qualified deal from its SOW sheet: project, then Tentative AI allocations.

    The request row is locked first, so two runs for one deal never overlap, and an
    Allocated deal is never staffed twice.
    """
    request = frappe.get_doc("AI Staffing Request", deal, for_update=True)
    if request.status == "Allocated":
        return
    request.db_set({"status": "In Progress", "error": None})
    # Manual commit: show In Progress and release the row lock while the long run works.
    frappe.db.commit()  # nosemgrep

    try:
        _staff(request)
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(
            title=f"AI staffing failed for deal {deal}",
            reference_doctype="AI Staffing Request",
            reference_name=deal,
        )
        frappe.db.set_value("AI Staffing Request", deal, {"status": "Failed", "error": strip_html(str(e))})
        # Manual commit: record the failure after rolling the run back.
        frappe.db.commit()  # nosemgrep


def sync_project_value(deal: str) -> None:
    """Copies an already-staffed deal's value to its project. A blank value never overwrites."""
    project = frappe.db.get_value("AI Staffing Request", deal, "project")
    value = _deal_value(_load_deal(deal))
    if project and value is not None:
        _set_project_value(project, value)


def _staff(request) -> None:
    deal = _load_deal(request.name)
    if not deal:
        frappe.throw(_("CRM Deal {0} no longer exists.").format(request.name))
    estimate = sow.fetch_sow_estimate(request.sow_link)
    requirements = estimate.requirements
    if not requirements:
        frappe.throw(_("The SOW sheet has no roles to staff."))

    start = min(r.start_date for r in requirements)
    end = max(r.end_date for r in requirements)
    employees = data.active_employees()
    skills = _optional("employee skills", data.employee_skills, {})
    leave = _optional("leave applications", lambda: data.approved_leave(start, end), [])
    billability = _optional(
        "billability",
        lambda: data.billability(add_days(today(), -BILLABILITY_LOOKBACK_DAYS), getdate(today())),
        {},
    )

    value = _deal_value(deal)
    currency = deal.currency or (deal.company and frappe.get_cached_value("Company", deal.company, "default_currency"))
    project_rate = None
    costs: dict[str, float] = {}
    if currency:
        project_rate = _project_hourly_rate(estimate, value, currency)
        costs = _optional("employee costs", lambda: data.blended_hourly_costs(currency, getdate(today())), {})

    project = request.project or _find_project(deal)
    if project:
        if value is not None:
            _set_project_value(project, value)
    else:
        project = _create_project(deal, end, value, project_rate)
    request.db_set("project", project)
    # Manual commit: keep the project even if allocating fails, so a retry reuses it.
    frappe.db.commit()  # nosemgrep

    _lock_bookings()
    matches = match_all_requirements(
        requirements,
        employees,
        skills,
        data.allocations_overlapping(start, end, exclude_project=project),
        leave,
        billability,
    )
    flag_margins(matches, costs, project_rate, currency or "")
    already_on_project = data.employees_on_project(project)
    for match in matches:
        if match.employee not in already_on_project:
            _allocate(project, match)

    request.db_set(
        {
            "status": "Allocated",
            "summary": _summary(project, start, end, requirements, matches, billability),
        }
    )
    # Manual commit: end the run's transaction, releasing the bookings lock.
    frappe.db.commit()  # nosemgrep


def _load_deal(deal: str) -> frappe._dict:
    meta = frappe.get_meta("CRM Deal")
    fields = [f for f in DEAL_FIELDS if f == "name" or meta.has_field(f)]
    return frappe._dict(frappe.db.get_value("CRM Deal", deal, fields, as_dict=True) or {})


def _optional(label: str, load: Callable[[], Any], fallback: Any) -> Any:
    """These inputs only rank candidates or flag margins, so a failure never stops staffing."""
    try:
        return load()
    except Exception:
        logger.warning(f"Could not load {label}; staffing without it", exc_info=True)
        return fallback


def _deal_value(deal: frappe._dict) -> float | None:
    value = flt(deal.get("expected_deal_value")) or flt(deal.get("deal_value"))
    return value or None


def _project_hourly_rate(estimate: SowEstimate, deal_value: float | None, currency: str) -> float | None:
    """The SOW sales tab's TOTAL cost / hours in the project's currency, else deal value / SOW hours."""
    if estimate.sales_hourly_rate:
        sales_currency = estimate.sales_currency or currency
        if sales_currency == currency:
            return estimate.sales_hourly_rate
        if rate := data.exchange_rate(sales_currency, currency, getdate(today())):
            return estimate.sales_hourly_rate * rate
        logger.warning(f"No exchange rate from {sales_currency} to {currency}; using the deal value instead")
    return project_hourly_rate(deal_value, estimate.total_hours)


def _find_project(deal: frappe._dict) -> str | None:
    """A project the deal already has: linked on the deal, or created by crm_xt's Won automation."""
    if deal.get("custom_project"):
        return deal.custom_project
    if frappe.get_meta("Project").has_field("custom_deal"):
        return frappe.db.get_value("Project", {"custom_deal": deal.name}, "name", order_by="creation asc")


def _set_project_value(project: str, value: float) -> None:
    doc = frappe.get_doc("Project", project)
    if flt(doc.estimated_costing, 2) != flt(value, 2):
        doc.estimated_costing = value
        doc.save(ignore_permissions=True)


def _create_project(deal: frappe._dict, end: date, value: float | None, project_rate: float | None) -> str:
    if not deal.get("organization"):
        frappe.throw(_("The deal has no organization, so its project has no customer."))
    if not deal.get("company"):
        frappe.throw(_("The deal has no company, so its project can't be created."))

    start = getdate(deal.custom_expected_start_date)
    project = frappe.get_doc(
        {
            "doctype": "Project",
            # Same name crm_xt's Won automation gives a deal's project.
            "project_name": f"{deal.get('organization_name') or deal.organization} - {deal.name}",
            "customer": _get_or_create_customer(deal),
            "company": deal.company,
            "expected_start_date": start,
            "expected_end_date": max(end, start),
        }
    )
    if project.meta.has_field("custom_deal"):
        project.custom_deal = deal.name
    if value is not None:
        project.estimated_costing = value
    if deal.currency:
        project.custom_currency = deal.currency
    if project_rate is not None:
        project.custom_default_hourly_billing_rate = flt(project_rate, 2)
    project.insert(ignore_permissions=True)

    if "custom_project" in deal and not deal.custom_project:
        frappe.db.set_value("CRM Deal", deal.name, "custom_project", project.name, update_modified=False)
    return project.name


def _get_or_create_customer(deal: frappe._dict) -> str:
    """The organization's Customer, matched the way crm_xt links them, else a new one."""
    organization = deal.organization
    if deal.get("erpnext_customer") and frappe.db.exists("Customer", deal.erpnext_customer):
        return deal.erpnext_customer

    linked = frappe.get_meta("Customer").has_field("custom_crm_organization")
    if linked and (customer := frappe.db.get_value("Customer", {"custom_crm_organization": organization})):
        return customer
    if customer := frappe.db.get_value("Customer", {"customer_name": organization}):
        return customer

    currency = deal.currency or frappe.get_cached_value("Company", deal.company, "default_currency")
    if not currency:
        frappe.throw(_("Neither the deal nor company {0} has a currency for the new customer.").format(deal.company))
    customer = frappe.get_doc({"doctype": "Customer", "customer_name": organization, "default_currency": currency})
    if linked:
        customer.custom_crm_organization = organization
    return customer.insert(ignore_permissions=True).name


def _lock_bookings() -> None:
    """Serialises reading bookings and booking across every deal's run, so two deals can't
    book the same free hours. Held until the run commits or rolls back."""
    singles = frappe.qb.DocType("Singles")
    (
        frappe.qb.from_(singles)
        .select(singles.value)
        .where((singles.doctype == "AI Staffing Settings") & (singles.field == "enabled"))
        .for_update()
        .run()
    )


def _allocate(project: str, match: MatchedAllocation) -> None:
    frappe.get_doc(
        {
            "doctype": "Resource Allocation",
            "employee": match.employee,
            "project": project,
            "allocation_start_date": match.start_date,
            "allocation_end_date": match.end_date,
            "hours_allocated_per_day": match.hours_per_day,
            "status": "Tentative",
            # Billable so tentative client work shows in billability reports; the PM can uncheck it.
            "is_billable": 1,
            "is_ai_created": 1,
            "ai_allocation_reason": "\n".join([f"Role: {match.role_label}", *(f"- {r}" for r in match.reasoning)]),
        }
    ).insert(ignore_permissions=True)


def _billability_cell(employee: str, billability: dict[str, dict[str, float]]) -> str:
    totals = billability.get(employee)
    if not totals or totals.get("total_hours", 0.0) <= 0:
        return "no data"
    ratio = totals["credited_hours"] / totals["total_hours"]
    growth = totals.get("credited_hours", 0.0) - totals.get("billable_hours", 0.0)
    return f"{ratio * 100:.0f}%" + (f" (+{growth:.0f}h Growth)" if growth > 0 else "")


def _summary(
    project: str,
    start: date,
    end: date,
    requirements: list[ProjectStaffingRequirement],
    matches: list[MatchedAllocation],
    billability: dict[str, dict[str, float]],
) -> str:
    """One row per requirement and employee, including why a role is left unfilled."""
    weeks = round((end - start).days / 7)
    lines = [
        f"- **Project:** {project}",
        f"- **Duration:** {start.isoformat()} → {end.isoformat()} (~{weeks} weeks)",
        "",
        "| Role | Matched | Employee | Designation | Hours/day | Billability | Reason | Margin |",
        "|---|---|---|---|---|---|---|---|",
    ]
    by_role: dict[str, list[MatchedAllocation]] = {}
    for match in matches:
        by_role.setdefault(match.role_label, []).append(match)

    for req in requirements:
        role_matches = by_role.get(req.role_label, [])
        filled = f"{len(role_matches)}/{req.team_members_needed}"
        for m in role_matches:
            lines.append(
                f"| {req.role_label} | {filled} | {m.employee_name} | {m.designation} | {m.hours_per_day} | "
                f"{_billability_cell(m.employee, billability)} | {'; '.join(m.reasoning)} | {m.margin_note or ''} |"
            )
        if len(role_matches) < req.team_members_needed:
            reason = (
                "No further eligible candidate for the remaining slot(s)"
                if role_matches
                else "No eligible candidate (designation and level, department, notice, leave and availability considered)"
            )
            lines.append(f"| {req.role_label} | {filled} | - | - | - | - | {reason} | |")
    return "\n".join(lines)
