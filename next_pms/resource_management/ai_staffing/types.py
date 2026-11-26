from dataclasses import dataclass
from datetime import date


@dataclass
class ProjectStaffingRequirement:
    """One role column of the SOW sheet's team-composition breakdown."""

    role_label: str
    designation_family: str
    # LEVEL_TIER_* from the role column (e.g. "Sr CMS Dev" -> Senior), or None when
    # the role has no level target (QA, PM, Designer).
    level_tier: str | None
    preferred_skills: list[str]
    is_lead_role: bool
    team_members_needed: int
    hours_per_day_per_individual: float
    start_date: date
    end_date: date


@dataclass
class SowEstimate:
    """What the staffing pipeline reads from a deal's SOW sheet."""

    requirements: list[ProjectStaffingRequirement]
    # The tab's "PROJECT TOTAL HOURS", or None when the row is missing or blank.
    total_hours: float | None
    # The sales tab's TOTAL cost / TOTAL hours, in sales_currency; None without one.
    sales_hourly_rate: float | None = None
    sales_currency: str | None = None


@dataclass
class MatchedAllocation:
    """An employee the matching rules chose for one staffing requirement."""

    role_label: str
    employee: str
    employee_name: str
    designation: str
    hours_per_day: float
    start_date: date
    end_date: date
    reasoning: list[str]
    # Salary-derived, so it only goes into the leadership-only request summary,
    # never into the allocation's reason.
    margin_note: str | None = None
