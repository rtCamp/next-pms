import json

import frappe
from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_list, get_meta, only_for, whitelist
from frappe.utils import flt, getdate

from next_pms.api.utils import error_logger

from . import filter_employees, get_count
from .utils import (
    build_aggregate_dates,
    build_chunk_context,
    build_employee_week_details,
    get_employees_for_projects,
    get_qualifying_project_ids,
    normalize_status_filter,
    parse_filters,
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
):
    """Returns list of projects based on filters and fields provided. If currency is provided, it converts the currency fields to the provided currency based on the exchange rate as of today."""
    meta = get_meta("Project")
    if isinstance(fields, str):
        fields = json.loads(fields)
    if isinstance(filters, str):
        filters = json.loads(filters)

    if not fields:
        fields = list(meta.default_fields)  # Copy to avoid mutating class attribute

    if "custom_currency" not in fields:
        fields.append("custom_currency")

    if not filters:
        filters = get_project_filter_for_contractor()
    else:
        filters += get_project_filter_for_contractor()
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


def _coerce_project_skip_empty_weeks(skip_empty_weeks: bool | str):
    if isinstance(skip_empty_weeks, str):
        return skip_empty_weeks.lower() in ("true", "1")

    return skip_empty_weeks


def _normalize_project_timesheet_inputs(
    start: int | str,
    page_length: int | str,
    max_week: int | str,
    approval_status: str | list | None,
    skip_empty_weeks: bool | str,
):
    return (
        max(0, int(start)),
        max(0, int(page_length)),
        int(max_week),
        normalize_status_filter(approval_status, coerce_non_list=True),
        _coerce_project_skip_empty_weeks(skip_empty_weeks),
    )


def _apply_employee_filters(parsed_filters: dict):
    """Translate Employee-level filters into a Timesheet ``employee IN (...)`` constraint.

    The qualifying-project, employee-selection and render queries all read
    ``parsed_filters["Timesheet"]``, so resolving Employee filters to employee IDs here
    applies them consistently everywhere instead of being silently dropped.
    """
    employee_filters = parsed_filters.get("Employee")
    if not employee_filters:
        return

    employee_names = frappe.get_all("Employee", filters=employee_filters, pluck="name")
    parsed_filters["Timesheet"] = [*parsed_filters.get("Timesheet", []), ["employee", "in", employee_names]]


def _prepare_project_timesheet_context(
    date: str,
    max_week: int,
    filters: str | list | None,
    search: str | None,
    approval_statuses: list[str] | None,
):
    parsed_filters = parse_filters(filters)
    has_filters = bool(search or approval_statuses or any(parsed_filters.values()))
    _apply_employee_filters(parsed_filters)
    dates, _ = build_aggregate_dates(date=date, max_week=max_week, has_filters=has_filters)

    return {
        "parsed_filters": parsed_filters,
        "has_filters": has_filters,
        "dates": dates,
        # Under filters, `dates` spans the full (up to 12-week) lookback used to locate
        # matching data and empty weeks are dropped downstream — render that whole span so
        # data in older weeks is not hidden by trimming to the most recent `max_week`.
        "response_dates": dates,
        "candidate_project_ids": get_qualifying_project_ids(
            dates=dates,
            parsed_filters=parsed_filters,
            search=search,
            approval_status=approval_statuses,
        ),
    }


def _filter_project_week_details(week_details: dict):
    filtered_week_details = {}

    for week_key, week_detail in week_details.items():
        project_tasks = {
            task_name: task_data
            for task_name, task_data in week_detail.get("tasks", {}).items()
            if task_data.get("project")
        }
        if not project_tasks:
            continue

        filtered_week_details[week_key] = {
            **week_detail,
            "tasks": project_tasks,
        }

    return filtered_week_details


def _trim_project_week_details(
    week_details: dict,
    response_dates: list,
    has_filters: bool,
    skip_empty_weeks: bool,
):
    if has_filters and skip_empty_weeks:
        response_week_keys = {date_info["key"] for date_info in response_dates}
        week_details = {
            week_key: week_detail for week_key, week_detail in week_details.items() if week_key in response_week_keys
        }

    if has_filters and len(week_details) > len(response_dates):
        sorted_keys = list(week_details.keys())
        week_details = {key: week_details[key] for key in sorted_keys[-len(response_dates) :]}

    return week_details


def _build_project_employee_payload(
    employee,
    context: dict,
    dates: list,
    response_dates: list,
    has_filters: bool,
    skip_empty_weeks: bool,
    approval_statuses: list[str] | None = None,
):
    week_details = build_employee_week_details(
        employee_name=employee.name,
        dates=dates,
        context=context,
        has_filters=has_filters,
        skip_empty_weeks=skip_empty_weeks,
        approval_status=approval_statuses,
    )
    week_details = _filter_project_week_details(week_details)
    week_details = _trim_project_week_details(
        week_details=week_details,
        response_dates=response_dates,
        has_filters=has_filters,
        skip_empty_weeks=skip_empty_weeks,
    )

    if not week_details:
        return None

    working_hours = context["working_hours_map"].get(employee.name, {"working_hour": 0, "working_frequency": "Per Day"})
    return employee.name, {
        "employee_name": employee.employee_name,
        "image": employee.image,
        "working_hours": working_hours,
        "holidays": list(context["holidays_by_employee"].get(employee.name, [])),
        "leaves": list(context["leaves_by_employee"].get(employee.name, [])),
        "week_details": week_details,
    }


def _group_week_tasks_by_project(tasks: dict):
    project_tasks_map = {}

    for task_name, task_data in tasks.items():
        project = task_data.get("project")
        if not project:
            continue

        project_tasks_map.setdefault(project, {})
        project_tasks_map[project][task_name] = task_data

    return project_tasks_map


def _build_project_week_groups(response_dates: list, employee_data_map: dict):
    week_groups = []

    for date_info in response_dates:
        week_key = date_info["key"]
        project_groups = {}

        for emp_name, emp_data in employee_data_map.items():
            week_detail = emp_data["week_details"].get(week_key)
            if not week_detail:
                continue

            project_tasks_map = _group_week_tasks_by_project(week_detail.get("tasks", {}))
            if not project_tasks_map:
                continue

            for project, project_tasks in project_tasks_map.items():
                if project not in project_groups:
                    first_task = next(iter(project_tasks.values()))
                    project_groups[project] = {
                        "project": project,
                        "project_name": first_task.get("project_name"),
                        "members": [],
                    }

                project_groups[project]["members"].append(
                    {
                        "label": emp_data["employee_name"],
                        "employee": emp_name,
                        "avatar_url": emp_data["image"],
                        "tasks": project_tasks,
                        "holidays": emp_data["holidays"],
                        "leaves": emp_data["leaves"],
                        "working_hour": emp_data["working_hours"].get("working_hour", 8),
                        "working_frequency": emp_data["working_hours"].get("working_frequency", "Per Day"),
                        "status": week_detail.get("status", "Not Submitted"),
                    }
                )

        week_groups.append(
            {
                "key": week_key,
                "start_date": date_info["start_date"],
                "end_date": date_info["end_date"],
                "dates": date_info["dates"],
                "projects": list(project_groups.values()),
            }
        )

    return week_groups


@whitelist(methods=["GET", "POST"])
@error_logger
def get_project_timesheet_data(
    date: str,
    max_week: int = 2,
    page_length: int = 10,
    start: int = 0,
    filters: str | list | None = None,
    search: str | None = None,
    approval_status: str | list | None = None,
    skip_empty_weeks: bool = False,
):
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    start, page_length, max_week, approval_status, skip_empty_weeks = _normalize_project_timesheet_inputs(
        start=start,
        page_length=page_length,
        max_week=max_week,
        approval_status=approval_status,
        skip_empty_weeks=skip_empty_weeks,
    )
    approval_statuses = approval_status if isinstance(approval_status, list) else None

    project_context = _prepare_project_timesheet_context(
        date=date,
        max_week=max_week,
        filters=filters,
        search=search,
        approval_statuses=approval_statuses,
    )

    all_project_ids = project_context["candidate_project_ids"]
    if not all_project_ids:
        return {
            "week_groups": _build_project_week_groups(project_context["response_dates"], {}),
            "total_count": 0,
            "has_more": False,
        }

    # Paginate project IDs directly — no DB round-trip needed. `start`/`page_length` are
    # already clamped to >= 0, so an empty/zero page can never report `has_more`.
    total_count = len(all_project_ids)
    end = start + page_length
    selected_project_ids = all_project_ids[start:end]
    has_more = page_length > 0 and end < total_count

    # Get the employees who logged time to this page's projects.
    employee_ids = get_employees_for_projects(
        project_ids=selected_project_ids,
        dates=project_context["dates"],
        parsed_filters=project_context["parsed_filters"],
        approval_status=approval_statuses,
    )
    if not employee_ids:
        return {
            "week_groups": _build_project_week_groups(project_context["response_dates"], {}),
            "total_count": total_count,
            "has_more": has_more,
        }

    employees, _ = filter_employees(page_length=len(employee_ids), start=0, ids=employee_ids)
    context = build_chunk_context(
        employees=employees,
        dates=project_context["dates"],
        parsed_filters=project_context["parsed_filters"],
        search=search,
    )

    employee_data_map = {}
    for employee in employees:
        payload = _build_project_employee_payload(
            employee=employee,
            context=context,
            dates=project_context["dates"],
            response_dates=project_context["response_dates"],
            has_filters=project_context["has_filters"],
            skip_empty_weeks=skip_empty_weeks,
            approval_statuses=approval_statuses,
        )
        if payload:
            emp_name, emp_data = payload
            employee_data_map[emp_name] = emp_data

    week_groups = _build_project_week_groups(project_context["response_dates"], employee_data_map)

    # Restrict each week to only the selected projects — employees may have
    # logged to other projects that should appear on a different page.
    selected_project_set = set(selected_project_ids)
    for week_group in week_groups:
        week_group["projects"] = [p for p in week_group["projects"] if p["project"] in selected_project_set]

    # Under filters the render span is the full lookback, so collapse it to the weeks that
    # actually hold matching data — otherwise older empty weeks would pad the response.
    # Runs after the project restriction so weeks emptied by it are dropped too.
    if project_context["has_filters"]:
        week_groups = [week_group for week_group in week_groups if week_group.get("projects")]

    return {
        "week_groups": week_groups,
        "total_count": total_count,
        "has_more": has_more,
    }


@whitelist(methods=["GET"])
@error_logger
def get_project_timesheet_pending_count(
    date: str,
    max_week: int = 2,
):
    """Return the count of employees with at least one 'Approval Pending' week for project tasks."""
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates, _ = build_aggregate_dates(date=date, max_week=int(max_week), has_filters=False)
    if not dates:
        return {"count": 0}

    ts_filters = {
        "start_date": [">=", dates[0]["start_date"]],
        "end_date": ["<=", dates[-1]["end_date"]],
        "docstatus": ["!=", 2],
        "custom_weekly_approval_status": "Approval Pending",
    }
    timesheets = frappe.get_all("Timesheet", filters=ts_filters, fields=["name", "employee"])
    if not timesheets:
        return {"count": 0}

    ts_names = [ts.name for ts in timesheets]
    details = frappe.get_all(
        "Timesheet Detail", filters={"parent": ["in", ts_names], "task": ["!=", ""]}, fields=["parent", "task"]
    )
    task_ids = list({d.task for d in details if d.task})
    if not task_ids:
        return {"count": 0}

    # Only count tasks that belong to a project, matching the project-timesheet view's
    # qualification (a task with no project never appears there).
    project_task_ids = set(
        frappe.get_all("Task", filters={"name": ["in", task_ids], "project": ["!=", ""]}, pluck="name")
    )
    matched_parents = {d.parent for d in details if d.task in project_task_ids}
    if not matched_parents:
        return {"count": 0}

    count = len({ts.employee for ts in timesheets if ts.name in matched_parents})
    return {"count": count}
