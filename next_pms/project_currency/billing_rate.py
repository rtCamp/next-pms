# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt, getdate

# Applied to an employee's hourly cost rate when a project defines no billable rate.
# Shared with next_pms.project_currency.overrides.timesheet, which stamps the same
# multiplier onto Timesheet Detail rows, so forecasts and actuals cannot drift apart.
BILLING_RATE_COST_MULTIPLIER = 3


def get_billing_rate_context(project_map: dict[str, dict]) -> dict[tuple[str, str], list]:
    """Per-employee billing rates for the Time and Material projects in project_map.

    Keyed by (project, employee) and ordered newest valid_from first, so a caller picks a
    rate with a single scan. Only Time and Material projects consult the billing team, so
    projects on any other billing type are never queried for.
    """
    time_and_material = [
        name for name, project in project_map.items() if project.get("custom_billing_type") == "Time and Material"
    ]
    if not time_and_material:
        return {}

    context: dict[tuple[str, str], list] = {}
    for row in frappe.get_all(
        "Project Billing Team",
        filters={"parent": ["in", time_and_material], "parenttype": "Project"},
        fields=["parent", "employee", "hourly_billing_rate", "valid_from"],
        order_by="valid_from desc",
    ):
        context.setdefault((row.parent, row.employee), []).append(row)
    return context


def resolve_billing_rate(
    project: str,
    employee: str,
    hourly_cost_rate: float,
    as_on,
    project_map: dict[str, dict],
    context: dict[tuple[str, str], list],
) -> float:
    """Hourly rate an employee's work bills at on a project, as on a date.

    Mirrors Timesheet.get_activity_billing_rate: a Time and Material project rates each
    member off its billing team, every other billing type rates the whole project off its
    default rate, and a project with no rate at all falls back to a multiple of cost.

    Rates and hourly_cost_rate are both denominated in the project's currency, so no
    conversion happens here. Unlike the timesheet path this never throws — a missing rate
    degrades to the fallback rather than blocking a page that is only forecasting.
    """
    project_row = project_map.get(project)
    if not project_row:
        return 0.0

    billing_type = project_row.get("custom_billing_type")
    if not billing_type or billing_type == "Non-Billable":
        return 0.0

    if billing_type == "Time and Material":
        for row in context.get((project, employee), []):
            if row.valid_from and getdate(row.valid_from) <= as_on:
                return flt(row.hourly_billing_rate)

    if default_rate := flt(project_row.get("custom_default_hourly_billing_rate")):
        return default_rate

    return BILLING_RATE_COST_MULTIPLIER * flt(hourly_cost_rate)
