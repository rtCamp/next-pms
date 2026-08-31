import datetime
from collections import defaultdict
from dataclasses import dataclass

import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe import get_all
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week, getdate
from frappe.utils.caching import redis_cache

from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.utils.constant import (
    ALLOWED_FILTER_FIELDS,
    ALLOWED_TIMESHET_DETAIL_FIELDS,
    FILTER_LOOKBACK_WEEKS,
    NOT_SUBMITTED_STATUS,
    WORK_FILTER_DOCTYPES,
)

from . import filter_employees

READ_ONLY_ROLE = ["Timesheet User", "Projects User"]
READ_WRITE_ROLE = ["Timesheet Manager", "Projects Manager"]


def has_write_access():
    roles = frappe.get_roles()
    return set(roles).intersection(READ_WRITE_ROLE)


@redis_cache()
def get_week_dates(date: str | datetime.date | datetime.datetime, ignore_weekend: bool = False) -> dict:
    """Return week boundaries and day list for the week containing ``date``.

    Args:
        date (str | datetime.date | datetime.datetime): Any day within the target week.
        ignore_weekend (bool): If True, ``dates`` lists weekdays only (no Sat/Sun).
            Week bounds (``start_date`` / ``end_date``) stay the same. Defaults to False.

    Returns:
        When ``ignore_weekend`` is False (default):

        ```py
        {
            "start_date": datetime.date(2026, 5, 18),
            "end_date": datetime.date(2026, 5, 24),
            "key": "This Week",
            "dates": [
                datetime.date(2026, 5, 18),
                datetime.date(2026, 5, 19),
                datetime.date(2026, 5, 20),
                datetime.date(2026, 5, 21),
                datetime.date(2026, 5, 22),
                datetime.date(2026, 5, 23),
                datetime.date(2026, 5, 24),
            ],
        }

        # start_date / end_date: first/last day of week (Frappe System Settings).
        # dates: every day from start_date through end_date (7 days when week is Mon-Sun).
        # key: "This Week" if today falls in range, else "Mon DD - Sun DD" (last day = end_date).
        ```

        When ``ignore_weekend`` is True:

        ```py
        {
            "start_date": datetime.date(2026, 5, 18),
            "end_date": datetime.date(2026, 5, 24),
            "key": "This Week",
            "dates": [
                datetime.date(2026, 5, 18),
                datetime.date(2026, 5, 19),
                datetime.date(2026, 5, 20),
                datetime.date(2026, 5, 21),
                datetime.date(2026, 5, 22),
            ],
        }

        # start_date / end_date: same full week range as above (not shortened).
        # dates: only Mon-Fri when the configured week is Mon-Sun (Sat/Sun skipped).
        # key: "This Week" if today is in range, else "Mon DD - Fri DD" (end_date - 2 days).
        ```

        Non-current week with ``ignore_weekend`` True (same ``dates`` shape, different ``key``):

        ```py
        {
            "start_date": datetime.date(2026, 5, 18),
            "end_date": datetime.date(2026, 5, 24),
            "key": "May 18 - May 22",
            "dates": [
                datetime.date(2026, 5, 18),
                datetime.date(2026, 5, 19),
                datetime.date(2026, 5, 20),
                datetime.date(2026, 5, 21),
                datetime.date(2026, 5, 22),
            ],
        }
        ```
    """

    dates = []
    data = {}
    now = getdate()
    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)

    if start_date <= now <= end_date:
        key = "This Week"
    else:
        if ignore_weekend:
            end_date_for_key = add_days(end_date, -2)
        else:
            end_date_for_key = end_date
        key = f"{start_date.strftime('%b %d')} - {end_date_for_key.strftime('%b %d')}"

    data = {"start_date": start_date, "end_date": end_date, "key": key}

    while start_date <= end_date:
        if ignore_weekend and start_date.weekday() in [5, 6]:
            start_date = add_days(start_date, 1)
            continue
        dates.append(start_date)
        start_date = add_days(start_date, 1)
    data["dates"] = dates
    return data


def update_weekly_status_of_timesheet(employee: str, date: str):
    from collections import defaultdict

    from frappe.utils import get_first_day_of_week, get_last_day_of_week

    from .employee import get_workable_days_for_employee

    start_date = get_first_day_of_week(date)
    end_date = get_last_day_of_week(date)
    working_days = get_workable_days_for_employee(employee, start_date, end_date)

    current_week_timesheet = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": ["<", 2],
        },
        ["name", "custom_approval_status", "start_date"],
    )
    if not current_week_timesheet:
        return

    timesheet_by_start_date = defaultdict(list)

    for ts in current_week_timesheet:
        timesheet_by_start_date[ts["start_date"]].append(ts)

    priority = {
        "Rejected": 5,
        "Approval Pending": 4,
        "Approved": 3,
        "Not Submitted": 2,
        "Processing Timesheet": 1,
        None: 0,
    }

    final_status_per_day = {}

    for day, timesheets in timesheet_by_start_date.items():
        highest_status = None
        highest_value = 0
        for ts in timesheets:
            status = ts["custom_approval_status"]
            if priority.get(status, 0) > highest_value:
                highest_status = status
                highest_value = priority[status]
        final_status_per_day[day] = highest_status or "Not Submitted"

    week_status = "Not Submitted"

    status_count = {
        "Not Submitted": 0,
        "Approved": 0,
        "Rejected": 0,
        "Approval Pending": 0,
        "Processing Timesheet": 0,
    }

    for day_status in final_status_per_day.values():
        if day_status in status_count:
            status_count[day_status] += 1

    total_working_days = 0
    if working_days:
        total_working_days = working_days.get("total_working_days") or 0

    effective_total_days = total_working_days if total_working_days > 0 else len(final_status_per_day)

    if effective_total_days > 0 and status_count["Approval Pending"] >= effective_total_days:
        week_status = "Approval Pending"
    elif effective_total_days > 0 and status_count["Rejected"] >= effective_total_days:
        week_status = "Rejected"
    elif effective_total_days > 0 and status_count["Approved"] >= effective_total_days:
        week_status = "Approved"
    elif status_count["Processing Timesheet"] > 0:
        week_status = "Processing Timesheet"
    elif status_count["Rejected"] > 0:
        week_status = "Partially Rejected"
    elif status_count["Approved"] > 0:
        week_status = "Partially Approved"

    weekly_rejection_reason = None
    if week_status == "Rejected":
        rejected_ts_order = {
            ts.name: (ts.start_date, ts.name)
            for ts in sorted(current_week_timesheet, key=lambda ts: ts.start_date)
            if ts.get("custom_approval_status") == "Rejected"
        }
        rejected_rows = frappe.get_all(
            "Timesheet Detail",
            filters={"parent": ["in", list(rejected_ts_order)]},
            fields=["parent", "custom_rejection_reason", "idx"],
        )
        rejected_rows.sort(key=lambda row: (rejected_ts_order[row.parent], row.idx))
        reasons = []
        seen = set()
        for row in rejected_rows:
            reason = (row.get("custom_rejection_reason") or "").strip()
            if reason and reason not in seen:
                seen.add(reason)
                reasons.append(reason)
        weekly_rejection_reason = "\n".join(reasons) if reasons else None

    for timesheet in current_week_timesheet:
        frappe.db.set_value(
            "Timesheet",
            timesheet.name,
            {
                "custom_weekly_approval_status": week_status,
                "custom_weekly_rejection_reason": weekly_rejection_reason,
            },
            update_modified=False,
        )


@redis_cache()
def get_holidays(employee: str, start_date: str, end_date: str):
    holiday_name = get_holiday_list_for_employee(employee, raise_exception=False)
    if not holiday_name:
        return []
    holidays = frappe.get_all(
        "Holiday",
        filters={
            "parent": holiday_name,
            "holiday_date": ["between", (getdate(start_date), getdate(end_date))],
        },
        fields=["holiday_date", "description", "weekly_off"],
    )
    return holidays


def apply_role_permission_for_doctype(roles: list[str], doctype: str, ptype: str = "read", doc=None):
    if frappe.session.user == "Administrator":
        return

    user_roles = frappe.get_roles()

    if not set(roles).intersection(user_roles):
        frappe.has_permission(doctype, ptype, doc, throw=True)


def employee_has_higher_access(employee: str, ptype: str = "read") -> bool:
    from .employee import get_employee_from_user

    if frappe.session.user == "Administrator":
        return True
    roles = frappe.get_roles()
    session_employee = get_employee_from_user()
    if (
        set(roles).intersection(["Projects Manager", "Projects User"])
        and ptype == "write"
        and not set(roles).intersection(["Timesheet Manager"])
    ):
        if employee == session_employee:
            return True
        else:
            reports_to = frappe.db.get_value("Employee", employee, "reports_to")
            if reports_to == session_employee:
                return True
            else:
                return False
    if set(roles).intersection(READ_ONLY_ROLE + READ_WRITE_ROLE) and ptype == "read":
        return True
    if set(roles).intersection(READ_WRITE_ROLE) and ptype == "write":
        return True

    return employee == session_employee


def normalize_status_filter(status_filter, coerce_non_list: bool = False):
    """Normalize an approval-status filter into a list of status labels.

    Accepts an already-decoded list, a JSON-encoded array, or a bare label - a string that
    is not JSON is the single-element filter it looks like, not an error. A payload that
    does decode but into something other than status labels *is* a caller error, and is
    reported as one here rather than reaching the query builder as an unhashable value.
    """
    if isinstance(status_filter, str):
        status_filter = status_filter.strip()
        if not status_filter:
            return None

        try:
            status_filter = frappe.parse_json(status_filter)
        except ValueError, TypeError:
            return [status_filter]

    if not status_filter:
        return None
    if coerce_non_list and not isinstance(status_filter, list):
        status_filter = [status_filter]

    if isinstance(status_filter, list) and not all(isinstance(status, str) for status in status_filter):
        frappe.throw(frappe._("Approval status filter must be a list of status labels."))

    return status_filter


def parse_filters(raw_filters):
    """Parse Frappe desk-style filters into per-doctype filter lists.

    Input: [["Timesheet", "parent_project", "=", "PROJ-001"], ...]
    Output: {"Timesheet": [["parent_project", "=", "PROJ-001"]], "Timesheet Detail": [], "Task": []}
    """
    result = {dt: [] for dt in ALLOWED_FILTER_FIELDS}

    if not raw_filters:
        return result

    if isinstance(raw_filters, str):
        try:
            raw_filters = frappe.parse_json(raw_filters)
        except ValueError, TypeError:
            frappe.throw(frappe._("Invalid filters format. Expected a JSON array."))

    if not isinstance(raw_filters, list):
        frappe.throw(frappe._("Filters must be a list of [doctype, field, operator, value] entries."))

    for f in raw_filters:
        if not isinstance(f, list) or len(f) != 4:
            frappe.throw(frappe._("Each filter must be a list of [doctype, field, operator, value]."))

        doctype, field, operator, value = f

        if doctype not in ALLOWED_FILTER_FIELDS:
            frappe.throw(frappe._("Filtering on doctype '{0}' is not supported.").format(doctype))

        if field not in ALLOWED_FILTER_FIELDS[doctype]:
            frappe.throw(frappe._("Filtering on field '{0}' of '{1}' is not supported.").format(field, doctype))

        result[doctype].append([field, operator, value])

    return result


def build_filters(base_filters, additional_filters):
    """Merge base dict filters with parsed list-of-lists filters for frappe.get_all.

    Converts base dict format {field: value} or {field: [op, value]} into
    list-of-lists format and extends with additional filters.
    """
    result = []
    for field, value in base_filters.items():
        if isinstance(value, list) and len(value) == 2 and isinstance(value[0], str):
            result.append([field, value[0], value[1]])
        else:
            result.append([field, "=", value])
    result.extend(additional_filters)
    return result


TASK_FIELDS = [
    "name",
    "subject",
    "project.project_name as project_name",
    "project",
    "custom_is_billable",
    "expected_time",
    "actual_time",
    "status",
    "_liked_by",
    "exp_end_date",
]


def build_aggregate_dates(date: str, max_week: int, has_filters: bool):
    max_lookback = max(FILTER_LOOKBACK_WEEKS, max_week) if has_filters else max_week
    dates = []
    current_date = getdate(date)

    for _ in range(max_lookback):
        week = get_week_dates(date=current_date)
        if not week:
            break
        dates.append(week)
        current_date = getdate(add_days(week["start_date"], -1))

    dates.reverse()
    return dates, max_lookback


def get_matching_timesheets(
    dates: list,
    parsed_filters: dict,
    approval_status: list[str] | None = None,
    require_project_tasks: bool = False,
    employee_ids: list[str] | None = None,
):
    """Timesheets in the range that satisfy the filters, detail and task conditions included.

    Returns the rows rather than the employees behind them because the same join answers
    two different questions: *who* can match at all (the employee pool) and *which weeks*
    of theirs match (per-week membership). Collapsing to employees here is what let a
    match in one week qualify every other week the employee logged anything in.
    """
    if not dates:
        return []

    base_ts_filters = {
        "start_date": [">=", dates[0].get("start_date")],
        "end_date": ["<=", dates[-1].get("end_date")],
        "docstatus": ["!=", 2],
    }
    if approval_status:
        base_ts_filters["custom_weekly_approval_status"] = ["in", approval_status]
    if employee_ids is not None:
        base_ts_filters["employee"] = ["in", employee_ids]

    ts_filters = build_filters(base_ts_filters, parsed_filters.get("Timesheet", []))
    timesheets = get_all("Timesheet", filters=ts_filters, fields=["name", "employee", "start_date"])
    if not timesheets:
        return []

    requires_detail_scan = bool(
        require_project_tasks or parsed_filters.get("Task") or parsed_filters.get("Timesheet Detail")
    )
    if not requires_detail_scan:
        return timesheets

    timesheet_by_name = {timesheet.name: timesheet for timesheet in timesheets}
    detail_filters = build_filters(
        {"parent": ["in", list(timesheet_by_name)]}, parsed_filters.get("Timesheet Detail", [])
    )
    details = get_all("Timesheet Detail", filters=detail_filters, fields=["parent", "task"])
    if not details:
        return []

    requires_task_scan = bool(require_project_tasks or parsed_filters.get("Task"))
    if requires_task_scan:
        task_ids = list({detail.task for detail in details if detail.task})
        if not task_ids:
            return []

        task_filters = build_filters({"name": ["in", task_ids]}, parsed_filters.get("Task", []))
        tasks = get_all("Task", filters=task_filters, fields=["name", "project"])
        if require_project_tasks:
            tasks = [task for task in tasks if task.get("project")]

        valid_task_ids = {task.name for task in tasks}
        if not valid_task_ids:
            return []

        matched_parent_names = {detail.parent for detail in details if detail.task in valid_task_ids}
    else:
        matched_parent_names = {detail.parent for detail in details}

    return [timesheet_by_name[parent] for parent in matched_parent_names if parent in timesheet_by_name]


def get_matching_timesheet_employee_ids(
    dates: list,
    parsed_filters: dict,
    approval_status: list[str] | None = None,
    require_project_tasks: bool = False,
):
    timesheets = get_matching_timesheets(
        dates=dates,
        parsed_filters=parsed_filters,
        approval_status=approval_status,
        require_project_tasks=require_project_tasks,
    )
    return list({timesheet.employee for timesheet in timesheets})


def sanitize_employee_conditions(employee_conditions: list | None) -> list:
    """Drop conditions on fields missing from the site's Employee meta
    (e.g. `custom_business_unit` without the rtcamp customisation) instead of raising.

    Callers must sanitize before deciding filtered-vs-unfiltered behaviour, so a
    condition that will be dropped anyway cannot flip the request into the
    filtered path.
    """
    meta = frappe.get_meta("Employee")
    return [[field, operator, value] for field, operator, value in employee_conditions or [] if meta.has_field(field)]


def employee_condition_kwargs(employee_conditions: list | None) -> dict:
    """Build `filter_employees` kwargs that apply Employee-level [field, operator, value]
    conditions (already sanitized via `sanitize_employee_conditions`) with their
    operators intact (e.g. `like` stays a LIKE, not an IN).

    An explicit status condition replaces the default Active-only filter, matching
    the behaviour of `filter_employees`'s own `status` parameter.
    """
    return {
        "extra_conditions": employee_conditions or None,
        "ignore_default_filters": any(field == "status" for field, _operator, _value in employee_conditions or []),
    }


def get_team_candidate_employee_ids(
    reports_to: str | None = None,
    dates: list | None = None,
    parsed_filters: dict | None = None,
    timesheet_status: list[str] | None = None,
    employee_conditions: list | None = None,
):
    if not dates:
        return []

    # "Not Submitted" is the absence of a Timesheet, so it cannot be resolved by querying
    # them. Narrowing the pool on it would drop exactly the employees it should return.
    db_statuses = [status for status in (timesheet_status or []) if status != NOT_SUBMITTED_STATUS]
    wants_not_submitted = bool(timesheet_status) and len(db_statuses) < len(timesheet_status)
    has_work_filters = any((parsed_filters or {}).values())

    has_candidate_filters = bool(db_statuses or has_work_filters)
    if not has_candidate_filters and not employee_conditions:
        return None

    # Work filters still narrow: an employee with no Timesheet cannot match one, so
    # combining them with "Not Submitted" legitimately excludes the no-row population.
    if wants_not_submitted and not has_work_filters:
        return None

    employee_ids = get_matching_timesheet_employee_ids(
        dates=dates,
        parsed_filters=parsed_filters or {dt: [] for dt in ALLOWED_FILTER_FIELDS},
        approval_status=db_statuses or None,
    )
    if not employee_ids:
        return []

    _, filtered_count = filter_employees(
        page_length=1,
        start=0,
        reports_to=reports_to,
        ids=employee_ids,
        **employee_condition_kwargs(employee_conditions),
    )
    if not filtered_count:
        return []

    return employee_ids


@dataclass
class TeamEmployeeScope:
    """Everything the team timesheet endpoints need to agree on about *who* and *when*.

    `get_team_timesheet_weeks` derives its counts from this and `get_team_timesheet_data`
    derives its rows from it, so a single resolver is what keeps the pending-approval
    badge consistent with the rows underneath it.
    """

    dates: list
    response_dates: list
    parsed_filters: dict
    employee_conditions: list
    status_filter: list | None
    search: str | None
    reports_to: str | None
    has_filters: bool
    candidate_employee_ids: list[str] | None = None

    @property
    def is_empty(self) -> bool:
        """True when the filters provably match no employee, so callers can skip work."""
        return self.candidate_employee_ids == []

    @property
    def has_work_filters(self) -> bool:
        """True when a filter describes logged work rather than who the employee is.

        Employee-level conditions narrow the pool once; work filters have to be answered
        again for every week, since a member matching one week says nothing about another.
        """
        return any(self.parsed_filters.get(doctype) for doctype in WORK_FILTER_DOCTYPES)

    @property
    def skip_empty_weeks(self) -> bool:
        """Empty weeks are dropped for filters that describe *work*, not for member search.

        Searching for a person and being shown none of their weeks reads as "no data";
        filtering by project/task/status means the caller asked for weeks matching that
        predicate. Resolved here rather than accepted as a parameter so both endpoints
        make the same choice.
        """
        if not self.has_filters:
            return False
        return bool(
            self.status_filter or any(conditions for doctype, conditions in self.parsed_filters.items() if conditions)
        )


def resolve_team_employee_scope(
    date: str,
    max_week: int,
    status_filter: str | list[str] | None = None,
    reports_to: str | None = None,
    search: str | None = None,
    filters: str | list | None = None,
) -> TeamEmployeeScope:
    """Resolve the employee/date scope shared by the team timesheet endpoints."""
    status_filter = normalize_status_filter(status_filter, coerce_non_list=True)

    parsed_filters = parse_filters(filters)

    # Employee-level filters (status / business unit drop-downs in frontend) are
    # passed through with their operators intact so the global employee filter
    # narrows the pool with the same semantics the caller asked for (like, in, ...).
    # Sanitized (and written back) before has_filters so a condition dropped for a
    # missing meta field cannot flip the request into the filtered path.
    employee_conditions = sanitize_employee_conditions(parsed_filters.get("Employee"))
    parsed_filters["Employee"] = employee_conditions

    has_filters = bool(search or status_filter or any(parsed_filters.values()))
    dates, _ = build_aggregate_dates(date=date, max_week=max_week, has_filters=has_filters)
    response_dates = dates[-max_week:] if has_filters and len(dates) > max_week else dates

    # `search` is an employee-name search, so it narrows the employee query rather than
    # the timesheet query - it is applied in resolve_team_members, not here.
    candidate_employee_ids = get_team_candidate_employee_ids(
        reports_to=reports_to,
        dates=dates,
        parsed_filters=parsed_filters,
        timesheet_status=status_filter,
        employee_conditions=employee_conditions,
    )

    return TeamEmployeeScope(
        dates=dates,
        response_dates=response_dates,
        parsed_filters=parsed_filters,
        employee_conditions=employee_conditions,
        status_filter=status_filter,
        search=search,
        reports_to=reports_to,
        has_filters=has_filters,
        candidate_employee_ids=candidate_employee_ids,
    )


def get_team_week_participation(scope: TeamEmployeeScope, weeks: list) -> dict:
    """Per-week distinct employees, and how many of them are pending approval.

    One query for the whole range, bucketed into weeks in Python via
    `get_first_day_of_week` so the week boundary matches the rest of the app rather
    than a hand-rolled SQL date expression that would ignore System Settings.

    Returns `{week_start: {"members": set, "matched": set, "pending": set, "status_matched": set}}`.
    Sets rather than counts because API 2 intersects them with its own employee page, and a
    count cannot be intersected. `members` is raw participation; `matched` is the subset whose
    timesheets *in that week* satisfy the work filters.
    """
    if not weeks:
        return {}

    timesheet_filters = {
        "start_date": [">=", weeks[0]["start_date"]],
        "end_date": ["<=", weeks[-1]["end_date"]],
        "docstatus": ["!=", 2],
    }
    if scope.candidate_employee_ids is not None:
        timesheet_filters["employee"] = ["in", scope.candidate_employee_ids]

    rows = get_all(
        "Timesheet",
        filters=timesheet_filters,
        fields=["name", "employee", "start_date", "custom_weekly_approval_status"],
        distinct=True,
        # Unordered on purpose: the result is folded into sets, and the default
        # `creation` sort costs a filesort over the whole match set.
        order_by=None,
    )

    # A work filter is resolved per week, not once for the whole lookback window:
    # `candidate_employee_ids` only says the employee matched *somewhere* in it, so reading
    # that as membership listed them in every week they merely logged something in.
    matched_names = None
    if scope.has_work_filters:
        matched_names = {
            timesheet.name
            for timesheet in get_matching_timesheets(
                dates=weeks,
                parsed_filters=scope.parsed_filters,
                employee_ids=scope.candidate_employee_ids,
            )
        }

    status_filter = set(scope.status_filter or [])
    participation = {
        week["start_date"]: {"members": set(), "matched": set(), "pending": set(), "status_matched": set()}
        for week in weeks
    }
    for row in rows:
        week_start = get_first_day_of_week(row.start_date)
        bucket = participation.get(week_start)
        if bucket is None:
            continue
        # `members` stays raw participation - "Not Submitted" is the absence of a row, so it
        # has to be derived from every week the employee did or did not log time in.
        bucket["members"].add(row.employee)
        if matched_names is not None and row.name not in matched_names:
            continue
        bucket["matched"].add(row.employee)
        if row.custom_weekly_approval_status == "Approval Pending":
            bucket["pending"].add(row.employee)
        # Read the status the same way the payload derives it for display, so a row whose
        # weekly status was never set counts as "Not Submitted" here too.
        status = row.custom_weekly_approval_status or NOT_SUBMITTED_STATUS
        # Per-week status membership: an employee belongs to a status-filtered week only
        # when that week's approval status is one the caller asked for. Without this the
        # filter fell back to plain participation, so every status except "Approval
        # Pending" matched anyone who merely logged time that week.
        if status_filter and status in status_filter:
            bucket["status_matched"].add(row.employee)

    return participation


def resolve_team_members(scope: TeamEmployeeScope, weeks: list) -> dict:
    """Resolve which employees qualify, per week, before any pagination happens.

    This is the single source both team timesheet endpoints read: the week endpoint
    turns these sets into counts, the data endpoint paginates one of them. Deriving
    both from here is what stops the pending-approval badge from disagreeing with the
    rows beneath it.

    Resolving qualification up front is also what removes the O(total employees) scan:
    membership used to be knowable only after a full payload had been built and
    discarded, so a 20-row page walked the entire pool.

    Returns `{"eligible_ids", "eligible_count", "members_by_week", "pending_by_week"}`.
    """
    eligible_employees, eligible_count = filter_employees(
        page_length=0,
        start=0,
        reports_to=scope.reports_to,
        ids=scope.candidate_employee_ids,
        employee_name=scope.search,
        **employee_condition_kwargs(scope.employee_conditions),
    )
    eligible_ids = {employee.name for employee in eligible_employees}

    participation = get_team_week_participation(scope, weeks)

    members_by_week = {}
    pending_by_week = {}
    for week in weeks:
        bucket = participation.get(
            week["start_date"], {"members": set(), "matched": set(), "pending": set(), "status_matched": set()}
        )
        # Membership is per-week filter-matching participation only for filters that describe
        # work. For a member-name search an employee belongs to every week whether or not they
        # logged time - the point of searching a person is to see their empty weeks too.
        # A status filter is stricter still: the week's approval status must match, so it
        # keys off the status-matched set rather than plain participation.
        if scope.status_filter:
            week_members = bucket["status_matched"]
            # A week with no Timesheet at all reads as "Not Submitted" everywhere else in
            # the payload, so it has to answer to that filter rather than the Timesheet
            # query, which by definition cannot return it.
            if NOT_SUBMITTED_STATUS in scope.status_filter:
                week_members = week_members | (eligible_ids - bucket["members"])
        elif scope.skip_empty_weeks:
            week_members = bucket["matched"]
        else:
            week_members = eligible_ids
        members_by_week[week["start_date"]] = week_members & eligible_ids
        pending_by_week[week["start_date"]] = bucket["pending"] & eligible_ids

    return {
        "eligible_ids": eligible_ids,
        "eligible_count": eligible_count,
        "members_by_week": members_by_week,
        "pending_by_week": pending_by_week,
    }


def has_scoped_timesheets_before(scope: TeamEmployeeScope, eligible_ids: set, date) -> bool:
    """Whether a week older than `date` could still hold a row for this scope.

    This is what tells the week endpoint to keep offering older pages, so it has to ask
    about *this* caller's team rather than about the Timesheet table as a whole - an
    unrelated employee's three-year-old timesheet would otherwise keep a filtered view
    paging backwards over weeks that can never produce a row.

    Deliberately an upper bound: employee scope, Timesheet-level filters and stored
    approval statuses narrow it, while Task / Timesheet Detail filters (which need the
    detail join) and `Not Submitted` (which is the absence of a row, so no Timesheet query
    can answer it) do not. Over-reporting costs one empty page; under-reporting would hide
    weeks that do have data, so the bound leans the safe way.
    """
    if not eligible_ids:
        return False

    filters = {
        "start_date": ["<", date],
        "docstatus": ["!=", 2],
        "employee": ["in", sorted(eligible_ids)],
    }

    status_filter = scope.status_filter or []
    db_statuses = [status for status in status_filter if status != NOT_SUBMITTED_STATUS]
    if db_statuses and len(db_statuses) == len(status_filter):
        filters["custom_weekly_approval_status"] = ["in", db_statuses]

    return bool(
        get_all(
            "Timesheet",
            filters=build_filters(filters, scope.parsed_filters.get("Timesheet", [])),
            fields=["name"],
            limit=1,
        )
    )


@dataclass
class ProjectTimesheetScope:
    """Everything the project timesheet endpoints need to agree on about *which projects*
    and *when*.

    The project-page counterpart of `TeamEmployeeScope`. `get_project_timesheet_weeks`
    derives its per-week counts from this and `get_project_timesheet_data` paginates one of
    those weeks, so a single resolver is what keeps a week's project count consistent with
    the rows rendered beneath it.
    """

    dates: list
    response_dates: list
    parsed_filters: dict
    search: str | None
    approval_status: list[str] | None
    has_filters: bool

    @property
    def skip_empty_weeks(self) -> bool:
        """Weeks holding no qualifying project are dropped whenever any filter is set.

        Unlike the team page, member/name search is *not* carved out here: `search` is a
        project-name search, and a project only qualifies once it has timesheet entries in
        the window, so carving search out would emit weeks that are empty by construction.
        Resolved here rather than taken as a parameter so both endpoints make the same
        choice.
        """
        return self.has_filters


def resolve_project_scope(
    date: str,
    max_week: int,
    filters: str | list | None = None,
    search: str | None = None,
    approval_status: list[str] | None = None,
) -> ProjectTimesheetScope:
    """Resolve the project/date scope shared by the project timesheet endpoints."""
    parsed_filters = parse_filters(filters)
    has_filters = bool(search or approval_status or any(parsed_filters.values()))

    # Employee-level filters have no Timesheet-side equivalent, so they are resolved to
    # employee IDs and folded into the Timesheet filter list. Every downstream query reads
    # parsed_filters["Timesheet"], so doing it once here is what stops them being silently
    # dropped by one query path and honoured by another.
    employee_filters = parsed_filters.get("Employee")
    if employee_filters:
        employee_names = get_all("Employee", filters=employee_filters, pluck="name")
        parsed_filters["Timesheet"] = [*parsed_filters.get("Timesheet", []), ["employee", "in", employee_names]]

    dates, _ = build_aggregate_dates(date=date, max_week=max_week, has_filters=has_filters)

    return ProjectTimesheetScope(
        dates=dates,
        # Under filters `dates` spans the full (up to 12-week) lookback used to locate
        # matching data, and empty weeks are dropped downstream - so the whole span is
        # rendered rather than trimmed to the most recent `max_week`, otherwise data in
        # older weeks would be hidden.
        response_dates=dates,
        parsed_filters=parsed_filters,
        search=search,
        approval_status=approval_status,
        has_filters=has_filters,
    )


def get_project_timesheet_detail_rows(scope: ProjectTimesheetScope, weeks: list) -> list:
    """Timesheet Detail rows in range, joined to their parent Timesheet, as one query.

    Replaces the previous two-step "select every Timesheet in range, then select details
    with `parent IN (<thousands of names>)`". That IN list was the slowest query in every
    scenario measured at baseline (58.9 ms of S6's 107 ms at 500 projects), because its
    cost scales with how many timesheets are in the window rather than with how many
    actually match.

    Handing the whole thing to the database as a join lets it pick the plan, and it wins in
    every regime measured - broad 75 -> 34 ms, a status filter 15 -> 12 ms, a
    single-employee filter 0.4 -> 0.2 ms - while also removing a round trip. The parent
    side is built with `frappe.qb.get_query` so the caller's filters keep frappe's own
    operator handling and escaping instead of a hand-rolled WHERE clause.
    """
    base_ts_filters = {
        "start_date": [">=", weeks[0].get("start_date")],
        "end_date": ["<=", weeks[-1].get("end_date")],
        "docstatus": ["!=", 2],
    }
    if scope.approval_status:
        base_ts_filters["custom_weekly_approval_status"] = ["in", scope.approval_status]

    timesheet_query = frappe.qb.get_query(
        "Timesheet",
        filters=build_filters(base_ts_filters, scope.parsed_filters.get("Timesheet", [])),
        fields=["name", "employee", "start_date"],
    )
    detail_query = frappe.qb.get_query(
        "Timesheet Detail",
        filters=build_filters({"docstatus": ["!=", 2]}, scope.parsed_filters.get("Timesheet Detail", [])),
        fields=["parent", "task", "from_time"],
    )

    detail = frappe.qb.DocType("Timesheet Detail")
    joined = (
        detail_query.join(timesheet_query)
        .on(timesheet_query.name == detail.parent)
        .select(timesheet_query.employee, timesheet_query.start_date)
    )
    return joined.run(as_dict=True)


def resolve_project_participation(scope: ProjectTimesheetScope, weeks: list) -> dict:
    """Resolve which projects have qualifying activity, per week, before any pagination.

    The single source both project timesheet endpoints read: the week endpoint turns these
    sets into counts, the data endpoint paginates one of them. Deriving both from here is
    what stops a week's project count from disagreeing with its rows.

    Returns `{week_start: {"projects": set, "employees_by_project": {project: set}}}`.

    Unlike the team page's `get_team_week_participation`, this cannot be answered from
    `Timesheet` alone - project membership lives on `Task.project`, reachable only through
    `Timesheet Detail` - so the detail hop is unavoidable. It is still one pass over the
    whole range, bucketed into weeks in Python via `get_first_day_of_week`, so the week
    boundary matches the rest of the app rather than a hand-rolled SQL date expression that
    would ignore System Settings.
    """
    if not weeks:
        return {}

    participation = {
        week["start_date"]: {"projects": set(), "employees_by_project": defaultdict(set)} for week in weeks
    }

    details = get_project_timesheet_detail_rows(scope, weeks)
    if not details:
        return participation

    task_ids = list({detail.task for detail in details if detail.task})
    if not task_ids:
        return participation

    task_filters = build_filters(
        {"name": ["in", task_ids], "project": ["!=", ""]}, scope.parsed_filters.get("Task", [])
    )
    project_by_task = {
        task.name: task.project
        for task in get_all("Task", filters=task_filters, fields=["name", "project"])
        if task.get("project")
    }
    if not project_by_task:
        return participation

    matched_projects = set(project_by_task.values())
    if scope.search:
        matched_projects = set(
            get_all(
                "Project",
                filters=[["name", "in", sorted(matched_projects)]],
                or_filters=[["name", "like", f"%{scope.search}%"], ["project_name", "like", f"%{scope.search}%"]],
                pluck="name",
            )
        )
        if not matched_projects:
            return participation

    for detail in details:
        project = project_by_task.get(detail.task)
        if project is None or project not in matched_projects:
            continue
        # The rendered payload puts an entry in a week only when the parent timesheet's
        # start_date AND the entry's own from_time both fall in it
        # (`build_employee_week_details`). Participation applies the same conjunction,
        # otherwise a week could be counted here and render empty there - exactly the
        # count/rows drift the shared resolver exists to prevent.
        week_start = get_first_day_of_week(detail.start_date)
        if week_start != get_first_day_of_week(getdate(detail.from_time)):
            continue
        bucket = participation.get(week_start)
        if bucket is None:
            continue
        bucket["projects"].add(project)
        bucket["employees_by_project"][project].add(detail.employee)

    return participation


def has_scoped_project_timesheets_before(scope: ProjectTimesheetScope, date) -> bool:
    """Whether a week older than `date` could still hold a qualifying project for this scope.

    This is what tells the week endpoint to keep offering older pages, so it asks about
    *this* caller's filters rather than about the Timesheet table as a whole - otherwise an
    unrelated three-year-old timesheet would keep a filtered view paging backwards over
    weeks that can never produce a row.

    Deliberately an upper bound: Timesheet-level filters and stored approval statuses
    narrow it, while Task / Timesheet Detail filters and the project-name search do not,
    since answering those needs the full detail-and-task hop.

    Know what that bound costs before widening its use. Under those unapplied filters this
    can stay true across consecutive empty windows, and because the frontend leaves its
    infinite-scroll sentinel mounted on a page that rendered no weeks, those windows are
    requested automatically rather than on a scroll - so the tail is several round trips,
    not the single empty page it might look like. It is kept because answering exactly
    means joining Timesheet Detail to Task on every week request: measured at ~132ms under
    a Task filter against ~0.2ms here, on a call that is itself ~600ms, and paid even when
    nothing would have chained. Under-reporting would hide weeks that do have data, so the
    bound still leans the safe way.
    """
    filters = {"start_date": ["<", date], "docstatus": ["!=", 2]}
    if scope.approval_status:
        filters["custom_weekly_approval_status"] = ["in", scope.approval_status]

    return bool(
        get_all(
            "Timesheet",
            filters=build_filters(filters, scope.parsed_filters.get("Timesheet", [])),
            fields=["name"],
            limit=1,
        )
    )


def resolve_holiday_lists(employee_meta_map: dict, employee_names: list) -> dict:
    """Resolve every employee's holiday list in one query instead of one per employee.

    `get_holiday_list_for_employee` is overridden by hrms to read Holiday List
    Assignment, costing an assignment lookup per employee plus a company lookup per
    fallback. Called in a loop that is itself inside the chunk loop, that was the bulk
    of the per-page query count.

    Mirrors the hrms resolution order - latest submitted assignment for the employee as
    of today, else the same for their company - and falls back to the per-employee call
    when that override is not the one installed, so sites without hrms keep the
    erpnext behaviour.
    """
    if not employee_names:
        return {}

    override = frappe.get_hooks("employee_holiday_list")
    if not override or not override[-1].startswith("hrms."):
        return {name: get_holiday_list_for_employee(name, raise_exception=False) for name in employee_names}

    companies_by_employee = {name: (employee_meta_map.get(name) or {}).get("company") for name in employee_names}
    lookup_targets = {name for name in employee_names}
    lookup_targets.update(company for company in companies_by_employee.values() if company)

    as_on = getdate(None)
    assignments = get_all(
        "Holiday List Assignment",
        filters={
            "assigned_to": ["in", list(lookup_targets)],
            "from_date": ["<=", as_on],
            "docstatus": 1,
        },
        fields=["assigned_to", "holiday_list"],
        order_by="from_date asc",
    )
    # Ascending order means the last write per key is the latest assignment, matching
    # hrms's `order by from_date desc limit 1`.
    latest_by_target = {row.assigned_to: row.holiday_list for row in assignments}

    return {
        name: latest_by_target.get(name) or latest_by_target.get(companies_by_employee.get(name))
        for name in employee_names
    }


def get_holiday_dates_by_employee(employee_names: list, start_date, end_date) -> dict:
    """Batch-resolve each employee's holiday dates within `[start_date, end_date]` in a
    fixed number of queries, regardless of how many employees are passed - one to resolve
    holiday lists (see resolve_holiday_lists) and one to fetch the holidays themselves.
    Mirrors what build_chunk_context already does for holidays_by_employee, but over a
    caller-supplied date range instead of the currently viewed week."""
    if not employee_names:
        return {}

    employee_meta_map = {
        row.name: row
        for row in get_all("Employee", filters={"name": ["in", employee_names]}, fields=["name", "company"])
    }
    holiday_list_by_employee = resolve_holiday_lists(employee_meta_map, employee_names)

    holiday_lists = {hl for hl in holiday_list_by_employee.values() if hl}
    holidays_by_list = defaultdict(list)
    if holiday_lists:
        holidays = get_all(
            "Holiday",
            filters={"parent": ["in", list(holiday_lists)], "holiday_date": ["between", (start_date, end_date)]},
            fields=["parent", "holiday_date"],
        )
        for holiday in holidays:
            holidays_by_list[holiday.parent].append(str(holiday.holiday_date))

    return {name: holidays_by_list.get(holiday_list_by_employee.get(name), []) for name in employee_names}


def build_chunk_context(employees: list, dates: list, parsed_filters: dict):
    """Runs the filters to build the context for the list of employees passed."""
    employee_names = [employee.name for employee in employees]
    if not employee_names:
        return {
            "working_hours_map": {},
            "daily_norm_map": {},
            "leaves_by_employee": {},
            "holidays_by_employee": {},
            "backdate_boundary_by_employee": {},
            "timesheet_map": {},
            "emp_ts_by_start": {},
            "detail_by_parent": {},
            "task_details_dict": {},
            "week_status_map": {},
            "overall_status_map": {},
            "has_search_or_task_filters": False,
        }

    employee_meta_rows = get_all(
        "Employee",
        filters={"name": ["in", employee_names]},
        fields=["name", "custom_working_hours", "custom_work_schedule", "holiday_list", "company"],
    )
    employee_meta_map = {row.name: row for row in employee_meta_rows}
    resolved_holiday_lists = resolve_holiday_lists(employee_meta_map, employee_names)

    default_hours = frappe.db.get_single_value("HR Settings", "standard_working_hours") or 8
    working_hours_map = {}
    daily_norm_map = {}
    holiday_lists = set()

    for employee_name in employee_names:
        meta = employee_meta_map.get(employee_name) or {}
        working_hour = meta.get("custom_working_hours") or default_hours
        working_frequency = meta.get("custom_work_schedule") or "Per Day"
        working_hours_map[employee_name] = {
            "working_hour": working_hour or 8,
            "working_frequency": working_frequency,
        }
        daily_norm_map[employee_name] = (
            working_hours_map[employee_name]["working_hour"] / 5
            if working_frequency != "Per Day"
            else working_hours_map[employee_name]["working_hour"]
        )
        holiday_list = resolved_holiday_lists.get(employee_name) or meta.get("holiday_list")
        if holiday_list:
            holiday_lists.add(holiday_list)
        meta["resolved_holiday_list"] = holiday_list

    holidays_by_list = defaultdict(list)
    if holiday_lists:
        holidays = get_all(
            "Holiday",
            filters={
                "parent": ["in", list(holiday_lists)],
                "holiday_date": ["between", (dates[0].get("start_date"), dates[-1].get("end_date"))],
            },
            fields=["parent", "holiday_date", "description", "weekly_off"],
        )
        for holiday in holidays:
            holidays_by_list[holiday.parent].append(holiday)

    holidays_by_employee = {}
    for employee_name in employee_names:
        meta = employee_meta_map.get(employee_name) or {}
        holidays_by_employee[employee_name] = holidays_by_list.get(meta.get("resolved_holiday_list"), [])

    leaves_by_employee = defaultdict(list)
    leaves = get_employee_leaves(tuple(employee_names), dates[0].get("start_date"), dates[-1].get("end_date"))
    for leave in leaves:
        leaves_by_employee[leave.employee].append(leave)

    base_ts_filters = {
        "employee": ["in", employee_names],
        "start_date": [">=", dates[0].get("start_date")],
        "end_date": ["<=", dates[-1].get("end_date")],
        "docstatus": ["!=", 2],
    }
    ts_filters = build_filters(base_ts_filters, parsed_filters.get("Timesheet", []))
    all_timesheets = get_all(
        "Timesheet",
        filters=ts_filters,
        fields=[
            "name",
            "employee",
            "start_date",
            "end_date",
            "total_hours",
            "note",
            "custom_approval_status",
            "custom_weekly_approval_status",
        ],
    )
    ts_parent_map = {ts.name: ts for ts in all_timesheets}

    timesheet_map = defaultdict(list)
    emp_ts_by_start = defaultdict(lambda: defaultdict(list))
    week_status_map = {}
    overall_status_map = {}
    all_timesheet_names = []

    for timesheet in all_timesheets:
        timesheet_map[timesheet.employee].append(timesheet)
        emp_ts_by_start[timesheet.employee][timesheet.start_date].append(timesheet.name)
        week_status_map[(timesheet.employee, get_first_day_of_week(timesheet.start_date))] = (
            timesheet.get("custom_weekly_approval_status") or "Not Submitted"
        )
        all_timesheet_names.append(timesheet.name)

    for employee_name, items in timesheet_map.items():
        sorted_items = sorted(items, key=lambda item: item.start_date)
        timesheet_map[employee_name] = sorted_items
        overall_status_map[employee_name] = (
            sorted_items[-1].get("custom_weekly_approval_status") if sorted_items else "Not Submitted"
        ) or "Not Submitted"

    detail_by_parent = defaultdict(list)
    all_logs = []
    if all_timesheet_names:
        base_detail_filters = {"parent": ["in", all_timesheet_names]}
        detail_filters = build_filters(base_detail_filters, parsed_filters.get("Timesheet Detail", []))
        all_logs = get_all(
            "Timesheet Detail",
            filters=detail_filters,
            fields=ALLOWED_TIMESHET_DETAIL_FIELDS,
        )
        for log in all_logs:
            detail_by_parent[log.parent].append(log)

    task_details_dict = {}
    if all_logs:
        all_task_ids = list({log.task for log in all_logs if log.task})
        if all_task_ids:
            base_task_filters = {"name": ["in", all_task_ids]}
            task_filters = build_filters(base_task_filters, parsed_filters.get("Task", []))
            all_tasks = get_all("Task", filters=task_filters, fields=TASK_FIELDS)
            task_details_dict = {task["name"]: task for task in all_tasks}

    matched_parent_names = set(detail_by_parent.keys())
    if matched_parent_names and (parsed_filters.get("Task") or parsed_filters.get("Timesheet Detail")):
        for employee_name, timesheets in list(timesheet_map.items()):
            filtered_timesheets = [timesheet for timesheet in timesheets if timesheet.name in matched_parent_names]
            timesheet_map[employee_name] = filtered_timesheets
            emp_ts_by_start[employee_name] = defaultdict(list)
            for timesheet in filtered_timesheets:
                emp_ts_by_start[employee_name][timesheet.start_date].append(timesheet.name)
            if filtered_timesheets:
                latest_timesheet = filtered_timesheets[-1]
                overall_status_map[employee_name] = (
                    latest_timesheet.get("custom_weekly_approval_status") or "Not Submitted"
                )
            else:
                overall_status_map[employee_name] = "Not Submitted"

    has_search_or_task_filters = bool(parsed_filters.get("Task"))

    from next_pms.timesheet.doc_events.timesheet import get_backdate_restriction_boundaries

    backdate_boundary_by_employee = get_backdate_restriction_boundaries(employee_names)

    return {
        "working_hours_map": working_hours_map,
        "daily_norm_map": daily_norm_map,
        "leaves_by_employee": leaves_by_employee,
        "holidays_by_employee": holidays_by_employee,
        "backdate_boundary_by_employee": backdate_boundary_by_employee,
        "timesheet_map": timesheet_map,
        "emp_ts_by_start": emp_ts_by_start,
        "detail_by_parent": detail_by_parent,
        "ts_parent_map": ts_parent_map,
        "task_details_dict": task_details_dict,
        "week_status_map": week_status_map,
        "overall_status_map": overall_status_map,
        "has_search_or_task_filters": has_search_or_task_filters,
    }


def build_employee_week_details(
    employee_name: str,
    dates: list,
    context: dict,
    has_filters: bool,
    skip_empty_weeks: bool,
    approval_status: list[str] | None = None,
):
    week_details = {}
    emp_ts_by_start = context["emp_ts_by_start"].get(employee_name, {})
    detail_by_parent = context["detail_by_parent"]
    ts_parent_map = context["ts_parent_map"]
    task_details_dict = context["task_details_dict"]
    has_search_or_task_filters = context["has_search_or_task_filters"]

    for date_info in dates:
        week_key = date_info["key"]
        week_dates_set = set(date_info["dates"])
        week_ts_names = []
        for current_date in date_info["dates"]:
            week_ts_names.extend(emp_ts_by_start.get(current_date, []))

        tasks = {}
        week_total_hours = 0

        for ts_name in week_ts_names:
            for log in detail_by_parent.get(ts_name, []):
                log_date = getdate(log.from_time)
                if log_date not in week_dates_set:
                    continue

                if not has_search_or_task_filters:
                    week_total_hours += log.get("hours", 0)

                if not log.get("task"):
                    continue

                task = task_details_dict.get(log.task)
                if not task:
                    continue

                if has_search_or_task_filters:
                    week_total_hours += log.get("hours", 0)

                task_name = task["name"]
                if task_name not in tasks:
                    tasks[task_name] = {
                        "name": task_name,
                        "subject": task["subject"],
                        "project": task["project"],
                        "project_name": task["project_name"],
                        "is_billable": task["custom_is_billable"],
                        "expected_time": task["expected_time"],
                        "actual_time": task["actual_time"],
                        "status": task["status"],
                        "_liked_by": task["_liked_by"],
                        "exp_end_date": task["exp_end_date"] or "",
                        "data": [],
                    }

                entry = {field: log.get(field) for field in ALLOWED_TIMESHET_DETAIL_FIELDS}
                parent_ts = ts_parent_map.get(ts_name)
                entry["custom_approval_status"] = parent_ts.get("custom_approval_status") if parent_ts else None
                tasks[task_name]["data"].append(entry)

        week_status = context["week_status_map"].get((employee_name, date_info["start_date"]), "Not Submitted")
        should_skip_empty = has_filters and skip_empty_weeks
        should_skip_week = (should_skip_empty and not tasks) or (approval_status and week_status not in approval_status)
        if should_skip_week:
            continue

        week_details[week_key] = {
            **date_info,
            "total_hours": week_total_hours,
            "tasks": tasks,
            "status": week_status,
        }

    return week_details
