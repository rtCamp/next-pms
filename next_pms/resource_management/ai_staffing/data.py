import statistics
from datetime import date
from typing import Any

import frappe

from next_pms.resource_management.ai_staffing.constants import BILLABILITY_CREDITED_PROJECT_TYPES
from next_pms.utils.employee import get_employee_salary


def active_employees() -> list[dict[str, Any]]:
    return frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=[
            "name",
            "employee_name",
            "designation",
            "department",
            "resignation_letter_date",
            "relieving_date",
        ],
    )


def employee_skills() -> dict[str, list[str]]:
    """Employee -> skill names. Employee Skill Map is named after its employee."""
    skills: dict[str, set[str]] = {}
    for row in frappe.get_all(
        "Employee Skill",
        filters={"parenttype": "Employee Skill Map", "parentfield": "employee_skills"},
        fields=["parent", "skill"],
    ):
        if row.skill:
            skills.setdefault(row.parent, set()).add(row.skill)
    return {employee: sorted(names) for employee, names in skills.items()}


def approved_leave(start: date, end: date) -> list[dict[str, Any]]:
    return frappe.get_all(
        "Leave Application",
        filters={"status": "Approved", "docstatus": ["!=", 2], "from_date": ["<=", end], "to_date": [">=", start]},
        fields=["employee", "from_date", "to_date"],
    )


def allocations_overlapping(start: date, end: date, exclude_project: str) -> list[dict[str, Any]]:
    """Tentative and Confirmed both count as busy, except this deal's own project, so a
    retry doesn't see its own people as booked."""
    allocations = frappe.get_all(
        "Resource Allocation",
        filters={"allocation_start_date": ["<=", end], "allocation_end_date": [">=", start]},
        fields=["employee", "project", "allocation_start_date", "allocation_end_date", "hours_allocated_per_day"],
    )
    return [a for a in allocations if a.project != exclude_project]


def employees_on_project(project: str) -> set[str]:
    return set(frappe.get_all("Resource Allocation", filters={"project": project}, pluck="employee"))


def billability(start: date, end: date) -> dict[str, dict[str, float]]:
    """Employee -> {total_hours, billable_hours, credited_hours} from submitted timesheets.

    `credited_hours` adds hours on Growth projects, which are logged non-billable
    but count as billable for ranking.
    """
    credited_projects = set(
        frappe.get_all("Project", filters={"project_type": ["in", BILLABILITY_CREDITED_PROJECT_TYPES]}, pluck="name")
    )
    timesheet = frappe.qb.DocType("Timesheet")
    detail = frappe.qb.DocType("Timesheet Detail")
    rows = (
        frappe.qb.from_(timesheet)
        .join(detail)
        .on(detail.parent == timesheet.name)
        .select(timesheet.employee, detail.project, detail.is_billable, detail.hours)
        .where(timesheet.docstatus == 1)
        .where(timesheet.start_date.between(start, end))
        .run(as_dict=True)
    )

    totals: dict[str, dict[str, float]] = {}
    for row in rows:
        hours = float(row.hours or 0)
        if not row.employee or not hours:
            continue
        bucket = totals.setdefault(row.employee, {"total_hours": 0.0, "billable_hours": 0.0, "credited_hours": 0.0})
        bucket["total_hours"] += hours
        if row.is_billable:
            bucket["billable_hours"] += hours
            bucket["credited_hours"] += hours
        elif row.project in credited_projects:
            bucket["credited_hours"] += hours
    return totals


def blended_hourly_costs(currency: str, as_of: date) -> dict[str, float]:
    """Designation -> median hourly cost of its Active employees, in `currency`.

    The median, so one mis-entered CTC can't skew a designation, and no single
    salary can be read back from the result.
    """
    costs: dict[str, list[float]] = {}
    for employee in frappe.get_all(
        "Employee",
        filters={"status": "Active", "designation": ["is", "set"], "ctc": [">", 0], "salary_currency": ["is", "set"]},
        fields=["name", "designation", "ctc", "salary_currency"],
    ):
        hourly = get_employee_salary(
            employee.name,
            currency,
            as_of,
            throw=False,
            ctc=employee.ctc,
            salary_currency=employee.salary_currency,
        )["hourly_salary"]
        # A missing exchange rate converts the CTC to 0; leave that employee out.
        if hourly > 0:
            costs.setdefault(employee.designation, []).append(hourly)
    return {designation: statistics.median(values) for designation, values in costs.items()}


def exchange_rate(from_currency: str, to_currency: str, as_of: date) -> float | None:
    from erpnext.setup.utils import get_exchange_rate

    return get_exchange_rate(from_currency, to_currency, as_of) or None
