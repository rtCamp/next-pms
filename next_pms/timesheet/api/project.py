import json
from functools import partial

import frappe
from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_list, get_meta, only_for, whitelist
from frappe.utils import flt, getdate

from next_pms.api.utils import error_logger

from . import get_count
from .utils import (
    build_aggregate_dates,
    build_employee_week_details,
    get_project_candidate_employee_ids,
    normalize_status_filter,
    paginate_qualifying_employee_payloads,
    parse_filters,
)


@whitelist(methods=["GET"])
def get_projects(
    limit=20,
    currency=None,
    fields=None,
    filters=None,
    or_filters=None,
    start=0,
    order_by="modified desc",
):
    """Returns list of projects based on filters and fields provided. If currency is provided, it converts the currency fields to the provided currency based on the exchange rate as of today."""
    meta = get_meta("Project")
    if isinstance(fields, str):
        fields = json.loads(fields)
    if isinstance(filters, str):
        filters = json.loads(filters)

    if not fields:
        fields = meta.default_fields

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
        int(start),
        int(page_length),
        int(max_week),
        normalize_status_filter(approval_status, coerce_non_list=True),
        _coerce_project_skip_empty_weeks(skip_empty_weeks),
    )


def _get_project_response_dates(dates: list, max_week: int, has_filters: bool):
    if has_filters and len(dates) > max_week:
        return dates[-max_week:]

    return dates


def _prepare_project_timesheet_context(
    date: str,
    max_week: int,
    reports_to: str | None,
    filters: str | list | None,
    search: str | None,
    approval_statuses: list[str] | None,
):
    parsed_filters = parse_filters(filters)
    has_filters = bool(search or approval_statuses or any(parsed_filters.values()))
    dates, _ = build_aggregate_dates(date=date, max_week=max_week, has_filters=has_filters)

    return {
        "parsed_filters": parsed_filters,
        "has_filters": has_filters,
        "dates": dates,
        "response_dates": _get_project_response_dates(dates, max_week, has_filters),
        "candidate_employee_ids": get_project_candidate_employee_ids(
            reports_to=reports_to,
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
    reports_to: str | None = None,
    page_length=10,
    start=0,
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
        reports_to=reports_to,
        filters=filters,
        search=search,
        approval_statuses=approval_statuses,
    )

    if project_context["candidate_employee_ids"] == []:
        return {
            "week_groups": [],
            "total_count": 0,
            "has_more": False,
        }

    selected_employees, total_count, has_more = paginate_qualifying_employee_payloads(
        reports_to=reports_to,
        employee_ids=project_context["candidate_employee_ids"],
        dates=project_context["dates"],
        parsed_filters=project_context["parsed_filters"],
        search=search,
        start=start,
        page_length=page_length,
        builder=partial(
            _build_project_employee_payload,
            dates=project_context["dates"],
            response_dates=project_context["response_dates"],
            has_filters=project_context["has_filters"],
            skip_empty_weeks=skip_empty_weeks,
            approval_statuses=approval_statuses,
        ),
    )

    employee_data_map = {employee_name: payload for employee_name, payload in selected_employees}
    week_groups = _build_project_week_groups(project_context["response_dates"], employee_data_map)

    if project_context["has_filters"] and skip_empty_weeks:
        week_groups = [week_group for week_group in week_groups if week_group.get("projects")]

    return {
        "week_groups": week_groups,
        "total_count": total_count,
        "has_more": has_more,
    }
