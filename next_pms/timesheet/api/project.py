import json

import frappe
from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_all, get_list, get_meta, only_for, whitelist
from frappe.utils import add_days, flt, getdate

from next_pms.api.utils import error_logger
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.utils.constant import ALLOWED_TIMESHET_DETAIL_FIELDS

from . import filter_employees, get_count
from .employee import get_employee_daily_working_norm, get_employee_working_hours
from .timesheet import get_timesheet_state
from .utils import build_filters, get_holidays, get_week_dates, parse_filters


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


@whitelist(methods=["GET"])
@error_logger
def get_project_timesheet_data(
    date: str,
    max_week: int = 2,
    reports_to: str | None = None,
    page_length=10,
    start=0,
    filters: str | list | None = None,
):
    only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates = []
    for i in range(max_week):
        week = get_week_dates(date=date)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)

    dates.reverse()

    employees, total_count = filter_employees(
        page_length=page_length,
        start=start,
        reports_to=reports_to,
    )
    employee_names = [employee.name for employee in employees]

    if not employee_names:
        return {
            "week_groups": _build_empty_week_groups(dates),
            "has_more": False,
        }

    parsed_filters = parse_filters(filters)

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
        ],
    )

    timesheet_map = {}
    all_timesheet_names = []
    for ts in all_timesheets:
        timesheet_map.setdefault(ts.employee, []).append(ts)
        all_timesheet_names.append(ts.name)

    all_logs = []
    detail_by_parent = {}
    if all_timesheet_names:
        base_detail_filters = {"parent": ["in", all_timesheet_names]}
        detail_filters = build_filters(base_detail_filters, parsed_filters.get("Timesheet Detail", []))
        all_logs = get_all(
            "Timesheet Detail",
            filters=detail_filters,
            fields=ALLOWED_TIMESHET_DETAIL_FIELDS,
        )
        for log in all_logs:
            detail_by_parent.setdefault(log.parent, []).append(log)

    task_details_dict = {}
    if all_logs:
        all_task_ids = list({log.task for log in all_logs if log.task})
        if all_task_ids:
            base_task_filters = {"name": ["in", all_task_ids]}
            task_filters = build_filters(base_task_filters, parsed_filters.get("Task", []))
            all_tasks = get_all(
                "Task",
                filters=task_filters,
                fields=[
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
                ],
            )
            task_details_dict = {task["name"]: task for task in all_tasks}

    employee_data_map = {}

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        daily_working_hours = get_employee_daily_working_norm(employee.name)

        emp_timesheets = timesheet_map.get(employee.name, [])

        leaves = get_employee_leaves(
            start_date=add_days(dates[0].get("start_date"), -max_week * 7),
            end_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )
        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        emp_ts_by_start = {}
        for ts in emp_timesheets:
            emp_ts_by_start.setdefault(ts.start_date, []).append(ts.name)

        week_details = {}

        for date_info in dates:
            week_key = date_info["key"]
            week_dates_set = set(date_info["dates"])

            week_ts_names = []
            for d in date_info["dates"]:
                week_ts_names.extend(emp_ts_by_start.get(d, []))

            tasks = {}
            week_total_hours = 0

            for ts_name in week_ts_names:
                for log in detail_by_parent.get(ts_name, []):
                    log_date = getdate(log.from_time)
                    if log_date not in week_dates_set:
                        continue

                    week_total_hours += log.get("hours", 0)

                    if not log.get("task"):
                        continue

                    task = task_details_dict.get(log.task)
                    if not task:
                        continue

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

                    tasks[task_name]["data"].append({field: log.get(field) for field in ALLOWED_TIMESHET_DETAIL_FIELDS})

            week_status = get_timesheet_state(
                employee=employee.name,
                start_date=date_info["dates"][0],
                end_date=date_info["dates"][-1],
            )

            week_details[week_key] = {
                **date_info,
                "total_hours": week_total_hours,
                "tasks": tasks,
                "status": week_status,
            }

        employee_data_map[employee.name] = {
            "employee_name": employee.employee_name,
            "image": employee.image,
            "working_hours": working_hours,
            "daily_working_hours": daily_working_hours,
            "holidays": holidays,
            "leaves": leaves,
            "week_details": week_details,
        }

    week_groups = []
    for date_info in dates:
        week_key = date_info["key"]
        project_groups = {}

        for emp_name, emp_data in employee_data_map.items():
            week_detail = emp_data["week_details"].get(week_key)
            if not week_detail:
                continue

            tasks = week_detail.get("tasks", {})
            if not tasks:
                continue

            project_tasks_map = {}
            for task_name, task_data in tasks.items():
                proj = task_data.get("project")
                if not proj:
                    continue
                project_tasks_map.setdefault(proj, {})
                project_tasks_map[proj][task_name] = task_data

            for proj, proj_tasks in project_tasks_map.items():
                if proj not in project_groups:
                    first_task = next(iter(proj_tasks.values()))
                    project_groups[proj] = {
                        "project": proj,
                        "project_name": first_task.get("project_name"),
                        "members": [],
                    }

                project_groups[proj]["members"].append(
                    {
                        "label": emp_data["employee_name"],
                        "employee": emp_name,
                        "avatar_url": emp_data["image"],
                        "tasks": proj_tasks,
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

    has_more = int(start) + int(page_length) < total_count

    return {
        "week_groups": week_groups,
        "has_more": has_more,
    }


def _build_empty_week_groups(dates):
    return [
        {
            "key": d["key"],
            "start_date": d["start_date"],
            "end_date": d["end_date"],
            "dates": d["dates"],
            "projects": [],
        }
        for d in dates
    ]
