"""Resource-matching rules - no I/O, so they are unit-testable without a site.

Takes employee data already loaded by `data` and the parsed SOW requirements,
returns concrete employee assignments.

Confirmed business rules, ported unchanged from crm-automations PR #20:
1. Only employees with an explicit "L<N> - ..." designation are matched. The
   L-number decides the level tier: L1-L2 Junior, L3-L6 Senior, L7+ Lead.
2. Each SOW role column carries a tier ("Sr CMS Dev" -> Senior, "EM" -> Lead).
   When the exact tier can't fill it, cascade per LEVEL_TIER_CASCADE: Lead ->
   Senior (never further), Junior -> Senior, Senior -> no fallback. Roles with
   no tier (QA, PM, Designer) consider every level together.
3. A Lead-tier role (EM) only matches someone with at least
   LEAD_ROLE_MIN_FREE_HOURS_PER_DAY (2h) free, or the role's hours/day if lower.
   Leads run several projects, so 2h is enough even for a bigger role - the
   shortfall is flagged in reasoning. When no L7+ has that much free, the role
   cascades to Senior (rule #2).
4. Partial-window conflicts don't disqualify a candidate - they're allocated
   tentatively anyway, flagged in reasoning. Only a candidate with *zero* free
   capacity for the whole window is excluded.
5. No buffer is required between back-to-back projects for the same person.
6. Anyone who has resigned (on notice) is excluded, whatever the dates.
7. Approved leave only excludes someone when it covers more than
   LEAVE_EXCLUDE_ABOVE_WINDOW_SHARE (20%) of the role's working days. Shorter
   leave is ignored (and noted in reasoning); end dates are never extended for
   leave or public holidays.
8. Within one project, each employee fills at most one role - once matched to a
   role, they're excluded from every other role's candidate pool.
9. Among otherwise equally-ranked candidates, prefer the least-billable over the
   last 90 days, to spread billable opportunity and cut bench time. Hours on
   Growth projects count as billable (they are intentional internal
   initiatives), and candidates with no logged hours are treated as neutral
   rather than as fully benched - see _billability_ratio.
10. A role is only staffed from its designation family's departments
   (DEPARTMENTS_BY_DESIGNATION_FAMILY) - e.g. a WordPress-skilled engineer in
   Systems isn't a CMS engineer. Anyone with no department stays eligible,
   flagged in reasoning, since department data is often incomplete.
"""

import re
from dataclasses import replace
from datetime import date, timedelta
from typing import Any, NamedTuple

from frappe.utils import getdate

from next_pms.resource_management.ai_staffing.constants import (
    BILLABILITY_LOOKBACK_DAYS,
    BILLABILITY_NEUTRAL_RATIO,
    BILLABILITY_PRIORITISED_BELOW_RATIO,
    DEPARTMENTS_BY_DESIGNATION_FAMILY,
    DESIGNATION_FAMILY_ALIASES,
    LEAD_ROLE_MIN_FREE_HOURS_PER_DAY,
    LEAVE_EXCLUDE_ABOVE_WINDOW_SHARE,
    LEVEL_TIER_CASCADE,
    LEVEL_TIER_JUNIOR,
    LEVEL_TIER_JUNIOR_MAX_L_NUMBER,
    LEVEL_TIER_LEAD,
    LEVEL_TIER_LEAD_MIN_L_NUMBER,
    LEVEL_TIER_SENIOR,
    STANDARD_WORKDAY_HOURS,
)
from next_pms.resource_management.ai_staffing.types import MatchedAllocation, ProjectStaffingRequirement

# The "L<N> - ..." level prefix of a designation, e.g. "L5 - Senior Software
# Engineer".
_L_NUMBER_PATTERN = re.compile(r"^L(\d+)\b")


def _l_number(designation: str | None) -> int | None:
    """The designation's L-number, or None when it has no "L<N> - " prefix."""
    if not designation:
        return None
    l_number_match = _L_NUMBER_PATTERN.match(designation.strip())
    return int(l_number_match.group(1)) if l_number_match else None


def _tier_for_l_number(l_number: int) -> str:
    """Rule #1: L1-L2 Junior, L3-L6 Senior, L7+ Lead (L7 Staff, L8 Principal)."""
    if l_number >= LEVEL_TIER_LEAD_MIN_L_NUMBER:
        return LEVEL_TIER_LEAD
    if l_number > LEVEL_TIER_JUNIOR_MAX_L_NUMBER:
        return LEVEL_TIER_SENIOR
    return LEVEL_TIER_JUNIOR


def _designation_matches_family(designation: str | None, family: str) -> bool:
    """Checks whether an Employee's designation belongs to a role's designation family.

    Substring match against the family or any of its DESIGNATION_FAMILY_ALIASES
    (e.g. "L7 - Staff Engineer" is a Software Engineer). Real employee data
    includes rows with no designation set at all, which never match any family.
    """
    if not designation:
        return False
    d = designation.casefold()
    names = [family, *DESIGNATION_FAMILY_ALIASES.get(family, [])]
    return any(name.casefold() in d for name in names)


def _dates_overlap(a_start: date, a_end: date, b_start: date | str | None, b_end: date | str | None) -> bool:
    if not b_start or not b_end:
        return False
    return getdate(b_start) <= a_end and getdate(b_end) >= a_start


def _in_allowed_department(employee: dict[str, Any], family: str) -> bool:
    """Rule #10: in one of the family's departments, or in no department at all.

    Department names carry a company suffix ("Engineering - RTIN"), so only the
    part before the last " - " is compared. A family with no departments listed
    isn't restricted.
    """
    allowed = DEPARTMENTS_BY_DESIGNATION_FAMILY.get(family)
    department = employee.get("department")
    if not allowed or not department:
        return True
    base = str(department).rsplit(" - ", 1)[0].strip().casefold()
    return base in {d.casefold() for d in allowed}


def _has_resigned(employee: dict[str, Any]) -> bool:
    """Rule #6: hard-exclude anyone serving notice or with a leaving date.

    ERPNext keeps a resigned employee Active until they leave, marking the
    resignation with resignation_letter_date and, once HR sets it, relieving_date.
    Either one excludes them, regardless of how it falls against the project
    window. (notice_number_of_days is the contractual notice length every
    employee has, not a sign of serving notice.)
    """
    return bool(employee.get("resignation_letter_date") or employee.get("relieving_date"))


def _available_hours_per_day(
    employee_name: str,
    requirement: ProjectStaffingRequirement,
    existing_allocations: list[dict[str, Any]],
) -> float:
    """Free hours/day for this requirement's window, after existing bookings.

    Standard workday minus hours already booked by any existing Resource
    Allocation overlapping the window. Tentative or Confirmed both count as busy
    - a Tentative hold is still a real soft commitment.
    """
    busy_hours = sum(
        float(a.get("hours_allocated_per_day") or 0)
        for a in existing_allocations
        if a.get("employee") == employee_name
        and _dates_overlap(
            requirement.start_date,
            requirement.end_date,
            a.get("allocation_start_date"),
            a.get("allocation_end_date"),
        )
    )
    return max(STANDARD_WORKDAY_HOURS - busy_hours, 0.0)


def _working_days(start: date, end: date) -> set[date]:
    """Mon-Fri dates in [start, end]; public holidays aren't considered."""
    return {
        start + timedelta(days=i) for i in range((end - start).days + 1) if (start + timedelta(days=i)).weekday() < 5
    }


def _leave_days_in_window(
    employee_name: str,
    requirement: ProjectStaffingRequirement,
    leave_applications: list[dict[str, Any]],
) -> int:
    """Working days of approved leave inside the requirement's window.

    Leave before the project starts or after it ends doesn't count, and
    overlapping applications aren't double-counted.
    """
    days: set[date] = set()
    for leave in leave_applications:
        if leave.get("employee") != employee_name:
            continue
        if not _dates_overlap(
            requirement.start_date,
            requirement.end_date,
            leave.get("from_date"),
            leave.get("to_date"),
        ):
            continue
        days |= _working_days(
            max(getdate(leave["from_date"]), requirement.start_date),
            min(getdate(leave["to_date"]), requirement.end_date),
        )
    return len(days)


def _on_long_leave_during_window(
    employee_name: str,
    requirement: ProjectStaffingRequirement,
    leave_applications: list[dict[str, Any]],
) -> bool:
    """Rule #7: excludes only when leave covers a large share of the window.

    Above LEAVE_EXCLUDE_ABOVE_WINDOW_SHARE of the role's working days the person
    is effectively away from the project; anything shorter doesn't change the
    plan, so they stay eligible (and the leave is noted in the reasoning). The
    end date is never extended for leave or holidays.
    """
    window_days = len(_working_days(requirement.start_date, requirement.end_date))
    if not window_days:
        return False
    leave_days = _leave_days_in_window(employee_name, requirement, leave_applications)
    return leave_days / window_days > LEAVE_EXCLUDE_ABOVE_WINDOW_SHARE


def _eligible_candidates(
    requirement: ProjectStaffingRequirement,
    employees: list[dict[str, Any]],
    tier_filter: str | None,
    leave_applications: list[dict[str, Any]],
    excluded_employees: set[str],
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for e in employees:
        l_number = _l_number(e["designation"])
        if (
            l_number is not None
            and (tier_filter is None or _tier_for_l_number(l_number) == tier_filter)
            and e["name"] not in excluded_employees
            and _designation_matches_family(e["designation"], requirement.designation_family)
            and _in_allowed_department(e, requirement.designation_family)
            and not _has_resigned(e)
            and not _on_long_leave_during_window(e["name"], requirement, leave_applications)
        ):
            candidates.append(e)
    return candidates


def _billability_ratio(employee_name: str, billability: dict[str, dict[str, float]]) -> float:
    """Share of recent logged hours that counted as billable (rule #9). Lower sorts first.

    Uses `credited_hours` (real billable hours plus Growth-project hours) over total
    logged hours, rather than raw billable hours. A ratio normalises away how much
    each person logged: someone who logged 480h with none billable is genuinely on
    the bench, while someone who logged nothing is simply unmeasured. The latter
    gets BILLABILITY_NEUTRAL_RATIO so missing timesheet data cannot masquerade as
    bench time and pull new joiners onto every project.
    """
    totals = billability.get(employee_name)
    if not totals:
        return BILLABILITY_NEUTRAL_RATIO
    total_hours = totals.get("total_hours", 0.0)
    if total_hours <= 0:
        return BILLABILITY_NEUTRAL_RATIO
    return totals.get("credited_hours", 0.0) / total_hours


class _ScoredCandidate(NamedTuple):
    employee: dict[str, Any]
    l_number: int
    available_hours: float
    skill_match_count: int
    billability_ratio: float


def _select_across_senior_band(
    scored: list[_ScoredCandidate], needed: int
) -> tuple[list[_ScoredCandidate], list[str | None]]:
    """Picks multiple Senior-tier engineers alternately from both ends of L3-L6.

    The first pick prefers the top of the band (L6 -> L3), the second the bottom
    (L3 -> L6), and so on, so a multi-senior team mixes experience rather than
    stacking the highest L-numbers. Within one L-number, `scored`'s existing order
    (skill match, then billability, then availability) decides.

    Returns the picks and, per pick, a reasoning note.
    """
    remaining = list(scored)
    selected: list[_ScoredCandidate] = []
    notes: list[str | None] = []
    for pick_index in range(min(needed, len(remaining))):
        from_top = pick_index % 2 == 0
        sign = -1 if from_top else 1
        # Highest (or lowest) L-number; ties keep `scored`'s ranking order.
        _, best = min((sign * candidate.l_number, position) for position, candidate in enumerate(remaining))
        selected.append(remaining.pop(best))
        direction = "L6 -> L3" if from_top else "L3 -> L6"
        notes.append(f"Senior pick {pick_index + 1} of {needed} ({direction})")
    return selected, notes


def _selection_reasoning(
    requirement: ProjectStaffingRequirement,
    candidate: _ScoredCandidate,
    band_note: str | None,
    employee_skills: dict[str, list[str]],
    billability: dict[str, dict[str, float]],
    leave_applications: list[dict[str, Any]],
) -> list[str]:
    """Short lines for the PM: the fit, then anything notable, then any overbooking.

    Line 1 is always there: designation (and any tier cascade), free hours and
    matched skills. Line 2 only appears when something is worth a look -
    Senior-band pick, recent billability, leave in the window. A "⚠ Overbooked"
    line follows when the person has fewer free hours than the role needs, since
    skill outranks availability and overbooking is left to the reviewer. Only the
    picked employee's own data is mentioned, since employees can read allocations.
    """
    employee = candidate.employee
    name = employee["name"]
    needed = requirement.hours_per_day_per_individual

    fit = [employee["designation"]]
    employee_tier = _tier_for_l_number(candidate.l_number)
    if requirement.level_tier and employee_tier != requirement.level_tier:
        fit[0] += f" (cascaded from {requirement.level_tier} to {employee_tier})"
    fit.append(f"{candidate.available_hours:.1f}h/day free")
    matched = sorted(set(employee_skills.get(name, [])) & set(requirement.preferred_skills))
    if matched:
        fit.append(f"skills: {', '.join(matched)}")

    notes: list[str] = []
    if not employee.get("department"):
        notes.append("no department on record - check practice")
    if band_note:
        notes.append(band_note)
    totals = billability.get(name)
    if totals and totals.get("total_hours", 0.0) > 0:
        growth = totals.get("credited_hours", 0.0) - totals.get("billable_hours", 0.0)
        notes.append(
            f"{candidate.billability_ratio * 100:.0f}% billable in last "
            f"{BILLABILITY_LOOKBACK_DAYS} days"
            + (" incl. Growth" if growth > 0 else "")
            + (" (prioritised)" if candidate.billability_ratio < BILLABILITY_PRIORITISED_BELOW_RATIO else "")
        )
    leave_days = _leave_days_in_window(name, requirement, leave_applications)
    if leave_days:
        notes.append(f"leave on {leave_days} working day(s)")

    reasoning = ["; ".join(fit)]
    if notes:
        reasoning.append("; ".join(notes))
    if candidate.available_hours < needed:
        reasoning.append(
            f"⚠ Overbooked: only {candidate.available_hours:.1f}h/day free of "
            f"{needed:.1f}h needed - review before confirming"
        )
    return reasoning


def _rank_and_select(
    requirement: ProjectStaffingRequirement,
    candidates: list[dict[str, Any]],
    employee_skills: dict[str, list[str]],
    existing_allocations: list[dict[str, Any]],
    min_hours_per_day: float,
    billability: dict[str, dict[str, float]],
    leave_applications: list[dict[str, Any]],
) -> list[MatchedAllocation]:
    """Scores and selects up to `team_members_needed` candidates, with reasoning.

    Ranked by skill match, then least recently billable (rule #9), then most
    available. Billability sits
    below skill match deliberately: it breaks ties between comparably-qualified
    candidates rather than overriding project fit. Anyone with zero free capacity
    for the whole window is filtered out entirely (rule #4).
    """
    scored: list[_ScoredCandidate] = []
    for employee in candidates:
        available = _available_hours_per_day(employee["name"], requirement, existing_allocations)
        if available <= 0:
            continue  # fully booked for the whole window - not a viable match at all
        if available < min_hours_per_day:
            continue
        skill_match_count = len(set(employee_skills.get(employee["name"], [])) & set(requirement.preferred_skills))
        l_number = _l_number(employee["designation"])
        assert l_number is not None  # _eligible_candidates only passes leveled ones
        scored.append(
            _ScoredCandidate(
                employee=employee,
                l_number=l_number,
                available_hours=available,
                skill_match_count=skill_match_count,
                billability_ratio=_billability_ratio(employee["name"], billability),
            )
        )

    # Skill match, then least-billable, then most available. Billability ascends
    # (least billable wins); the rest descend.
    scored.sort(key=lambda c: (-c.skill_match_count, c.billability_ratio, -c.available_hours))

    if requirement.level_tier == LEVEL_TIER_SENIOR and requirement.team_members_needed > 1:
        selected, band_notes = _select_across_senior_band(scored, requirement.team_members_needed)
    else:
        selected = scored[: requirement.team_members_needed]
        band_notes = [None] * len(selected)

    results: list[MatchedAllocation] = []
    for candidate, band_note in zip(selected, band_notes, strict=True):
        employee = candidate.employee
        reasoning = _selection_reasoning(
            requirement,
            candidate,
            band_note,
            employee_skills,
            billability,
            leave_applications,
        )
        results.append(
            MatchedAllocation(
                role_label=requirement.role_label,
                employee=employee["name"],
                employee_name=employee.get("employee_name") or employee["name"],
                designation=employee["designation"],
                hours_per_day=requirement.hours_per_day_per_individual,
                start_date=requirement.start_date,
                end_date=requirement.end_date,
                reasoning=reasoning,
            )
        )
    return results


def match_requirement(
    requirement: ProjectStaffingRequirement,
    employees: list[dict[str, Any]],
    employee_skills: dict[str, list[str]],
    existing_allocations: list[dict[str, Any]],
    leave_applications: list[dict[str, Any]],
    excluded_employees: set[str],
    billability: dict[str, dict[str, float]],
) -> list[MatchedAllocation]:
    """Matches one staffing requirement against employee data.

    `excluded_employees` (rule #8) removes anyone already matched to a different
    role in this same project - one employee fills at most one role per project.

    For a role with a level tier, walks LEVEL_TIER_CASCADE (rule #2) until enough
    candidates are found; Lead-tier roles need LEAD_ROLE_MIN_FREE_HOURS_PER_DAY
    free (rule #3). A role with no tier (QA, PM, Designer) considers all matching-family
    employees together in a single pass.
    """
    tiers: tuple[str | None, ...] = LEVEL_TIER_CASCADE[requirement.level_tier] if requirement.level_tier else (None,)
    min_hours_per_day = (
        min(requirement.hours_per_day_per_individual, LEAD_ROLE_MIN_FREE_HOURS_PER_DAY)
        if requirement.is_lead_role
        else 0.0
    )
    matches: list[MatchedAllocation] = []
    for tier in tiers:
        if len(matches) >= requirement.team_members_needed:
            break
        already_selected = {m.employee for m in matches} | excluded_employees
        candidates = _eligible_candidates(requirement, employees, tier, leave_applications, already_selected)
        remaining_needed = requirement.team_members_needed - len(matches)
        matches.extend(
            _rank_and_select(
                replace(requirement, team_members_needed=remaining_needed),
                candidates,
                employee_skills,
                existing_allocations,
                min_hours_per_day,
                billability,
                leave_applications,
            )
        )
    return matches


def match_all_requirements(
    requirements: list[ProjectStaffingRequirement],
    employees: list[dict[str, Any]],
    employee_skills: dict[str, list[str]],
    existing_allocations: list[dict[str, Any]],
    leave_applications: list[dict[str, Any]],
    billability: dict[str, dict[str, float]] | None = None,
) -> list[MatchedAllocation]:
    """Matches every staffing requirement, returning the combined list of assignments.

    Requirements are matched in order against a running list of allocations that
    starts as `existing_allocations` (what is already booked) and grows
    with each match made *in this run*, and a running set of employees already
    matched to an earlier role in this project (rule #8: one employee, one role
    per project). Without the allocations tracking, a person selected for one
    role's full hours/day would look just as free for every later role in the same
    run - existing_allocations alone can't reflect commitments this run itself is
    making - and the same person could be stacked across multiple roles well past a
    real workday.
    """
    running_allocations = list(existing_allocations)
    assigned_employees: set[str] = set()
    all_matches: list[MatchedAllocation] = []
    for requirement in requirements:
        matches = match_requirement(
            requirement,
            employees,
            employee_skills,
            running_allocations,
            leave_applications,
            assigned_employees,
            billability or {},
        )
        for match in matches:
            running_allocations.append(
                {
                    "employee": match.employee,
                    "allocation_start_date": match.start_date,
                    "allocation_end_date": match.end_date,
                    "hours_allocated_per_day": match.hours_per_day,
                }
            )
            assigned_employees.add(match.employee)
        all_matches.extend(matches)
    return all_matches
