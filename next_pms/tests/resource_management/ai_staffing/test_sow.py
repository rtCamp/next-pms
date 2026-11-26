"""Tests for parsing the SOW "Delivery-Comprehensive Estimate" tab."""

from datetime import date

import frappe
from frappe.tests import UnitTestCase

from next_pms.resource_management.ai_staffing.constants import LEVEL_TIER_LEAD, LEVEL_TIER_SENIOR
from next_pms.resource_management.ai_staffing.sow import (
    _parse_requirements,
    _parse_sales_rate,
    _parse_timeline,
    _parse_total_hours,
    extract_sheet_id,
)


def sheet(
    *,
    roles: list[str],
    hours: list[str],
    members: list[str],
    weeks: list[str] | None = None,
    start: str = "9/1/2026",
    launch: str = "11/9/2026",
) -> list[list[str]]:
    """Builds tab rows in the template's layout: labels in column A, values after."""
    rows = [
        ["Task", *roles],
        ["Hours Per Day Per Individual", *hours],
        ["Number of Team Members", *members],
        ["Start Date", "", start],
        ["Launch Date", "", launch],
    ]
    if weeks is not None:
        rows.append(["Focus Delivery Weeks", *weeks])
    return rows


# The template's Sales-Timeline tab: 14 weeks in all, discovery included.
TIMELINE_ROWS = [
    ["Tasks (Y Axis)", "Start week", "Duration in weeks"],
    ["Discovery", "0", "4"],
    ["Design", "0", "4"],
    ["Front End Development", "4", "4"],
    ["CMS Feature Development", "4", "3"],
    ["Content Migration", "5", "4"],
    ["Internal UAT", "9", "2"],
    ["Client UAT & Training", "11", "2"],
    ["Launch ", "13", "1"],
]


SALES_HEADER = ["Component", "", "Hours", "Cost (USD)", "Total Cost (USD)"]


class TestSowParser(UnitTestCase):
    def test_maps_known_role_columns_and_skips_the_rest(self) -> None:
        rows = sheet(
            roles=["Sr CMS Dev", "Trainee + EM Support Adjs", "EM", "", "QA Engineer"],
            hours=["4", "2", "3", "", "2"],
            members=["2", "1", "1", "", "1"],
        )
        requirements = _parse_requirements(rows)

        assert [r.role_label for r in requirements] == ["Sr CMS Dev", "EM", "QA Engineer"]
        sr, em, qa = requirements
        assert (sr.designation_family, sr.level_tier, sr.team_members_needed) == (
            "Software Engineer",
            LEVEL_TIER_SENIOR,
            2,
        )
        assert (em.level_tier, em.is_lead_role, em.hours_per_day_per_individual) == (
            LEVEL_TIER_LEAD,
            True,
            3.0,
        )
        assert (qa.designation_family, qa.level_tier) == ("Quality Engineer", None)

    def test_skips_roles_with_no_people_or_hours(self) -> None:
        rows = sheet(roles=["Sr CMS Dev", "Designer"], hours=["4", "0"], members=["0", "1"])
        assert _parse_requirements(rows) == []

    def test_role_window_ends_after_focus_weeks_but_never_after_launch(self) -> None:
        rows = sheet(
            roles=["Sr CMS Dev", "PM"],
            hours=["4", "2"],
            members=["1", "1"],
            weeks=["4", "14"],
        )
        sr, pm = _parse_requirements(rows)
        assert (sr.start_date, sr.end_date) == (date(2026, 9, 1), date(2026, 9, 28))
        assert pm.end_date == date(2026, 11, 9)

    def test_timeline_maps_tasks_to_start_week_and_duration(self) -> None:
        timeline = _parse_timeline([["Sales Timeline"], *TIMELINE_ROWS, ["Notes", "tbd"]])
        assert timeline["front end development"] == (4.0, 4.0)
        assert timeline["launch"] == (13.0, 1.0)
        assert "notes" not in timeline

    def test_timeline_without_its_header_is_empty(self) -> None:
        for rows in [[], [["Tasks", "Start week"], ["Design", "0"]], [["Design", "0", "4"]]]:
            with self.subTest(rows=rows):
                assert _parse_timeline(rows) == {}

    def test_roles_join_on_their_timeline_start_week(self) -> None:
        """The template: Nov 16 start, launch 10 weeks later, 14-week timeline."""
        rows = sheet(
            roles=["Sr FE Dev", "Sr CMS Dev", "Sr Mig Dev", "Designer", "PM"],
            hours=["2", "1.5", "1", "3", "2.5"],
            members=["1", "1", "1", "1", "1"],
            weeks=["9", "8", "9", "4", "14"],
            start="11/16/2026",
            launch="1/23/2027",
        )
        fe, cms, mig, designer, pm = _parse_requirements(rows, _parse_timeline(TIMELINE_ROWS))

        # Week 4 = Dec 14; 9 weeks from there.
        assert (fe.start_date, fe.end_date) == (date(2026, 12, 14), date(2027, 2, 14))
        assert (cms.start_date, cms.end_date) == (date(2026, 12, 14), date(2027, 2, 7))
        assert (mig.start_date, mig.end_date) == (date(2026, 12, 21), date(2027, 2, 21))
        assert (designer.start_date, designer.end_date) == (
            date(2026, 11, 16),
            date(2026, 12, 13),
        )
        # No timeline task: week 0, and the full 14 weeks rather than the launch date.
        assert (pm.start_date, pm.end_date) == (date(2026, 11, 16), date(2027, 2, 21))

    def test_staggered_role_never_runs_past_the_timeline(self) -> None:
        rows = sheet(roles=["Sr Mig Dev"], hours=["1"], members=["1"], weeks=["12"])
        (mig,) = _parse_requirements(rows, _parse_timeline(TIMELINE_ROWS))
        # Starts week 5 (Oct 6); 12 weeks would run to Dec 28, the timeline ends Dec 7.
        assert (mig.start_date, mig.end_date) == (date(2026, 10, 6), date(2026, 12, 7))

    def test_role_whose_task_is_missing_from_the_timeline_starts_on_week_0(
        self,
    ) -> None:
        rows = sheet(roles=["Sr FE Dev"], hours=["2"], members=["1"], weeks=["4"])
        timeline = {"design": (0.0, 4.0), "launch": (13.0, 1.0)}
        with self.assertLogs(frappe.logger("ai_staffing"), "WARNING") as logs:
            (fe,) = _parse_requirements(rows, timeline)
        assert (fe.start_date, fe.end_date) == (date(2026, 9, 1), date(2026, 9, 28))
        assert "no 'Front End Development' task" in "\n".join(logs.output)

    def test_dates_accept_sheet_serial_numbers(self) -> None:
        rows = sheet(roles=["PM"], hours=["2"], members=["1"], start="46266", launch="46335")
        (pm,) = _parse_requirements(rows)
        assert (pm.start_date, pm.end_date) == (date(2026, 9, 1), date(2026, 11, 9))

    def test_missing_required_rows_raise(self) -> None:
        rows = sheet(roles=["PM"], hours=["2"], members=["1"])
        rows = [r for r in rows if r[0] != "Launch Date"]
        with self.assertRaisesRegex(ValueError, "launch date"):
            _parse_requirements(rows)

    def test_total_hours_reads_project_total_not_the_trainee_total(self) -> None:
        rows = [
            *sheet(roles=["PM"], hours=["2"], members=["1"]),
            ["PROJECT TOTAL HOURS\nwith trainees", "1,195"],
            ["PROJECT TOTAL HOURS", "1,191"],
        ]
        assert _parse_total_hours(rows) == 1191.0

    def test_total_hours_is_optional(self) -> None:
        for value in [None, "", "0", "n/a"]:
            with self.subTest(value=value):
                rows = sheet(roles=["PM"], hours=["2"], members=["1"])
                if value is not None:
                    rows.append(["PROJECT TOTAL HOURS", value])
                assert _parse_total_hours(rows) is None

    def test_sales_rate_is_total_cost_over_total_hours(self) -> None:
        rows = [
            SALES_HEADER,
            ["Design", "Designer", "0", "$100", "$0"],
            ["CMS Features", "Sr. Development Hours", "26", "$65", "$1,716"],
            ["TOTAL", "", "1336.2", "", "$76,814"],
        ]
        rate, currency = _parse_sales_rate(rows)
        self.assertAlmostEqual(rate, 76814 / 1336.2)
        assert currency == "USD"

    def test_sales_rate_takes_the_currency_from_the_total_cost_header(self) -> None:
        rows = [
            ["Component", "", "Hours", "Cost (INR)", "Total Cost (INR)"],
            ["TOTAL", "", "100", "", "500,000"],
        ]
        assert _parse_sales_rate(rows) == (5000.0, "INR")

    def test_sales_rate_needs_a_total_cost_and_hours(self) -> None:
        for rows in [
            [],
            [SALES_HEADER],
            [SALES_HEADER, ["TOTAL", "", "0", "", "$76,814"]],
            [SALES_HEADER, ["TOTAL", "", "1336.2", "", "$0"]],
            [["Component", "", "Hours"], ["TOTAL", "", "1336.2", "", "$76,814"]],
        ]:
            with self.subTest(rows=rows):
                rate, _currency = _parse_sales_rate(rows)
                assert rate is None

    def test_extract_sheet_id_from_url_or_bare_id(self) -> None:
        url = "https://docs.google.com/spreadsheets/d/18zzJP4kFGvn_I-x/edit?gid=1#gid=1"
        assert extract_sheet_id(url) == "18zzJP4kFGvn_I-x"
        assert extract_sheet_id(" 18zzJP4kFGvn_I-x ") == "18zzJP4kFGvn_I-x"

    def test_non_numeric_cells_raise(self) -> None:
        rows = sheet(roles=["Sr CMS Dev"], hours=["four"], members=["1"])
        with self.assertRaisesRegex(ValueError, "four"):
            _parse_requirements(rows)

    def test_unparseable_dates_raise(self) -> None:
        rows = sheet(roles=["PM"], hours=["2"], members=["1"], start="next Monday")
        with self.assertRaisesRegex(ValueError, "next Monday"):
            _parse_requirements(rows)

    def test_role_over_a_workday_is_kept_but_logged(
        self,
    ) -> None:
        rows = sheet(roles=["Sr CMS Dev"], hours=["10"], members=["1"])
        with self.assertLogs(frappe.logger("ai_staffing"), "WARNING") as logs:
            (sr,) = _parse_requirements(rows)
        assert sr.hours_per_day_per_individual == 10.0
        assert "exceeds a 8h workday" in "\n".join(logs.output)
