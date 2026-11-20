import re
from datetime import UTC, date, datetime, timedelta

import frappe

from next_pms.resource_management.ai_staffing import google_sheets
from next_pms.resource_management.ai_staffing.constants import (
    LEVEL_TIER_LEAD,
    SOW_DELIVERY_ESTIMATE_TAB_NAME,
    SOW_ROLE_SPECS,
    SOW_SALES_DEFAULT_CURRENCY,
    SOW_SALES_SUMMARY_TAB_NAME,
    SOW_SALES_TIMELINE_TAB_NAME,
    STANDARD_WORKDAY_HOURS,
)
from next_pms.resource_management.ai_staffing.types import ProjectStaffingRequirement, SowEstimate

logger = frappe.logger("ai_staffing")

# Sheets' date serial numbers count days since this epoch (Sheets/Excel's "day 0").
_SHEETS_DATE_EPOCH = date(1899, 12, 30)

# Row labels the parser locates by scanning column A, rather than hardcoded row
# numbers, so inserting/removing unrelated rows elsewhere in the template doesn't
# break parsing.
_TASK_HEADER_LABEL = "task"
_HOURS_PER_DAY_LABEL = "hours per day per individual"
_TEAM_MEMBERS_LABEL = "number of team members"
_FOCUS_DELIVERY_WEEKS_LABEL = "focus delivery weeks"
_START_DATE_LABEL = "start date"
_LAUNCH_DATE_LABEL = "launch date"
# Not "PROJECT TOTAL HOURS with trainees", which is a separate row.
_PROJECT_TOTAL_HOURS_LABEL = "project total hours"
# Sales-Estimation Summary: the TOTAL row's cells under the "Hours" and
# "Total Cost (USD)" headers.
_SALES_TOTAL_LABEL = "total"
_SALES_HOURS_HEADER = "hours"
_SALES_TOTAL_COST_HEADER = "total cost"
# Sales-Timeline: one row per task, with its start week and duration in weeks.
_TIMELINE_START_WEEK_HEADER = "start week"
_TIMELINE_DURATION_HEADER = "duration in weeks"


def extract_sheet_id(sheet_link: str) -> str:
    """Extracts the Google Sheet file ID from a full sheet URL, or returns it as-is."""
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", sheet_link)
    return match.group(1) if match else sheet_link.strip()


def _parse_sheet_date(value: str) -> date:
    """Parses a date cell's formatted value.

    Cells formatted as plain numbers come back as Sheets date serials (e.g.
    "45474"); cells formatted as dates come back in the sheet's US locale (e.g.
    "9/1/2026").
    """
    if value.isdigit():
        return _SHEETS_DATE_EPOCH + timedelta(days=int(value))
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=UTC).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognised SOW sheet date value: {value!r}")


def _find_row(rows: list[list[str]], label: str) -> list[str] | None:
    """Returns the first row whose column-A cell matches `label` (case/whitespace-insensitive)."""
    target = label.strip().casefold()
    for row in rows:
        if row and row[0].strip().casefold() == target:
            return row
    return None


def _cell(row: list[str] | None, index: int) -> str:
    if row is None or index >= len(row):
        return ""
    return row[index].strip()


def _first_value(row: list[str] | None) -> str:
    """First non-empty cell after the column-A label.

    The value column has moved between template revisions (column B in the old
    sheet, column C in the current one, after a blank spacer).
    """
    if row is None:
        return ""
    return next((cell.strip() for cell in row[1:] if cell.strip()), "")


def _parse_timeline(rows: list[list[str]]) -> dict[str, tuple[float, float]]:
    """Parses the Sales-Timeline tab into task -> (start week, duration in weeks).

    Task names are casefolded and stripped (the template has "Launch " with a
    trailing space). Rows without numeric weeks are skipped, and a tab without the
    header row gives an empty timeline.
    """
    header_idx = next(
        (i for i, row in enumerate(rows) if any(c.strip().casefold() == _TIMELINE_START_WEEK_HEADER for c in row)),
        None,
    )
    if header_idx is None:
        return {}
    labels = [cell.strip().casefold() for cell in rows[header_idx]]
    if _TIMELINE_DURATION_HEADER not in labels:
        return {}
    start_col = labels.index(_TIMELINE_START_WEEK_HEADER)
    duration_col = labels.index(_TIMELINE_DURATION_HEADER)

    timeline: dict[str, tuple[float, float]] = {}
    for row in rows[header_idx + 1 :]:
        task = _cell(row, 0).casefold()
        try:
            start_week = float(_cell(row, start_col))
            duration_weeks = float(_cell(row, duration_col))
        except ValueError:
            continue
        if task:
            timeline[task] = (start_week, duration_weeks)
    return timeline


def _parse_requirements(
    rows: list[list[str]], timeline: dict[str, tuple[float, float]] | None = None
) -> list[ProjectStaffingRequirement]:
    """Parses the Delivery-Comprehensive Estimate tab's rows into staffing requirements.

    Reads the "Task" header row for role-label columns, then the "Hours Per Day Per
    Individual" / "Number of Team Members" rows for each role's requirement, and the
    "Start Date" / "Launch Date" rows for the project window.

    With a Sales-Timeline (`timeline`, see _parse_timeline), each role joins on its
    timeline task's start week counted from the start date (week 0), so a front-end
    dev isn't held from day one; roles without a task (EM/QA/PM) join on week 0.
    A role runs for its own "Focus Delivery Weeks", never past the timeline's last
    week. That cap is the timeline's end rather than the launch date because the
    timeline includes discovery and the Launch Date row doesn't (the current
    template has a 14-week timeline but a launch 10 weeks after the start date).

    Without a timeline every role starts on the start date and the cap is the
    launch date.
    """
    task_header = _find_row(rows, _TASK_HEADER_LABEL)
    hours_per_day_row = _find_row(rows, _HOURS_PER_DAY_LABEL)
    team_members_row = _find_row(rows, _TEAM_MEMBERS_LABEL)
    start_date_row = _find_row(rows, _START_DATE_LABEL)
    launch_date_row = _find_row(rows, _LAUNCH_DATE_LABEL)
    # Optional: without it, every role runs the full project window.
    focus_weeks_row = _find_row(rows, _FOCUS_DELIVERY_WEEKS_LABEL)

    missing = [
        name
        for name, row in [
            (_TASK_HEADER_LABEL, task_header),
            (_HOURS_PER_DAY_LABEL, hours_per_day_row),
            (_TEAM_MEMBERS_LABEL, team_members_row),
            (_START_DATE_LABEL, start_date_row),
            (_LAUNCH_DATE_LABEL, launch_date_row),
        ]
        if row is None
    ]
    if missing:
        raise ValueError(
            f"SOW sheet is missing expected row(s): {missing}. Template layout may "
            "have changed since SOW_ROLE_SPECS was defined."
        )

    start_date = _parse_sheet_date(_first_value(start_date_row))
    launch_date = _parse_sheet_date(_first_value(launch_date_row))
    last_day = launch_date
    if timeline:
        timeline_weeks = max(start + duration for start, duration in timeline.values())
        last_day = start_date + timedelta(weeks=timeline_weeks, days=-1)

    requirements: list[ProjectStaffingRequirement] = []
    assert task_header is not None  # for type-checkers; already validated above
    for col_idx, role_label in enumerate(task_header):
        if col_idx == 0:
            continue  # column A is the "Task"/row-label column, not a role
        role_label = role_label.strip()
        role_spec = SOW_ROLE_SPECS.get(role_label)
        if not role_spec:
            # Blank column, or a non-allocatable adjustment column (e.g. "Trainee +
            # EM Support Adjs") - neither has a role spec.
            continue

        team_members_needed_str = _cell(team_members_row, col_idx)
        hours_per_day_str = _cell(hours_per_day_row, col_idx)
        if not team_members_needed_str or not hours_per_day_str:
            continue

        team_members_needed = int(float(team_members_needed_str))
        hours_per_day = float(hours_per_day_str)
        if team_members_needed <= 0 or hours_per_day <= 0:
            continue
        if hours_per_day > STANDARD_WORKDAY_HOURS:
            # The sheet computes this as role hours / delivery weeks, so an
            # under-staffed role can exceed a workday. Allocated as-is; flag it so
            # the estimate gets a second team member rather than overtime.
            logger.warning(
                f"SOW role {role_label!r} needs {hours_per_day}h/day per individual "
                f"with {team_members_needed} team member(s) - exceeds a "
                f"{STANDARD_WORKDAY_HOURS:.0f}h workday"
            )

        role_start_date = start_date
        if timeline and role_spec.timeline_task:
            task_weeks = timeline.get(role_spec.timeline_task.casefold())
            if task_weeks is None:
                logger.warning(
                    f"Sales-Timeline has no {role_spec.timeline_task!r} task; "
                    f"{role_label!r} starts on the project start date"
                )
            else:
                role_start_date = start_date + timedelta(weeks=task_weeks[0])

        end_date = last_day
        focus_weeks_str = _cell(focus_weeks_row, col_idx)
        if focus_weeks_str and float(focus_weeks_str) > 0:
            role_end_date = role_start_date + timedelta(weeks=float(focus_weeks_str), days=-1)
            end_date = min(role_end_date, last_day)

        requirements.append(
            ProjectStaffingRequirement(
                role_label=role_label,
                designation_family=role_spec.designation_family,
                level_tier=role_spec.level_tier,
                preferred_skills=role_spec.preferred_skills,
                is_lead_role=role_spec.level_tier == LEVEL_TIER_LEAD,
                team_members_needed=team_members_needed,
                hours_per_day_per_individual=hours_per_day,
                start_date=role_start_date,
                end_date=end_date,
            )
        )

    return requirements


def _parse_total_hours(rows: list[list[str]]) -> float | None:
    """Reads the tab's "PROJECT TOTAL HOURS", or None when it's missing or not a number.

    Optional: only the project hourly rate needs it, not staffing.
    """
    value = _first_value(_find_row(rows, _PROJECT_TOTAL_HOURS_LABEL)).replace(",", "")
    try:
        total_hours = float(value)
    except ValueError:
        return None
    return total_hours if total_hours > 0 else None


def _parse_amount(value: str) -> float | None:
    """Parses a positive formatted number such as "$76,814" or "1336.2", else None."""
    try:
        amount = float(value.replace("$", "").replace(",", "").strip())
    except ValueError:
        return None
    return amount if amount > 0 else None


def _parse_sales_rate(rows: list[list[str]]) -> tuple[float | None, str]:
    """Reads the sales tab's TOTAL cost / TOTAL hours, and the currency it's in.

    The rate is None when the header, TOTAL row or either amount is missing.
    """
    no_header: list[str] = []
    header = next(
        (row for row in rows if any(cell.strip().casefold() == _SALES_HOURS_HEADER for cell in row)),
        no_header,
    )
    labels = [cell.strip().casefold() for cell in header]
    hours_col = labels.index(_SALES_HOURS_HEADER) if header else -1
    cost_col = next(
        (i for i, label in enumerate(labels) if label.startswith(_SALES_TOTAL_COST_HEADER)),
        -1,
    )
    currency_match = re.search(r"\(([A-Za-z]{3})\)", header[cost_col]) if cost_col >= 0 else None
    currency = currency_match.group(1).upper() if currency_match else SOW_SALES_DEFAULT_CURRENCY
    if hours_col < 0 or cost_col < 0:
        return None, currency
    total_row = _find_row(rows, _SALES_TOTAL_LABEL)
    hours = _parse_amount(_cell(total_row, hours_col))
    cost = _parse_amount(_cell(total_row, cost_col))
    if hours is None or cost is None:
        return None, currency
    return cost / hours, currency


def fetch_sow_estimate(sheet_link: str) -> SowEstimate:
    """Fetches and parses a deal's SOW sheet (a link or a bare sheet ID)."""
    sheet_id = extract_sheet_id(sheet_link)
    rows = google_sheets.get_values(sheet_id, SOW_DELIVERY_ESTIMATE_TAB_NAME)
    try:
        sales_rows = google_sheets.get_values(sheet_id, SOW_SALES_SUMMARY_TAB_NAME)
    except Exception as e:
        # Only the project hourly rate needs it, which falls back to the deal value.
        logger.warning(f"Could not read {SOW_SALES_SUMMARY_TAB_NAME!r} tab: {e}")
        sales_rows = []
    sales_rate, sales_currency = _parse_sales_rate(sales_rows)
    try:
        timeline = _parse_timeline(google_sheets.get_values(sheet_id, SOW_SALES_TIMELINE_TAB_NAME))
    except Exception as e:
        logger.warning(f"Could not read {SOW_SALES_TIMELINE_TAB_NAME!r} tab: {e}")
        timeline = {}
    if not timeline:
        logger.warning(
            f"No {SOW_SALES_TIMELINE_TAB_NAME!r} weeks in sheet {sheet_id}; every role starts on the project start date"
        )
    return SowEstimate(
        requirements=_parse_requirements(rows, timeline),
        total_hours=_parse_total_hours(rows),
        sales_hourly_rate=sales_rate,
        sales_currency=sales_currency if sales_rate is not None else None,
    )
