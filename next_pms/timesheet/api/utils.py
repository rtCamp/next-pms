import json
from collections import defaultdict

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
)

from . import filter_employees

READ_ONLY_ROLE = ["Timesheet User", "Projects User"]
READ_WRITE_ROLE = ["Timesheet Manager", "Projects Manager"]


def has_write_access():
    roles = frappe.get_roles()
    return set(roles).intersection(READ_WRITE_ROLE)


@redis_cache()
def get_week_dates(date, ignore_weekend=False):
    """Returns the dates map with dates and other details.
    example:
        {
            "start_date": "2021-08-01",
            "end_date": "2021-08-07",
            "key": "Aug 01 - Aug 07",
            "dates": [
                "2021-08-01",
                "2021-08-02",
                ...
            ]
        }
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

    for timesheet in current_week_timesheet:
        frappe.db.set_value(
            "Timesheet", timesheet.name, "custom_weekly_approval_status", week_status, update_modified=False
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
    if isinstance(status_filter, str):
        status_filter = status_filter.strip()
        if not status_filter:
            return None

        try:
            status_filter = json.loads(status_filter)
        except (json.JSONDecodeError, ValueError):
            return [status_filter]

    if status_filter == "":
        return None
    if coerce_non_list and status_filter and not isinstance(status_filter, list):
        return [status_filter]

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
            raw_filters = json.loads(raw_filters)
        except (json.JSONDecodeError, ValueError):
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


EMPLOYEE_SCAN_CHUNK_SIZE = 50
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


def get_matching_timesheet_employee_ids(
    dates: list,
    parsed_filters: dict,
    search: str | None = None,
    approval_status: list[str] | None = None,
    require_project_tasks: bool = False,
):
    if not dates:
        return []

    base_ts_filters = {
        "start_date": [">=", dates[0].get("start_date")],
        "end_date": ["<=", dates[-1].get("end_date")],
        "docstatus": ["!=", 2],
    }
    if approval_status:
        base_ts_filters["custom_weekly_approval_status"] = ["in", approval_status]

    ts_filters = build_filters(base_ts_filters, parsed_filters.get("Timesheet", []))
    timesheets = get_all("Timesheet", filters=ts_filters, fields=["name", "employee"])
    if not timesheets:
        return []

    requires_detail_scan = bool(
        require_project_tasks or search or parsed_filters.get("Task") or parsed_filters.get("Timesheet Detail")
    )
    if not requires_detail_scan:
        return list({timesheet.employee for timesheet in timesheets})

    timesheet_by_name = {timesheet.name: timesheet for timesheet in timesheets}
    detail_filters = build_filters(
        {"parent": ["in", list(timesheet_by_name)]}, parsed_filters.get("Timesheet Detail", [])
    )
    details = get_all("Timesheet Detail", filters=detail_filters, fields=["parent", "task"])
    if not details:
        return []

    requires_task_scan = bool(require_project_tasks or search or parsed_filters.get("Task"))
    if not requires_task_scan:
        matched_parent_names = {detail.parent for detail in details}
        return list(
            {timesheet_by_name[parent].employee for parent in matched_parent_names if parent in timesheet_by_name}
        )

    task_ids = list({detail.task for detail in details if detail.task})
    if not task_ids:
        return []

    task_filters = build_filters({"name": ["in", task_ids]}, parsed_filters.get("Task", []))
    tasks = get_all("Task", filters=task_filters, fields=TASK_FIELDS)
    if search:
        search_term = search.lower()
        tasks = [
            task
            for task in tasks
            if search_term in (task.get("subject") or "").lower()
            or search_term in (task.get("name") or "").lower()
            or search_term in (task.get("project_name") or "").lower()
        ]
    if require_project_tasks:
        tasks = [task for task in tasks if task.get("project")]

    valid_task_ids = {task.name for task in tasks}
    if not valid_task_ids:
        return []

    matched_parent_names = {detail.parent for detail in details if detail.task in valid_task_ids}
    return list({timesheet_by_name[parent].employee for parent in matched_parent_names if parent in timesheet_by_name})


def get_team_candidate_employee_ids(
    reports_to: str | None = None,
    dates: list | None = None,
    parsed_filters: dict | None = None,
    search: str | None = None,
    timesheet_status: list[str] | None = None,
    status=None,
    business_unit=None,
):
    if not dates:
        return []

    has_candidate_filters = bool(timesheet_status or search or any((parsed_filters or {}).values()))
    if not has_candidate_filters and not status and not business_unit:
        return None

    employee_ids = get_matching_timesheet_employee_ids(
        dates=dates,
        parsed_filters=parsed_filters or {dt: [] for dt in ALLOWED_FILTER_FIELDS},
        search=search,
        approval_status=timesheet_status,
    )
    if not employee_ids:
        return []

    _, filtered_count = filter_employees(
        page_length=1,
        start=0,
        reports_to=reports_to,
        ids=employee_ids,
        status=status,
        business_unit=business_unit,
    )
    if not filtered_count:
        return []

    return employee_ids


def get_project_candidate_employee_ids(
    reports_to: str | None = None,
    dates: list | None = None,
    parsed_filters: dict | None = None,
    search: str | None = None,
    approval_status: list[str] | None = None,
):
    if not dates:
        return []

    employee_ids = get_matching_timesheet_employee_ids(
        dates=dates,
        parsed_filters=parsed_filters or {dt: [] for dt in ALLOWED_FILTER_FIELDS},
        search=search,
        approval_status=approval_status,
        require_project_tasks=True,
    )
    if not employee_ids:
        return []

    _, filtered_count = filter_employees(page_length=1, start=0, reports_to=reports_to, ids=employee_ids)
    if not filtered_count:
        return []

    return employee_ids


def iter_employee_chunks(employees: list, chunk_size: int = EMPLOYEE_SCAN_CHUNK_SIZE):
    for index in range(0, len(employees), chunk_size):
        yield employees[index : index + chunk_size]


def build_chunk_context(employees: list, dates: list, parsed_filters: dict, search: str | None = None):
    employee_names = [employee.name for employee in employees]
    if not employee_names:
        return {
            "working_hours_map": {},
            "daily_norm_map": {},
            "leaves_by_employee": {},
            "holidays_by_employee": {},
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
        fields=["name", "custom_working_hours", "custom_work_schedule", "holiday_list"],
    )
    employee_meta_map = {row.name: row for row in employee_meta_rows}

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
        holiday_list = get_holiday_list_for_employee(employee_name, raise_exception=False) or meta.get("holiday_list")
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

    timesheet_map = defaultdict(list)
    emp_ts_by_start = defaultdict(lambda: defaultdict(list))
    week_status_map = {}
    overall_status_map = {}
    all_timesheet_names = []

    for timesheet in all_timesheets:
        timesheet_map[timesheet.employee].append(timesheet)
        emp_ts_by_start[timesheet.employee][timesheet.start_date].append(timesheet.name)
        week_status_map[(timesheet.employee, timesheet.start_date)] = (
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
            if search:
                search_term = search.lower()
                all_tasks = [
                    task
                    for task in all_tasks
                    if search_term in (task.get("subject") or "").lower()
                    or search_term in (task.get("name") or "").lower()
                    or search_term in (task.get("project_name") or "").lower()
                ]
            task_details_dict = {task["name"]: task for task in all_tasks}

    if search and all_logs:
        filtered_task_ids = set(task_details_dict.keys())
        all_logs = [log for log in all_logs if not log.get("task") or log.get("task") in filtered_task_ids]
        detail_by_parent = defaultdict(list)
        for log in all_logs:
            detail_by_parent[log.parent].append(log)

    matched_parent_names = set(detail_by_parent.keys())
    if matched_parent_names and (search or parsed_filters.get("Task") or parsed_filters.get("Timesheet Detail")):
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

    has_search_or_task_filters = bool(search or parsed_filters.get("Task"))

    return {
        "working_hours_map": working_hours_map,
        "daily_norm_map": daily_norm_map,
        "leaves_by_employee": leaves_by_employee,
        "holidays_by_employee": holidays_by_employee,
        "timesheet_map": timesheet_map,
        "emp_ts_by_start": emp_ts_by_start,
        "detail_by_parent": detail_by_parent,
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

                tasks[task_name]["data"].append({field: log.get(field) for field in ALLOWED_TIMESHET_DETAIL_FIELDS})

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


def paginate_qualifying_employee_payloads(
    reports_to: str | None,
    employee_ids,
    dates: list,
    parsed_filters: dict,
    search: str | None,
    start: int,
    page_length: int,
    builder,
    status=None,
    business_unit=None,
):
    selected = []
    total_count = 0
    employee_start = 0

    while True:
        chunk, _ = filter_employees(
            page_length=EMPLOYEE_SCAN_CHUNK_SIZE,
            start=employee_start,
            reports_to=reports_to,
            ids=employee_ids,
            status=status,
            business_unit=business_unit,
        )
        if not chunk:
            break

        context = build_chunk_context(chunk, dates, parsed_filters, search)
        for employee in chunk:
            payload = builder(employee, context)
            if not payload:
                continue

            if total_count >= start and len(selected) < page_length:
                selected.append(payload)

            total_count += 1

        employee_start += len(chunk)

    has_more = start + page_length < total_count
    return selected, total_count, has_more
