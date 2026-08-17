import json

import frappe
from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_all, get_list, get_meta, get_value, only_for, whitelist
from frappe.utils import add_days, flt, getdate

from next_pms.api.utils import error_logger
from next_pms.timesheet.utils.constant import (
    MAX_PROJECT_TIMESHEET_PAGE_LENGTH,
    PROJECT_TIMESHEET_PAGE_LENGTH,
)

from . import filter_employees, get_count
from .utils import (
    build_chunk_context,
    build_employee_week_details,
    employee_has_higher_access,
    get_week_dates,
    has_scoped_project_timesheets_before,
    normalize_status_filter,
    resolve_project_participation,
    resolve_project_scope,
)


@whitelist(methods=["GET"])
def get_projects(
    limit: int = 20,
    currency: str | None = None,
    fields: list | str | None = None,
    filters: list | str | None = None,
    or_filters: list | str | None = None,
    start: int = 0,
    order_by: str = "modified desc",
    employee: str | None = None,
):
    """Returns list of projects based on filters and fields provided. If currency is provided, it converts the currency fields to the provided currency based on the exchange rate as of today."""
    meta = get_meta("Project")
    if isinstance(fields, str):
        fields = json.loads(fields)
    if isinstance(filters, str):
        filters = json.loads(filters)
    if isinstance(or_filters, str):
        or_filters = json.loads(or_filters)

    if not fields:
        fields = list(meta.default_fields)  # Copy to avoid mutating class attribute

    if "custom_currency" not in fields:
        fields.append("custom_currency")

    if not filters:
        filters = get_project_filter_for_contractor()
    else:
        filters += get_project_filter_for_contractor()
    filters += get_project_filter_for_employee(employee)
    project_lists = get_list(
        "Project",
        fields=fields,
        filters=filters,
        limit_start=start,
        limit=limit,
        order_by=order_by,
        or_filters=or_filters,
    )
    count = get_count("Project", filters=filters, or_filters=or_filters)
    has_more = int(start) + int(limit) < count

    if not limit:
        has_more = False
    if not currency or len(currency) == 0:
        return {
            "data": project_lists,
            "has_more": has_more,
            "total_count": count,
        }

    currency_fields = get_currency_fields(meta.fields)
    date = getdate()

    for project in project_lists:
        project_currency = project.custom_currency
        if project_currency == currency:
            continue
        rate = get_rate_as_at(date, project_currency, currency)
        for field in currency_fields:
            if field in project:
                project[field] = convert(project.get(field), rate)

    return {
        "data": project_lists,
        "has_more": has_more,
        "total_count": count,
    }


def get_currency_fields(meta_fields):
    currency_fields = []

    for field in meta_fields:
        if field.fieldtype == "Currency":
            currency_fields.append(field.fieldname)
    return currency_fields


def convert(value, rate):
    converted_value = flt(value) * (rate or 1)
    return converted_value


def get_project_filter_for_contractor(only_list=False):
    if "Contractor" in frappe.get_roles() and frappe.session.user != "Administrator":
        names = frappe.share.get_shared("Project", frappe.session.user, filters=[["everyone", "=", False]])
        if only_list:
            return names
        return [["name", "in", names]]

    return []


@whitelist(methods=["GET"])
@error_logger
def get_employee_project_ids(employee: str):
    """Return every Project name the given employee can access — individually shared, or via "everyone"."""
    if not employee:
        return []
    if not employee_has_higher_access(employee, ptype="read"):
        frappe.throw(frappe._("You are not authorized to view this employee's projects."), frappe.PermissionError)

    everyone_projects = get_all("DocShare", filters={"share_doctype": "Project", "everyone": 1}, pluck="share_name")
    user_id = get_value("Employee", employee, "user_id")
    shared_projects = (
        get_all(
            "DocShare",
            filters={"share_doctype": "Project", "user": user_id, "everyone": 0},
            pluck="share_name",
        )
        if user_id
        else []
    )
    return list(set(everyone_projects) | set(shared_projects))


def get_project_filter_for_employee(employee: str | None):
    if not employee:
        return []
    return [["name", "in", get_employee_project_ids(employee)]]


@whitelist(methods=["GET"])
@error_logger
def get_project_employee_access(project: str | None = None, employee: str | None = None):
    """Whether `project` has any member, whether `employee` has any project, and whether this pair is valid together."""
    if employee and not employee_has_higher_access(employee, ptype="read"):
        frappe.throw(frappe._("You are not authorized to view this employee's project access."), frappe.PermissionError)

    def is_shared(share_filter):
        return bool(frappe.db.exists("DocShare", {"share_doctype": "Project", **share_filter}))

    user_id = get_value("Employee", employee, "user_id") if employee else None

    is_project_shared_with_everyone = bool(project) and is_shared({"share_name": project, "everyone": 1})
    is_employee_shared_on_project = (
        bool(project) and bool(user_id) and is_shared({"share_name": project, "user": user_id, "everyone": 0})
    )

    has_any_member = bool(project) and (
        is_project_shared_with_everyone or is_shared({"share_name": project, "everyone": 0})
    )
    has_any_project = bool(user_id) and (
        is_employee_shared_on_project or is_shared({"everyone": 1}) or is_shared({"user": user_id, "everyone": 0})
    )
    is_valid = bool(project and employee) and (is_project_shared_with_everyone or is_employee_shared_on_project)

    return {"has_any_member": has_any_member, "has_any_project": has_any_project, "is_valid": is_valid}


def _group_week_tasks_by_project(tasks: dict):
    project_tasks_map = {}

    for task_name, task_data in tasks.items():
        project = task_data.get("project")
        if not project:
            continue

        project_tasks_map.setdefault(project, {})
        project_tasks_map[project][task_name] = task_data

    return project_tasks_map


def _build_project_member_payload(employee, employee_data: dict, project_tasks: dict):
    """One member's row inside one project for one week.

    Shared by `get_project_timesheet_data` and `get_project_timesheet_member_week`, so the
    realtime payload is the same object the page already renders rather than a parallel
    shape that can drift out of step with it.
    """
    working_hours = employee_data["working_hours"]
    return {
        "label": employee_data["employee_name"],
        "employee": employee,
        "avatar_url": employee_data["image"],
        "tasks": project_tasks,
        "holidays": employee_data["holidays"],
        "leaves": employee_data["leaves"],
        "working_hour": working_hours.get("working_hour", 8),
        "working_frequency": working_hours.get("working_frequency", "Per Day"),
        "status": employee_data["status"],
    }


def _collect_employee_week_data(employees: list, week: dict, context: dict, scope, approval_statuses):
    """Resolve each employee's week once, grouped by project.

    Done up front rather than per project because one employee can appear under several
    projects in the same week, and rebuilding their week for each would repeat the work.
    """
    employee_data_map = {}
    for employee in employees:
        week_details = build_employee_week_details(
            employee_name=employee.name,
            dates=[week],
            context=context,
            has_filters=scope.has_filters,
            skip_empty_weeks=False,
            approval_status=approval_statuses,
        )
        week_detail = week_details.get(week["key"])
        if not week_detail:
            continue

        project_tasks_map = _group_week_tasks_by_project(week_detail.get("tasks", {}))
        if not project_tasks_map:
            continue

        employee_data_map[employee.name] = {
            "employee_name": employee.employee_name,
            "image": employee.image,
            "working_hours": context["working_hours_map"].get(
                employee.name, {"working_hour": 0, "working_frequency": "Per Day"}
            ),
            "holidays": list(context["holidays_by_employee"].get(employee.name, [])),
            "leaves": list(context["leaves_by_employee"].get(employee.name, [])),
            "status": week_detail.get("status", "Not Submitted"),
            "project_tasks": project_tasks_map,
        }
    return employee_data_map


@whitelist(methods=["GET", "POST"])
@error_logger
def get_project_timesheet_data(
    start_date: str,
    page_length: int = PROJECT_TIMESHEET_PAGE_LENGTH,
    start: int = 0,
    filters: str | list | None = None,
    search: str | None = None,
    approval_status: str | list | None = None,
):
    """Projects of a single week, paginated, with their members.

    `start_date` is any day inside the wanted week; the week boundaries come from
    `get_week_dates`, so the caller does not supply an end date.

    Pairs with `get_project_timesheet_weeks`, which supplies the week structure and the
    counts. Both derive membership from `resolve_project_participation`, so this endpoint's
    `total_count` and that endpoint's `project_count` cannot drift.
    """
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    start = max(0, int(start))
    page_length = max(0, min(int(page_length), MAX_PROJECT_TIMESHEET_PAGE_LENGTH))
    week = get_week_dates(date=start_date)

    approval_status = normalize_status_filter(approval_status, coerce_non_list=True)
    approval_statuses = approval_status if isinstance(approval_status, list) else None

    scope = resolve_project_scope(
        date=start_date,
        max_week=1,
        filters=filters,
        search=search,
        approval_status=approval_statuses,
    )

    response = {
        "start_date": week["start_date"],
        "end_date": week["end_date"],
        "dates": week["dates"],
        "projects": [],
        "total_count": 0,
        "has_more": False,
    }

    participation = resolve_project_participation(scope, [week])
    bucket = participation.get(week["start_date"]) or {}
    qualifying = bucket.get("projects") or set()
    response["total_count"] = len(qualifying)

    if not qualifying or not page_length or start >= len(qualifying):
        return response

    response["has_more"] = start + page_length < len(qualifying)

    # Ordered by the name the UI displays, and paginated in the database. Ordering by
    # project id instead would let page 2 interleave into page 1 once the client sorts
    # by name.
    ordered_projects = get_all(
        "Project",
        filters=[["name", "in", sorted(qualifying)]],
        fields=["name", "project_name"],
        order_by="project_name asc, name asc",
        limit_start=start,
        limit_page_length=page_length,
    )
    if not ordered_projects:
        return response

    selected_project_ids = [project.name for project in ordered_projects]
    employees_by_project = bucket.get("employees_by_project") or {}
    employee_ids = sorted(
        {employee for project in selected_project_ids for employee in employees_by_project.get(project, set())}
    )
    if not employee_ids:
        return response

    # `ignore_default_filters` because participation was resolved from Timesheet rows,
    # which carry no employee-status condition. Letting `filter_employees` re-apply its
    # default `status = Active` would drop a departed employee's rows while their project
    # still occupies a slot in `total_count` and in this page, rendering it memberless.
    # Employee status stays filterable - `resolve_project_scope` folds an explicit
    # `Employee.status` filter into the participation query, so it is honoured there.
    employees, _ = filter_employees(
        page_length=len(employee_ids), start=0, ids=employee_ids, ignore_default_filters=True
    )
    # Context spans only this week. It used to be built across the whole (up to 12-week)
    # lookback and then mostly discarded, which dominated the cost of a filtered request.
    context = build_chunk_context(employees=employees, dates=[week], parsed_filters=scope.parsed_filters)
    employee_data_map = _collect_employee_week_data(employees, week, context, scope, approval_statuses)

    projects = []
    for project in ordered_projects:
        members = [
            _build_project_member_payload(employee, employee_data, employee_data["project_tasks"][project.name])
            for employee, employee_data in employee_data_map.items()
            if project.name in employee_data["project_tasks"]
        ]
        if members:
            projects.append({"project": project.name, "project_name": project.project_name, "members": members})

    response["projects"] = projects
    return response


@whitelist(methods=["GET", "POST"])
@error_logger
def get_project_timesheet_weeks(
    date: str,
    max_week: int = 4,
    filters: str | list | None = None,
    search: str | None = None,
    approval_status: str | list | None = None,
):
    """Week structure and per-week project counts, without project or member payloads.

    Feeds first paint: the page can render its week rows before any project data is
    fetched, and `get_project_timesheet_data` then fills one week at a time.

    Pairs with that endpoint - both derive membership from `resolve_project_participation`,
    so this endpoint's `project_count` and its `total_count` cannot drift apart.
    """
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    max_week = int(max_week)
    approval_status = normalize_status_filter(approval_status, coerce_non_list=True)
    approval_statuses = approval_status if isinstance(approval_status, list) else None

    scope = resolve_project_scope(
        date=date,
        max_week=max_week,
        filters=filters,
        search=search,
        approval_status=approval_statuses,
    )
    weeks = scope.response_dates
    if not weeks:
        return {"weeks": [], "has_more_weeks": False, "next_date": None}

    participation = resolve_project_participation(scope, weeks)

    week_payloads = []
    for week in weeks:
        projects = participation.get(week["start_date"], {}).get("projects", set())
        if scope.skip_empty_weeks and not projects:
            continue

        week_payloads.append(
            {
                "key": str(week["start_date"]),
                "start_date": week["start_date"],
                "end_date": week["end_date"],
                "label": week["key"],
                "dates": week["dates"],
                "project_count": len(projects),
                "has_more_projects": len(projects) > PROJECT_TIMESHEET_PAGE_LENGTH,
            }
        )

    # Asked against this caller's scope rather than the Timesheet table as a whole: with
    # empty weeks dropped, `week_payloads` can legitimately come back empty, and a global
    # probe would then keep the frontend paging backwards to the oldest timesheet in
    # history.
    earliest = weeks[0]["start_date"]
    has_more_weeks = has_scoped_project_timesheets_before(scope, earliest)

    return {
        "weeks": week_payloads,
        "has_more_weeks": has_more_weeks,
        "next_date": add_days(getdate(earliest), -1) if has_more_weeks else None,
    }


@error_logger
def get_project_timesheet_member_week(employee: str, start_date: str, by_pass_access_check: bool = False):
    """One employee's week, grouped by project - the unit the realtime publisher swaps in.

    Deliberately not whitelisted. `by_pass_access_check` exists for the publisher, which
    runs as whoever saved the timesheet and so cannot be assumed to hold the viewing roles;
    exposing that switch over HTTP would let any logged-in user skip `only_for` and read
    another employee's tasks, hours and leave. The page never calls this directly - it
    reads `get_project_timesheet_data` - so there is nothing to expose.

    Keyed by project rather than returning a single project because one employee-week can
    span several projects, and an edit can *remove* them from one (task reassigned, last
    entry deleted). Returning the complete per-project state for the week lets a listener
    both replace and remove rows; a single-project payload could not express removal.

    Each `member` is exactly one element of `get_project_timesheet_data`'s `members`.
    """
    if not by_pass_access_check:
        only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    week = get_week_dates(date=start_date)
    employee_rows, _ = filter_employees(page_length=1, start=0, ids=[employee], ignore_default_filters=True)

    response = {
        "employee": employee,
        "start_date": week["start_date"],
        "end_date": week["end_date"],
        "dates": week["dates"],
        "projects": {},
    }
    if not employee_rows:
        return response

    scope = resolve_project_scope(date=start_date, max_week=1)
    context = build_chunk_context(employees=employee_rows, dates=[week], parsed_filters=scope.parsed_filters)
    employee_data_map = _collect_employee_week_data(employee_rows, week, context, scope, None)

    employee_data = employee_data_map.get(employee)
    if not employee_data:
        return response

    for project, project_tasks in employee_data["project_tasks"].items():
        first_task = next(iter(project_tasks.values()))
        response["projects"][project] = {
            "project": project,
            "project_name": first_task.get("project_name"),
            "member": _build_project_member_payload(employee, employee_data, project_tasks),
        }

    return response
