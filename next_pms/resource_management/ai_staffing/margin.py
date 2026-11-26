"""Cost vs. project hourly rate check for the matched role slots.

Each slot's blended hourly cost - the median across every Active employee with
the slot's designation, so no one's own salary shows - is compared against the
project hourly rate (the SOW sales tab's TOTAL cost / hours, else deal value /
SOW total hours). A slot whose margin is below the threshold, or that can't be
checked, gets a "⚠" note for the reviewer to act on before confirming the plan.
"""

from next_pms.project_currency.billing_rate import BILLING_RATE_COST_MULTIPLIER
from next_pms.resource_management.ai_staffing.types import MatchedAllocation

_MIN_MARGIN = 1 - 1 / BILLING_RATE_COST_MULTIPLIER


def project_hourly_rate(deal_value: float | None, total_hours: float | None) -> float | None:
    """The deal's value spread over the SOW's total hours, or None if either is missing."""
    if not deal_value or not total_hours:
        return None
    return deal_value / total_hours


def _margin_note(
    designation: str,
    blended_costs: dict[str, float],
    project_rate: float | None,
    currency: str,
) -> str:
    if project_rate is None:
        return (
            "⚠ Margin not checked: no project hourly rate (no SOW sales total, and "
            "no deal value or SOW total hours) - review before confirming"
        )
    cost = blended_costs.get(designation)
    if not cost:
        return f"⚠ Margin not checked: no salary on record for {designation} - review before confirming"
    margin = 1 - cost / project_rate
    rate = f"{project_rate:,.2f} {currency}/h"
    if project_rate < BILLING_RATE_COST_MULTIPLIER * cost:
        return (
            f"⚠ Margin {margin:.0%} vs project rate {rate} is below the "
            f"{_MIN_MARGIN:.0%} target for {designation} - review before confirming"
        )
    return f"Margin {margin:.0%} vs project rate {rate} meets the {_MIN_MARGIN:.0%} target for {designation}"


def flag_margins(
    matches: list[MatchedAllocation],
    blended_costs: dict[str, float],
    project_rate: float | None,
    currency: str,
) -> None:
    """Sets each match's margin_note, in place."""
    for match in matches:
        match.margin_note = _margin_note(match.designation, blended_costs, project_rate, currency)
