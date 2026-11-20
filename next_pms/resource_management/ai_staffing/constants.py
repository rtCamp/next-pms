from typing import NamedTuple

SOW_DELIVERY_ESTIMATE_TAB_NAME = "Delivery-Comprehensive Estimate"
SOW_SALES_SUMMARY_TAB_NAME = "Sales-Estimation Summary"
SOW_SALES_TIMELINE_TAB_NAME = "Sales-Timeline"
# The sales tab prices in dollars; used when its "Total Cost (<CUR>)" header names none
SOW_SALES_DEFAULT_CURRENCY = "USD"

STANDARD_WORKDAY_HOURS = 8.0
# Free hours/day an EM/Lead role's candidate needs (or the role's own hours/day,
# if lower); leads run several projects, so a partial day is enough
LEAD_ROLE_MIN_FREE_HOURS_PER_DAY = 2.0
# Approved leave only excludes a candidate when it covers more than this share of
# the role's working days (Mon-Fri); shorter leave is ignored and noted for the PM
LEAVE_EXCLUDE_ABOVE_WINDOW_SHARE = 0.2

# Level tiers by designation prefix: L1-L2 Junior, L3-L6 Senior, L7+ Lead
LEVEL_TIER_JUNIOR = "Junior"
LEVEL_TIER_SENIOR = "Senior"
LEVEL_TIER_LEAD = "Lead"
LEVEL_TIER_JUNIOR_MAX_L_NUMBER = 2
LEVEL_TIER_LEAD_MIN_L_NUMBER = 7

# Other titles in a role's designation family (L7+ drops "Software" from the title)
DESIGNATION_FAMILY_ALIASES: dict[str, list[str]] = {
    "Software Engineer": ["Staff Engineer", "Principal Engineer", "Growth Engineer"],
}

# Departments a designation family is staffed from, by name without the company
# suffix (e.g. "Engineering - RTIN" -> "Engineering"). Anyone in another department
# is excluded; anyone with no department stays eligible, flagged for review.
DEPARTMENTS_BY_DESIGNATION_FAMILY: dict[str, list[str]] = {
    "Software Engineer": ["Engineering"],
    "Quality Engineer": ["Quality Engineering", "E2E Quality"],
    "Designer": ["Design"],
    "Project Manager": ["Project Management"],
}

# Tiers tried, in order, to fill a role: Lead falls back to Senior, Junior up to Senior
LEVEL_TIER_CASCADE: dict[str, tuple[str, ...]] = {
    LEVEL_TIER_LEAD: (LEVEL_TIER_LEAD, LEVEL_TIER_SENIOR),
    LEVEL_TIER_SENIOR: (LEVEL_TIER_SENIOR,),
    LEVEL_TIER_JUNIOR: (LEVEL_TIER_JUNIOR, LEVEL_TIER_SENIOR),
}


class SowRoleSpec(NamedTuple):
    """How one SOW role column maps onto employees."""

    designation_family: str
    level_tier: str | None
    preferred_skills: list[str]
    # Sales-Timeline task whose start week the role joins on; None for roles that
    # run the whole project (EM/QA/PM), which join on week 0
    timeline_task: str | None = None


# SOW "Task" header label -> role spec; unlisted columns are skipped. "EM" is Lead Eng.
SOW_ROLE_SPECS: dict[str, SowRoleSpec] = {
    "Sr Mig Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_SENIOR, ["WordPress"], "Content Migration"),
    "Jr Mig Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_JUNIOR, ["WordPress"], "Content Migration"),
    "Sr CMS Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_SENIOR, ["WordPress"], "CMS Feature Development"),
    "Jr CMS Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_JUNIOR, ["WordPress"], "CMS Feature Development"),
    "Sr FE Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_SENIOR, ["Front End", "React"], "Front End Development"),
    "Jr FE Dev": SowRoleSpec("Software Engineer", LEVEL_TIER_JUNIOR, ["Front End", "React"], "Front End Development"),
    "EM": SowRoleSpec("Software Engineer", LEVEL_TIER_LEAD, []),
    "QA Engineer": SowRoleSpec("Quality Engineer", None, ["QA"]),
    "Designer": SowRoleSpec("Designer", None, [], "Design"),
    "PM": SowRoleSpec("Project Manager", None, ["Project Management Skill"]),
}

BILLABILITY_LOOKBACK_DAYS = 90
# Logged as non-billable, but counted as billable when ranking
BILLABILITY_CREDITED_PROJECT_TYPES: list[str] = ["Growth"]
# Ratio for anyone with no logged hours, so missing timesheets don't look like bench time
BILLABILITY_NEUTRAL_RATIO = 0.5
# Below this, the reasoning says the person was "prioritised to spread billable work"
BILLABILITY_PRIORITISED_BELOW_RATIO = 0.7
