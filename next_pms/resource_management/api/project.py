import json

import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import getdate
from frappe.core.doctype.recorder.recorder import redis_cache
from frappe.email.doctype.auto_email_report.auto_email_report import DATE_FORMAT
from frappe.utils import add_days

from next_pms.resource_management.api.utils.helpers import (
    add_customer_data_if_not_exists,
    filter_project_list,
    get_dates_date,
    normalize_project_view_filters,
    resource_api_permissions_check,
)
from next_pms.resource_management.api.utils.query import (
    attach_extra_entries,
    get_allocation_list_for_employee_for_given_range,
    get_allocation_worked_hours_for_given_employee,
    get_allocation_worked_hours_for_given_projects,
)


@frappe.whitelist(methods=["GET", "POST"])
def get_resource_management_project_view_data(
    date: str,
    max_week: int = 2,
    project_name: str | None = None,
    customer: str | None = None,
    billing_type: str | None = None,
    project_type: str | None = None,
    project_manager: str | None = None,
    tag: str | None = None,
    is_billable: str | None = None,
    allocation_status: list | str | None = None,
    page_length: int = 10,
    start: int = 0,
    project_id: str | list | None = None,
    filters: str | list | None = None,
):
    """Return the data required for the resource management project view.

    Builds the filtered, paginated list of projects and, for each project, the per-week and per-date resource-allocation breakdown over the requested window.

    Callers without write permission have every filter except project_name ignored (both the dedicated params and the filters conditions).

    Args:
        date: Anchor date (YYYY-MM-DD) for the allocation window; the window spans
            max_week weeks starting from the week containing this date.
        max_week: Number of weeks to include in the window, starting from date.
            Defaults to 2.
        project_name: Case-insensitive substring to match against Project.project_name
            (applied as a LIKE). None disables the filter.
        customer: Customer(s) to match against Project.customer. Accepts a single
            value or a multi-select list/JSON; matched with IN. Ignored for callers
            without write permission.
        billing_type: Billing type(s) to match against Project.custom_billing_type
            (IN). Ignored for callers without write permission.
        project_type: Project type(s) to match against Project.project_type (IN).
            Ignored for callers without write permission.
        project_manager: Project manager user id(s) to match against
            Project.custom_project_manager (IN). Ignored for callers without
            write permission.
        tag: Tag(s) to match via the Tag Link doctype; resolves to the projects
            carrying the tag. Ignored for callers without write permission.
        is_billable: Filters the per-project allocation breakdown to billable
            (1) or non-billable (0) allocations. Accepts an int or a JSON
            string. Does not change which projects are returned, only their allocation
            data. A matching is_billable condition in filters overrides this.
            Ignored for callers without write permission.
        allocation_status: Status value(s) to match against Resource Allocation.status,
            e.g. ["Confirmed", "Tentative"]. Accepts a single value, a list, or a JSON
            string. Filters the per-project allocation breakdown to the matching statuses;
            does not change which projects are returned. None or [] disables the filter.
            Ignored for callers without write permission.
        page_length: Maximum number of projects to return in this page. Defaults to 10.
        start: Zero-based offset of the first project to return (pagination). Defaults
            to 0.
        project_id: Project id(s) to restrict the result to, matched against
            Project.name (IN). Accepts a single value or a list/JSON string.
            When provided, other dedicated project-list filter params are ignored
            (except composite filters). Ignored for callers without write
            permission.
        filters: A JSON list (or already-parsed list) of [field, operator, value]
            conditions, ANDed with each other and with the dedicated params above
            (composite filters still apply when project_id is set). Allowed operators: =, !=, like, not like. Supported fields:
            project_name, customer, billing_type, project_type,
            project_manager, project_manager_name, project_id, tag, is_billable.
            project_manager matches the manager's User id (custom_project_manager,
            Link); project_manager_name matches the manager's name
            (custom_project_manager_name, Data) and is LIKE-searchable. tag is
            resolved against the Tag Link doctype; is_billable accepts only
            = or != with a value of 0 or 1 and overrides the is_billable
            param. For callers without write permission only project_name conditions
            are honored.

    Returns:
        dict: The project-view payload with the keys:
            - dates (list): the week buckets in the window, each with
              start_date, end_date, key (label), and dates (the working
              days in that week).
            - data (list): one entry per project, the project fields plus
              all_week_data (per-week allocated/worked hours), all_dates_data
              (per-date allocation detail), project_allocations (the allocations
              keyed by name), and weekly_capacity.
            - customer (dict): customer metadata referenced by the allocations.
            - employees (dict): employee metadata keyed by employee id for the
              employees appearing in the allocations.
            - total_count (int): total number of projects matching the filters,
              independent of page_length.
            - has_more (bool): whether more projects exist beyond this page.
            - permissions (dict): the caller's read/write/delete flags.
    """
    permissions = resource_api_permissions_check()
    return _get_resource_management_project_view_data(
        json.dumps(permissions),
        date,
        max_week,
        project_name,
        customer,
        billing_type,
        project_type,
        project_manager,
        tag,
        is_billable,
        allocation_status,
        page_length,
        start,
        project_id,
        filters,
    )


@redis_cache()
def _get_resource_management_project_view_data(
    permissions: str,
    date: str,
    max_week: int = 2,
    project_name: str | None = None,
    customer: str | None = None,
    billing_type: str | None = None,
    project_type: str | None = None,
    project_manager: str | None = None,
    tag: str | None = None,
    is_billable: str | None = None,
    allocation_status: list | str | None = None,
    page_length: int = 10,
    start: int = 0,
    project_id: str | list | None = None,
    filters: str | list | None = None,
):
    permissions = json.loads(permissions)
    if not permissions["write"]:
        is_billable = None
        allocation_status = None
        customer = None
        project_id = None
        billing_type = None
        project_type = None
        project_manager = None
        tag = None

    if isinstance(is_billable, str):
        is_billable = json.loads(is_billable)
    if isinstance(allocation_status, str):
        allocation_status = json.loads(allocation_status)

    project_conditions, tag_conditions, filter_is_billable = normalize_project_view_filters(
        filters, allow_privileged=permissions["write"]
    )
    if filter_is_billable is not None:
        is_billable = filter_is_billable

    ids = None

    if project_id:
        if isinstance(project_id, str):
            project_id = json.loads(project_id)
        ids = project_id

    projects, total_count = filter_project_list(
        project_name,
        page_length=page_length,
        start=start,
        customer=customer,
        billing_type=billing_type,
        project_type=project_type,
        project_manager=project_manager,
        tag=tag,
        ids=ids,
        extra_conditions=project_conditions,
        tag_conditions=tag_conditions,
    )

    data = []
    customer = {}
    weeks = get_dates_date(max_week, date)
    res = {"dates": weeks}

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "employee_name",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
            "note",
            "status",
            "modified_by",
            "modified",
            "creation",
            "recurrence_id",
        ],
        "project",
        [project.name for project in projects],
        weeks[0].get("start_date"),
        weeks[-1].get("end_date"),
        is_billable,
        allocation_status=allocation_status,
    )
    resource_allocation_data = attach_extra_entries(resource_allocation_data)

    resource_allocation_map = {}
    user_info_cache = {}
    privileged_emp_fields = ["ctc", "salary_currency"] if permissions["write"] else []
    emp_fields = [
        "employee_name",
        "name",
        "image",
        "department",
        "designation",
        "reports_to",
        "custom_work_schedule",
        "custom_working_hours",
        *privileged_emp_fields,
    ]
    emp_ids = set()
    for resource_allocation in resource_allocation_data:
        modified_by = resource_allocation.get("modified_by")
        if modified_by:
            if modified_by not in user_info_cache:
                user_data = frappe.db.get_value("User", modified_by, ["full_name", "user_image"], as_dict=True)
                user_info_cache[modified_by] = {
                    "avatar": user_data.user_image if user_data else None,
                    "full_name": user_data.full_name if user_data else None,
                }
            resource_allocation["modified_by_avatar"] = user_info_cache[modified_by]["avatar"]
            resource_allocation["modified_by_full_name"] = user_info_cache[modified_by]["full_name"]

        emp_ids.add(resource_allocation.employee)

        if resource_allocation.project not in resource_allocation_map:
            resource_allocation_map[resource_allocation.project] = {}
        resource_allocation_map[resource_allocation.project][resource_allocation.name] = resource_allocation

    employees = (
        {e.name: e for e in frappe.get_all("Employee", filters={"name": ["in", list(emp_ids)]}, fields=emp_fields)}
        if emp_ids
        else {}
    )

    for project in projects:
        all_week_data, all_dates_data = [], {}
        project_resource_allocation = resource_allocation_map.get(project.name, {})
        weekly_capacity = sum(
            alloc.hours_allocated_per_day
            for week in weeks
            for date in week.get("dates")
            for alloc in project_resource_allocation.values()
            if alloc.allocation_start_date <= date <= alloc.allocation_end_date
        )

        for week in weeks:
            total_allocated_hours_for_given_week = 0

            for date in week.get("dates"):
                total_allocated_hours_for_given_date = 0
                project_resource_allocation_for_given_date = []

                for resource_allocation_name in project_resource_allocation:
                    resource_allocation = project_resource_allocation[resource_allocation_name]
                    customer = add_customer_data_if_not_exists(customer, resource_allocation.customer)

                    if resource_allocation.allocation_start_date <= date <= resource_allocation.allocation_end_date:
                        total_allocated_hours_for_given_date += resource_allocation.hours_allocated_per_day
                        project_resource_allocation_for_given_date.append(
                            {
                                "name": resource_allocation.name,
                                "date": date,
                            }
                        )

                date_data = {}

                if permissions["write"]:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "project_resource_allocation_for_given_date": project_resource_allocation_for_given_date,
                        "total_worked_hours": get_allocation_worked_hours_for_given_projects(project.name, date, date),
                    }
                else:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "project_resource_allocation_for_given_date": project_resource_allocation_for_given_date,
                    }

                if len(date_data["project_resource_allocation_for_given_date"]) > 0:
                    all_dates_data[date_data["date"]] = date_data

                total_allocated_hours_for_given_week += total_allocated_hours_for_given_date

            if permissions["write"]:
                all_week_data.append(
                    {
                        "total_allocated_hours": total_allocated_hours_for_given_week,
                        "total_worked_hours": get_allocation_worked_hours_for_given_projects(
                            project.name, week.get("start_date"), week.get("end_date")
                        ),
                    }
                )
            else:
                all_week_data.append(
                    {
                        "total_allocated_hours": total_allocated_hours_for_given_week,
                    }
                )

        data.append(
            {
                **project,
                "all_week_data": all_week_data,
                "all_dates_data": all_dates_data,
                "project_allocations": project_resource_allocation,
                "weekly_capacity": weekly_capacity,
            }
        )

    res["data"] = data
    res["customer"] = customer
    res["employees"] = employees
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count
    res["permissions"] = permissions

    return res


@frappe.whitelist(methods=["GET"])
@redis_cache()
def get_employees_resrouce_data_for_given_project(project: str, start_date: str, end_date: str, is_billable: int = -1):
    """Returns the data required for resource management employee view based on the filters provided for a given project"""
    permissions = resource_api_permissions_check()

    if not permissions["write"]:
        is_billable = -1
        customer = None

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "employee_name",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
            "note",
            "status",
            "modified_by",
            "modified",
            "creation",
            "recurrence_id",
        ],
        "project",
        [project],
        start_date,
        end_date,
        is_billable,
    )
    resource_allocation_data = attach_extra_entries(resource_allocation_data)

    resource_allocation_map = {}
    user_info_cache = {}
    for resource_allocation in resource_allocation_data:
        modified_by = resource_allocation.get("modified_by")
        if modified_by:
            if modified_by not in user_info_cache:
                user_data = frappe.db.get_value("User", modified_by, ["full_name", "user_image"], as_dict=True)
                user_info_cache[modified_by] = {
                    "avatar": user_data.user_image if user_data else None,
                    "full_name": user_data.full_name if user_data else None,
                }
            resource_allocation["modified_by_avatar"] = user_info_cache[modified_by]["avatar"]
            resource_allocation["modified_by"] = user_info_cache[modified_by]["full_name"]
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = {}
        resource_allocation_map[resource_allocation.employee][resource_allocation.name] = resource_allocation

    res = {}
    data = []
    customer = {}
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    privileged_emp_fields = ["ctc", "salary_currency"] if permissions["write"] else []
    emp_fields = [
        "employee_name",
        "name",
        "image",
        "department",
        "designation",
        "reports_to",
        "custom_work_schedule",
        "custom_working_hours",
        *privileged_emp_fields,
    ]

    all_employees = {
        e.name: e
        for e in frappe.get_all(
            "Employee", filters={"name": ["in", list(resource_allocation_map.keys())]}, fields=emp_fields
        )
    }

    for emp_id in resource_allocation_map:
        employee_resource_allocation = resource_allocation_map.get(emp_id, [])

        employee = all_employees.get(emp_id)
        if not employee:
            continue

        current_date = start_date

        all_dates_data = {}

        while current_date <= end_date:
            if current_date.weekday() in [5, 6]:
                current_date = add_days(current_date, 1)
                continue

            total_allocated_hours_for_employee = 0
            employee_resource_allocation_for_given_date = []

            for resource_allocation_name in employee_resource_allocation:
                resource_allocation = employee_resource_allocation[resource_allocation_name]

                customer = add_customer_data_if_not_exists(customer, resource_allocation.customer)

                if resource_allocation.allocation_start_date <= current_date <= resource_allocation.allocation_end_date:
                    total_allocated_hours_for_employee += resource_allocation.hours_allocated_per_day
                    employee_resource_allocation_for_given_date.append(
                        {
                            "name": resource_allocation.name,
                            "date": current_date,
                        }
                    )

            total_worked_hours_for_employee = get_allocation_worked_hours_for_given_employee(
                project, employee.name, current_date.strftime(DATE_FORMAT), current_date.strftime(DATE_FORMAT)
            )

            if total_allocated_hours_for_employee > 0 or total_worked_hours_for_employee > 0:
                if permissions["write"]:
                    all_dates_data[current_date.strftime(DATE_FORMAT)] = {
                        "date": current_date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_employee,
                        "total_worked_hours": total_worked_hours_for_employee,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                    }
                else:
                    all_dates_data[current_date.strftime(DATE_FORMAT)] = {
                        "date": current_date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_employee,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                    }

            current_date = add_days(current_date, 1)
        data.append({**employee, "all_dates_data": all_dates_data, "allocations": employee_resource_allocation})

    res["data"] = data
    res["customer"] = customer
    res["permissions"] = permissions

    return res
