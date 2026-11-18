"""Tests for the staffing matching rules in ai_staffing.matching."""

from datetime import date
from typing import Any

from frappe.tests import UnitTestCase

from next_pms.resource_management.ai_staffing.constants import LEVEL_TIER_JUNIOR, LEVEL_TIER_LEAD, LEVEL_TIER_SENIOR
from next_pms.resource_management.ai_staffing.matching import match_all_requirements
from next_pms.resource_management.ai_staffing.types import ProjectStaffingRequirement

START = date(2026, 11, 2)
END = date(2026, 12, 31)


def _department_for(designation: str | None) -> str:
    """The department a designation is normally staffed from."""
    title = designation or ""
    if "Quality" in title or "QA" in title:
        return "Quality Engineering - RTIN"
    if "Designer" in title:
        return "Design - RTIN"
    if "Project Manager" in title:
        return "Project Management - RTIN"
    return "Engineering - RTIN"


def employee(name: str, designation: str | None, **extra: Any) -> dict[str, Any]:
    """An Active employee, in their designation's usual department unless given."""
    return {
        "name": name,
        "employee_name": name,
        "designation": designation,
        "department": _department_for(designation),
        **extra,
    }


def requirement(
    role_label: str = "Sr CMS Dev",
    family: str = "Software Engineer",
    tier: str | None = LEVEL_TIER_SENIOR,
    needed: int = 1,
    hours: float = 8.0,
    skills: list[str] | None = None,
) -> ProjectStaffingRequirement:
    return ProjectStaffingRequirement(
        role_label=role_label,
        designation_family=family,
        level_tier=tier,
        preferred_skills=skills or [],
        is_lead_role=tier == LEVEL_TIER_LEAD,
        team_members_needed=needed,
        hours_per_day_per_individual=hours,
        start_date=START,
        end_date=END,
    )


def booking(name: str, hours: float, project: str = "PROJ-X") -> dict[str, Any]:
    return {
        "employee": name,
        "project": project,
        "allocation_start_date": START.isoformat(),
        "allocation_end_date": END.isoformat(),
        "hours_allocated_per_day": hours,
    }


def match(
    requirements: list[ProjectStaffingRequirement],
    employees: list[dict[str, Any]],
    *,
    skills: dict[str, list[str]] | None = None,
    allocations: list[dict[str, Any]] | None = None,
    leave: list[dict[str, Any]] | None = None,
    billability: dict[str, dict[str, float]] | None = None,
) -> list[tuple[str, str]]:
    """Returns (role_label, employee) per match, in match order."""
    matches = match_all_requirements(
        requirements,
        employees,
        skills or {},
        allocations or [],
        leave or [],
        billability or {},
    )
    return [(m.role_label, m.employee) for m in matches]


def billed(credited: float, total: float = 100.0) -> dict[str, float]:
    return {
        "total_hours": total,
        "billable_hours": credited,
        "credited_hours": credited,
    }


def reasons(
    requirements: list[ProjectStaffingRequirement],
    employees: list[dict[str, Any]],
    **data: Any,
) -> dict[str, list[str]]:
    """Returns employee -> reasoning lines, for the matches made."""
    matches = match_all_requirements(
        requirements,
        employees,
        data.get("skills", {}),
        data.get("allocations", []),
        data.get("leave", []),
        data.get("billability", {}),
    )
    return {m.employee: m.reasoning for m in matches}


def leave_for(name: str, *spans: tuple[str, str]) -> list[dict[str, Any]]:
    return [{"employee": name, "from_date": f, "to_date": t} for f, t in spans]


class TestMatching(UnitTestCase):
    def test_only_l_levelled_employees_are_matched(self) -> None:
        employees = [
            employee("legacy", "Senior Software Engineer"),
            employee("none", None),
            employee("l4", "L4 - Senior Software Engineer"),
        ]
        assert match([requirement(needed=3)], employees) == [("Sr CMS Dev", "l4")]

    def test_designation_family_aliases(self) -> None:
        employees = [
            employee("growth", "L4 - Growth Engineer"),
            employee("staff", "L7 - Staff Engineer"),
            employee("designer", "L4 - Designer"),
        ]
        assert match([requirement(needed=3)], employees) == [("Sr CMS Dev", "growth")]
        assert match([requirement("EM", tier=LEVEL_TIER_LEAD, hours=4)], employees) == [("EM", "staff")]

    def test_qa_role_matches_quality_engineer_title(self) -> None:
        employees = [
            employee("old", "L2 - QA Engineer"),
            employee("qe", "L2 - Quality Engineer"),
        ]
        qa = requirement("QA Engineer", family="Quality Engineer", tier=None)
        assert match([qa], employees) == [("QA Engineer", "qe")]

    def test_only_the_roles_departments_are_staffed_from(self) -> None:
        # A WordPress engineer in Systems isn't a CMS engineer, whatever the skill.
        employees = [
            employee("systems", "L4 - Senior Software Engineer", department="Systems - RTIN"),
            employee("frappe", "L5 - Senior Software Engineer", department="Frappe - RTIN"),
            employee("us", "L3 - Senior Software Engineer", department="Engineering - RTUS"),
        ]
        skills = {"systems": ["WordPress"], "frappe": ["WordPress"]}
        assert match([requirement(needed=3, skills=["WordPress"])], employees, skills=skills) == [("Sr CMS Dev", "us")]

    def test_qa_is_staffed_from_quality_and_e2e_quality(self) -> None:
        employees = [
            employee("qe", "L2 - Quality Engineer", department="Quality Engineering - RTIN"),
            employee("e2e", "L3 - Quality Engineer", department="E2E Quality - RTIN"),
            employee("eng", "L4 - Quality Engineer", department="Engineering - RTIN"),
        ]
        qa = requirement("QA Engineer", family="Quality Engineer", tier=None, needed=3)
        assert sorted(e for _, e in match([qa], employees)) == ["e2e", "qe"]

    def test_no_department_stays_eligible_but_is_flagged(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer", department=None)]
        assert reasons([requirement()], employees)["l4"] == [
            "L4 - Senior Software Engineer; 8.0h/day free",
            "no department on record - check practice",
        ]

    def test_resigned_employees_are_excluded(self) -> None:
        employees = [
            employee(
                "resigned",
                "L4 - Senior Software Engineer",
                resignation_letter_date="2026-09-01",
            ),
            employee("leaving", "L5 - Senior Software Engineer", relieving_date="2027-06-01"),
            employee("staying", "L3 - Senior Software Engineer"),
        ]
        assert match([requirement(needed=3)], employees) == [("Sr CMS Dev", "staying")]

    def test_leave_excludes_only_when_it_covers_much_of_the_window(self) -> None:
        # START..END (2026-11-02..2026-12-31) has 44 working days; 20% is 8.8
        employees = [
            employee("long", "L4 - Senior Software Engineer"),
            employee("short", "L5 - Senior Software Engineer"),
            employee("before", "L6 - Senior Software Engineer"),
        ]
        leave = [
            # 10 working days -> excluded
            {"employee": "long", "from_date": "2026-12-07", "to_date": "2026-12-18"},
            # 4 working days (Tue-Sat) -> still eligible, noted
            {"employee": "short", "from_date": "2026-12-01", "to_date": "2026-12-05"},
            # Entirely before the window -> doesn't count
            {"employee": "before", "from_date": "2026-10-01", "to_date": "2026-11-01"},
        ]
        matches = match_all_requirements([requirement(needed=3)], employees, {}, [], leave, {})
        assert sorted(m.employee for m in matches) == ["before", "short"]
        short = next(m for m in matches if m.employee == "short")
        assert any("leave on 4 working day(s)" in r for r in short.reasoning)

    def test_fully_booked_employees_are_excluded_but_partial_ones_are_flagged(self) -> None:
        employees = [
            employee("full", "L4 - Senior Software Engineer"),
            employee("partial", "L5 - Senior Software Engineer"),
        ]
        allocations = [booking("full", 8), booking("partial", 5)]
        matches = match_all_requirements([requirement(needed=2)], employees, {}, allocations, [], {})
        assert [m.employee for m in matches] == ["partial"]
        reasoning = matches[0].reasoning
        assert reasoning[0] == "L5 - Senior Software Engineer; 3.0h/day free"
        assert reasoning[-1] == ("⚠ Overbooked: only 3.0h/day free of 8.0h needed - review before confirming")

    def test_lead_needs_two_hours_free_then_cascades_to_senior(self) -> None:
        employees = [
            employee("l7", "L7 - Staff Engineer"),
            employee("l6", "L6 - Senior Software Engineer"),
            employee("l2", "L2 - Software Engineer"),
        ]

        # 2h free is enough even for a 4h/day role; the shortfall is flagged
        matches = match_all_requirements(
            [requirement("EM", tier=LEVEL_TIER_LEAD, hours=4)],
            employees,
            {},
            [booking("l7", 6)],
            [],
            {},
        )
        assert [m.employee for m in matches] == ["l7"]
        assert any(r.startswith("⚠ Overbooked: only 2.0h/day free of 4.0h needed") for r in matches[0].reasoning)

        # Under 2h free cascades to Senior
        matches = match_all_requirements(
            [requirement("EM", tier=LEVEL_TIER_LEAD, hours=4)],
            employees,
            {},
            [booking("l7", 7)],
            [],
            {},
        )
        assert [m.employee for m in matches] == ["l6"]
        assert any("cascaded from Lead to Senior" in r for r in matches[0].reasoning)

        # A role needing under 2h/day only needs its own hours free
        assert match(
            [requirement("EM", tier=LEVEL_TIER_LEAD, hours=1)],
            employees,
            allocations=[booking("l7", 7)],
        ) == [("EM", "l7")]

    def test_lead_never_cascades_to_junior(self) -> None:
        employees = [employee("l2", "L2 - Software Engineer")]
        assert match([requirement("EM", tier=LEVEL_TIER_LEAD, hours=4)], employees) == []

    def test_junior_falls_back_to_senior_but_senior_never_to_junior(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        assert match([requirement("Jr CMS Dev", tier=LEVEL_TIER_JUNIOR)], employees) == [("Jr CMS Dev", "l4")]
        juniors = [employee("l2", "L2 - Software Engineer")]
        assert match([requirement()], juniors) == []

    def test_an_employee_fills_at_most_one_role_per_project(self) -> None:
        employees = [
            employee("a", "L4 - Senior Software Engineer"),
            employee("b", "L5 - Senior Software Engineer"),
        ]
        roles = [requirement("Sr CMS Dev", hours=2), requirement("Sr FE Dev", hours=2)]
        result = match(roles, employees)
        assert len(result) == 2
        assert {e for _, e in result} == {"a", "b"}

    def test_skill_match_ranks_above_billability(self) -> None:
        employees = [
            employee("skilled", "L4 - Senior Software Engineer"),
            employee("benched", "L4 - Senior Software Engineer"),
        ]
        result = match(
            [requirement(skills=["WordPress"])],
            employees,
            skills={"skilled": ["WordPress"]},
            billability={"skilled": billed(100), "benched": billed(0)},
        )
        assert result == [("Sr CMS Dev", "skilled")]

    def test_least_billable_wins_among_equally_skilled(self) -> None:
        employees = [
            employee("busy", "L2 - Software Engineer"),
            employee("benched", "L2 - Software Engineer"),
        ]
        result = match(
            [requirement("Jr CMS Dev", tier=LEVEL_TIER_JUNIOR)],
            employees,
            billability={"busy": billed(90), "benched": billed(10)},
        )
        assert result == [("Jr CMS Dev", "benched")]

    def test_growth_hours_count_as_billable(self) -> None:
        employees = [
            employee("growth", "L2 - Growth Engineer"),
            employee("client", "L2 - Software Engineer"),
        ]
        billability = {
            # 100h all on Growth projects: logged non-billable, credited as billable.
            "growth": {
                "total_hours": 100.0,
                "billable_hours": 0.0,
                "credited_hours": 100.0,
            },
            "client": billed(60),
        }
        result = match(
            [requirement("Jr CMS Dev", tier=LEVEL_TIER_JUNIOR)],
            employees,
            billability=billability,
        )
        assert result == [("Jr CMS Dev", "client")]

    def test_no_logged_hours_counts_as_neutral_not_benched(self) -> None:
        employees = [
            employee("new", "L2 - Software Engineer"),
            employee("low", "L2 - Software Engineer"),
        ]
        result = match(
            [requirement("Jr CMS Dev", tier=LEVEL_TIER_JUNIOR)],
            employees,
            billability={"low": billed(40)},
        )
        assert result == [("Jr CMS Dev", "low")]

    def test_multiple_seniors_alternate_ends_of_the_band(self) -> None:
        employees = [
            employee(name, f"L{n} - Senior Software Engineer")
            for name, n in [("l3", 3), ("l4", 4), ("l5", 5), ("l6", 6)]
        ]
        result = match([requirement(needed=3, hours=2)], employees)
        assert [e for _, e in result] == ["l6", "l3", "l5"]

    def test_a_plain_match_is_one_line(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        assert reasons([requirement()], employees) == {"l4": ["L4 - Senior Software Engineer; 8.0h/day free"]}

    def test_remark_lists_matched_skills_only(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        skills = {"l4": ["WordPress", "Python"]}
        assert reasons([requirement(skills=["WordPress", "React"])], employees, skills=skills) == {
            "l4": ["L4 - Senior Software Engineer; 8.0h/day free; skills: WordPress"]
        }

    def test_remark_second_line_holds_billability_and_leave(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        billability = {"l4": {"total_hours": 100.0, "billable_hours": 20.0, "credited_hours": 30.0}}
        leave = [{"employee": "l4", "from_date": "2026-12-01", "to_date": "2026-12-02"}]
        assert reasons([requirement()], employees, billability=billability, leave=leave)["l4"] == [
            "L4 - Senior Software Engineer; 8.0h/day free",
            ("30% billable in last 90 days incl. Growth (prioritised); leave on 2 working day(s)"),
        ]

    def test_remark_skips_prioritised_for_highly_billable_people(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        [_, notes] = reasons([requirement()], employees, billability={"l4": billed(90)})["l4"]
        assert notes == "90% billable in last 90 days"

    def test_remark_never_mentions_other_candidates(self) -> None:
        # Employees can read allocations, so one person's remark must not expose
        # another's name or billability.
        employees = [
            employee("picked", "L4 - Senior Software Engineer"),
            employee("other", "L5 - Senior Software Engineer"),
        ]
        billability = {"picked": billed(10), "other": billed(80)}
        lines = reasons([requirement()], employees, billability=billability)["picked"]
        assert not any("other" in line or "80%" in line for line in lines)

    def test_remark_notes_cascade_and_senior_band_pick(self) -> None:
        employees = [
            employee("l6", "L6 - Senior Software Engineer"),
            employee("l3", "L3 - Senior Software Engineer"),
        ]
        result = reasons([requirement("EM", tier=LEVEL_TIER_LEAD, hours=4)], employees)
        [cascaded] = result.values()
        assert "(cascaded from Lead to Senior)" in cascaded[0]

        result = reasons([requirement(needed=2)], employees)
        assert result["l6"][1] == "Senior pick 1 of 2 (L6 -> L3)"
        assert result["l3"][1] == "Senior pick 2 of 2 (L3 -> L6)"

    def test_leave_counts_only_days_inside_the_window(self) -> None:
        # 2026-10-26..2026-11-06: only the 5 weekdays from 2 Nov fall in the window.
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        leave = leave_for("l4", ("2026-10-26", "2026-11-06"))
        assert "leave on 5 working day(s)" in reasons([requirement()], employees, leave=leave)["l4"][1]

    def test_overlapping_leave_applications_are_not_double_counted(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        leave = leave_for("l4", ("2026-12-07", "2026-12-09"), ("2026-12-08", "2026-12-10"))
        assert "leave on 4 working day(s)" in reasons([requirement()], employees, leave=leave)["l4"][1]

    def test_weekend_leave_does_not_count(self) -> None:
        employees = [employee("l4", "L4 - Senior Software Engineer")]
        leave = leave_for("l4", ("2026-12-05", "2026-12-06"))
        assert reasons([requirement()], employees, leave=leave)["l4"] == [
            "L4 - Senior Software Engineer; 8.0h/day free"
        ]

    def test_leave_threshold_boundary(self) -> None:
        # 44 working days in the window, so 20% is 8.8: 8 days stays, 9 excludes.
        employees = [
            employee("eight", "L4 - Senior Software Engineer"),
            employee("nine", "L5 - Senior Software Engineer"),
        ]
        leave = leave_for("eight", ("2026-12-01", "2026-12-10")) + leave_for("nine", ("2026-12-01", "2026-12-11"))
        assert sorted(reasons([requirement(needed=2)], employees, leave=leave)) == ["eight"]
