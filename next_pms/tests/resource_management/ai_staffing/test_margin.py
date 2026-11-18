from datetime import date

from frappe.tests import UnitTestCase

from next_pms.resource_management.ai_staffing.margin import flag_margins, project_hourly_rate
from next_pms.resource_management.ai_staffing.types import MatchedAllocation

DESIGNATION = "L4 - Senior Software Engineer"


def margin_note(costs: dict[str, float], project_rate: float | None) -> str:
    match = MatchedAllocation(
        role_label="Sr CMS Dev",
        employee="EMP-1",
        employee_name="Asha",
        designation=DESIGNATION,
        hours_per_day=8.0,
        start_date=date(2026, 11, 2),
        end_date=date(2026, 12, 31),
        reasoning=["matched"],
    )
    flag_margins([match], costs, project_rate, "USD")
    assert match.reasoning == ["matched"], "salary-derived margins must stay out of the allocation reason"
    return match.margin_note


class TestMargin(UnitTestCase):
    def test_project_rate_is_deal_value_over_total_hours(self) -> None:
        self.assertAlmostEqual(project_hourly_rate(76814.0, 1336.2), 57.4869, places=4)
        assert project_hourly_rate(None, 1000.0) is None
        assert project_hourly_rate(50000.0, None) is None
        assert project_hourly_rate(0.0, 1000.0) is None

    def test_rate_at_three_times_cost_meets_the_target(self) -> None:
        assert margin_note({DESIGNATION: 20.0}, 60.0) == (
            f"Margin 67% vs project rate 60.00 USD/h meets the 67% target for {DESIGNATION}"
        )

    def test_rate_under_three_times_cost_is_flagged(self) -> None:
        note = margin_note({DESIGNATION: 20.0}, 59.0)
        assert note.startswith("⚠ Margin 66% vs project rate 59.00 USD/h is below")
        assert note.endswith("review before confirming")

    def test_a_designation_without_salaries_is_flagged_not_passed(self) -> None:
        assert margin_note({}, 60.0) == (
            f"⚠ Margin not checked: no salary on record for {DESIGNATION} - review before confirming"
        )

    def test_no_project_rate_is_flagged(self) -> None:
        assert margin_note({DESIGNATION: 20.0}, None).startswith("⚠ Margin not checked: no project hourly rate")
