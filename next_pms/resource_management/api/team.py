import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe.core.doctype.recorder.recorder import redis_cache
from frappe.utils import DATE_FORMAT, getdate

from next_pms.resource_management.api.utils.helpers import (
    add_customer_data_if_not_exists,
    find_worked_hours,
    get_allocation_objects,
    get_dates_date,
    get_employees_by_skills,
    is_on_leave,
    resource_api_permissions_check,
)
from next_pms.resource_management.api.utils.query import (
    attach_extra_entries,
    get_allocation_list_for_employee_for_given_range,
    get_employee_leaves,
)
from next_pms.timesheet.api import filter_employees
from next_pms.timesheet.api.employee import get_employee_working_hours


@frappe.whitelist(methods=["GET", "POST"])
@redis_cache()
def get_resource_management_team_view_data(
    date: str,
    max_week: int = 2,
    employee_name: str | None = None,
    business_unit: str | None = None,
    designation: str | None = None,
    reports_to: list | str | None = None,
    is_billable: list | str | None = None,
    allocation_status: list | str | None = None,
    page_length: int = 10,
    start: int = 0,
    skills: list | str | None = None,
    employee_id: list | str | None = None,
    need_hours_summary: bool = False,
):
    """Get resource management team view data for the given filters and date range.

    Args:
        date (str): Anchor date string ("YYYY-MM-DD"). Determines the starting week.
        max_week (int): Number of consecutive weeks to include starting from the week
            containing `date`. Defaults to 2.
        employee_name (str | None): Partial name filter (LIKE match). Defaults to None.
        business_unit (str | None): JSON-encoded list of business units to filter by.
            Ignored when the caller lacks write permission. Defaults to None.
        designation (str | None): JSON-encoded list of designations to filter by.
            Ignored when the caller lacks write permission. Defaults to None.
        reports_to (list | str | None): Employee ID or JSON-encoded list of IDs;
            restricts results to direct reports of any of the given managers.
            Ignored when the caller lacks write permission. Defaults to None.
        is_billable (list | str | None): Billable filter passed to allocation query.
            Defaults to None (no filter).
        allocation_status (list | str | None): Allocation status filter. Defaults to None.
        page_length (int): Number of employees per page. Defaults to 10.
        start (int): Pagination offset. Defaults to 0.
        skills (list | str | None): JSON-encoded list of skill names. When provided and
            `employee_id` is absent, only employees possessing all listed skills are
            returned. Defaults to None.
        employee_id (list | str | None): JSON-encoded list of employee IDs. Takes
            priority over `skills` when both are provided. Defaults to None.
        need_hours_summary (bool): Switches the response shape.
            False → flat grid response (raw employees, allocations, leaves).
            True  → per-employee per-day hours breakdown. Defaults to False.

    Returns:
        When ``need_hours_summary`` is False:

        ```py
        {
            "employees": [
                {
                    "name": "HR-EMP-00001",
                    "employee_name": "John Doe",
                    "department": "Engineering",
                    "designation": "Software Engineer",
                    "image": "/files/photo.jpg",
                    "custom_work_schedule": "Mon-Fri",
                    "custom_working_hours": 8.0,
                    "reports_to": "HR-EMP-00002",
                    # write permission only:
                    "ctc": "120000",
                    "salary_currency": "INR",
                },
            ],
            "leaves": [
                {
                    "employee": "HR-EMP-00001",
                    "from_date": datetime.date(2026, 5, 20),
                    "to_date": datetime.date(2026, 5, 22),
                    "name": "HR-LAP-00001",
                },
            ],
            "resource_allocations": [
                {
                    "name": "RA-00001",
                    "employee": "HR-EMP-00001",
                    "project": "PROJ-001",
                    "hours_allocated_per_day": 4.0,
                },
            ],
            "customer": {
                "ACME Corp": {"name": "ACME Corp", "abbr": "AC", "image": None},
            },
            "total_count": 45,
            "has_more": True,
            "permissions": {"read": True, "write": True},
        }

        # total_count: all Active employees matching filters (ignores pagination).
        # has_more: True when start + page_length < total_count.
        ```

        When ``need_hours_summary`` is True:

        ```py
        {
            "data": [
                {
                    "name": "HR-EMP-00001",
                    "employee_name": "John Doe",
                    "working_hour": 8.0,
                    "working_frequency": "Per Day",
                    "employee_daily_working_hours": 8.0,
                    "max_allocation_count_for_single_date": 2,
                    # write permission only:
                    "ctc": "120000",
                    "salary_currency": "INR",
                    # sparse — only days with allocations or leave are included
                    "all_dates_data": {
                        "2026-05-21": {
                            "date": "2026-05-21",
                            "total_allocated_hours": 8.0,
                            "total_working_hours": 8.0,
                            "total_worked_hours": 6.0,  # write permission only
                            "total_allocation_count": 2,
                            "is_on_leave": False,
                            "total_leave_hours": 0.0,
                            "employee_resource_allocation_for_given_date": [
                                {
                                    "name": "RA-00001",
                                    "date": datetime.date(2026, 5, 21),
                                    "total_worked_hours_resource_allocation": 6.0,
                                    "is_tentative": False,
                                },
                            ],
                        },
                    },
                    "all_week_data": {
                        "This Week": {
                            "total_allocated_hours": 40.0,
                            "total_working_hours": 40.0,
                            "total_worked_hours": 32.0,  # write permission only
                        },
                    },
                    "all_leave_data": {"2026-05-20": 8.0},
                    "employee_allocations": [],
                },
            ],
            "customer": {
                "ACME Corp": {"name": "ACME Corp", "abbr": "AC", "image": None},
            },
            "total_count": 45,
            "has_more": True,
            "permissions": {"read": True, "write": True},
        }

        # total_count: all Active employees matching filters (ignores pagination).
        # has_more: True when start + page_length < total_count.
        ```
    """
    permissions = resource_api_permissions_check()

    if not permissions["write"]:
        is_billable = None
        allocation_status = None
        business_unit = None
        designation = None
        reports_to = None
        customer = None
        employee_id = None

    data = []
    customer = {}
    dates = get_dates_date(max_week, date)
    res = {}

    ids = None

    if isinstance(is_billable, str):
        is_billable = frappe.parse_json(is_billable)
    if isinstance(allocation_status, str):
        allocation_status = frappe.parse_json(allocation_status)

    if employee_id:
        if isinstance(employee_id, str):
            employee_id = frappe.parse_json(employee_id)
        ids = employee_id

    if not employee_id:
        if not skills:
            skills = []
        if isinstance(skills, str):
            skills = frappe.parse_json(skills)
        if skills:
            ids = get_employees_by_skills(skills)
            if len(ids) == 0:
                if not need_hours_summary:
                    res["employees"] = []
                    res["resource_allocations"] = []
                    res["leaves"] = []
                    res["customer"] = {}
                    res["total_count"] = 0
                    res["has_more"] = False
                    res["permissions"] = permissions
                    return res

                res["data"] = data
                res["customer"] = customer
                res["total_count"] = 0
                res["has_more"] = False
                res["permissions"] = permissions
                return res

    if is_billable or allocation_status:
        # narrow `ids` to employees with matching allocations in the window before
        # paginating. Without this, the billable/status filter is applied after
        # pagination and page 1 can come back blank when the first N employees
        # have no matching allocations.
        allocation_filters = {
            "allocation_start_date": ["<=", dates[-1].get("end_date")],
            "allocation_end_date": [">=", dates[0].get("start_date")],
        }
        if is_billable:
            allocation_filters["is_billable"] = ["in", is_billable]
        if allocation_status:
            allocation_filters["status"] = ["in", allocation_status]
        if ids:
            allocation_filters["employee"] = ["in", ids]

        matching_emp_ids = frappe.db.get_all(
            "Resource Allocation",
            filters=allocation_filters,
            pluck="employee",
            distinct=True,
        )

        if not matching_emp_ids:
            if need_hours_summary:
                res["data"] = []
            else:
                res["employees"] = []
                res["resource_allocations"] = []
                res["leaves"] = []
            res["customer"] = customer
            res["total_count"] = 0
            res["has_more"] = False
            res["permissions"] = permissions
            return res

        ids = matching_emp_ids

    privileged_fields = ["ctc", "salary_currency"] if permissions["write"] else []
    employees, total_count = filter_employees(
        employee_name,
        business_unit=business_unit,
        designation=designation,
        page_length=page_length,
        reports_to=reports_to,
        start=start,
        status=["Active"],
        ids=ids,
        ignore_permissions=True,
        extra_fields=["custom_work_schedule", "custom_working_hours", "reports_to", *privileged_fields],
    )

    if not employees:
        if need_hours_summary:
            res["data"] = []
        else:
            res["employees"] = []
            res["resource_allocations"] = []
            res["leaves"] = []
        res["customer"] = customer
        res["total_count"] = total_count
        res["has_more"] = False
        res["permissions"] = permissions
        return res

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
            "modified_by",
            "modified",
            "creation",
            "status",
            "recurrence_id",
        ],
        "employee",
        [employee.name for employee in employees],
        dates[0].get("start_date"),
        dates[-1].get("end_date"),
        is_billable=is_billable,
        allocation_status=allocation_status,
        is_need_fetch_all_weeks=not need_hours_summary,
    )
    resource_allocation_data = attach_extra_entries(resource_allocation_data)

    # Make the map of resource allocation data for given employee
    resource_allocation_map = {}
    user_info_cache = {}
    for resource_allocation in resource_allocation_data:
        modified_by = resource_allocation.get("modified_by") or resource_allocation.get("created_by")
        if modified_by:
            if modified_by not in user_info_cache:
                user_data = frappe.db.get_value("User", modified_by, ["full_name", "user_image"], as_dict=True)
                user_info_cache[modified_by] = {
                    "avatar": user_data.user_image if user_data else None,
                    "full_name": user_data.full_name if user_data else None,
                }
            resource_allocation["modified_by_avatar"] = user_info_cache[modified_by]["avatar"]
            resource_allocation["modified_by_full_name"] = user_info_cache[modified_by]["full_name"]
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = []
        customer = add_customer_data_if_not_exists(customer, resource_allocation.customer)
        resource_allocation_map[resource_allocation.employee].append(resource_allocation)

    if not need_hours_summary:
        all_leave_data = frappe.get_all(
            "Leave Application",
            filters={
                "employee": ["in", [employee.name for employee in employees]],
                "docstatus": ["in", [0, 1]],
                "status": ["in", ["Approved", "Open"]],
            },
            fields=[
                "employee",
                "employee_name",
                "from_date",
                "to_date",
                "half_day",
                "half_day_date",
                "total_leave_days",
                "name",
            ],
        )
        res["employees"] = employees
        res["leaves"] = all_leave_data
        res["resource_allocations"] = resource_allocation_data
        res["customer"] = customer
        res["total_count"] = total_count
        res["has_more"] = int(start) + int(page_length) < total_count
        res["permissions"] = permissions
        return res

    employee_ids = [employee.name for employee in employees]
    range_start = dates[0].get("start_date")
    range_end = dates[-1].get("end_date")

    # Batch timesheets — one query for all employees instead of one per employee
    all_timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_ids],
            "start_date": [">=", range_start],
            "end_date": ["<=", range_end],
        },
        fields=["employee", "start_date", "end_date", "total_hours", "parent_project", "customer"],
    )
    timesheet_map = {}
    for t in all_timesheets:
        timesheet_map.setdefault(t.employee, []).append(t)

    # Batch leaves — get_employee_leaves accepts a tuple of employee IDs
    all_leaves = get_employee_leaves(
        employee=tuple(employee_ids),
        start_date=range_start,
        end_date=range_end,
    )
    leaves_map = {}
    for leave in all_leaves:
        leaves_map.setdefault(leave.employee, []).append(leave)

    # Batch holidays — fetch once per unique holiday list instead of once per employee
    holiday_list_per_employee = {
        emp.name: get_holiday_list_for_employee(emp.name, raise_exception=False) for emp in employees
    }
    unique_holiday_lists = {hl for hl in holiday_list_per_employee.values() if hl}
    holidays_by_list = {
        hl: frappe.get_all(
            "Holiday",
            filters={
                "parent": hl,
                "holiday_date": ["between", (getdate(range_start), getdate(range_end))],
            },
            fields=["holiday_date", "description", "weekly_off"],
        )
        for hl in unique_holiday_lists
    }
    holidays_map = {emp.name: holidays_by_list.get(holiday_list_per_employee.get(emp.name), []) for emp in employees}

    for employee in employees:
        employee_resource_allocation = resource_allocation_map.get(employee.name, [])

        working_hours = get_employee_working_hours(employee.name)

        # convert working hours in date format to hours per day
        daily_working_hours = (
            working_hours.get("working_hour")
            if working_hours.get("working_frequency") == "Per Day"
            else working_hours.get("working_hour") / 5
        )

        timesheet_data = timesheet_map.get(employee.name, [])
        leaves = leaves_map.get(employee.name, [])
        holidays = holidays_map.get(employee.name, [])

        all_dates_data, all_week_data, all_leave_data = {}, {}, {}
        max_allocation_count_for_single_date = 0

        # For given employee loop through all the dates and calculate the total allocated hours, total working hours and total worked hours
        for date_info in dates:
            (
                total_working_hours_for_given_week,
                total_allocated_hours_for_given_week,
                total_worked_hours_for_given_week,
            ) = (0, 0, 0)

            for date in date_info.get("dates"):
                (
                    total_worked_hours_for_given_date,
                    total_working_hours_for_given_date,
                    total_allocated_hours_for_given_date,
                    total_allocation_count,
                ) = (0, daily_working_hours, 0, 0)

                employee_resource_allocation_for_given_date = []

                leave_object = is_on_leave(date, daily_working_hours, leaves, holidays)

                if leave_object.get("on_leave") and not leave_object.get("leave_work_hours"):
                    # If employee is on leave and not working on that day then total working hours will be 0
                    total_working_hours_for_given_date = 0
                else:
                    if leave_object.get("leave_work_hours"):
                        # Handle the half day leave hear
                        total_working_hours_for_given_date = leave_object.get("leave_work_hours")

                    # If employee is not on leave then calculate the total working hours for that day
                    for resource_allocation in employee_resource_allocation:
                        if (
                            resource_allocation.allocation_start_date <= date
                            and resource_allocation.allocation_end_date >= date
                        ):
                            total_allocated_hours_for_given_date += resource_allocation.get("hours_allocated_per_day")
                            total_worked_hours_resource_allocation = find_worked_hours(
                                timesheet_data=timesheet_data, date=date, project=resource_allocation.project
                            )
                            total_worked_hours_for_given_date += total_worked_hours_resource_allocation
                            total_allocation_count += 1

                            employee_resource_allocation_for_given_date.append(
                                {
                                    "name": resource_allocation.name,
                                    "date": date,
                                    "total_worked_hours_resource_allocation": total_worked_hours_resource_allocation,
                                    "is_tentative": resource_allocation.get("status") == "Tentative",
                                }
                            )

                if leave_object.get("on_leave"):
                    # If employee is on leave then leave hours calculation will come from subtracting total working hours from leave hours (total_working_hours_for_given_date)
                    all_leave_data[date.strftime(DATE_FORMAT)] = (
                        daily_working_hours - total_working_hours_for_given_date
                    )

                date_data = None

                if permissions["write"]:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "total_working_hours": total_working_hours_for_given_date,
                        "total_worked_hours": total_worked_hours_for_given_date,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                        "is_on_leave": leave_object.get("on_leave"),
                        "total_leave_hours": daily_working_hours - total_working_hours_for_given_date,
                        "total_allocation_count": total_allocation_count,
                    }

                else:
                    date_data = {
                        "date": date.strftime(DATE_FORMAT),
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "total_working_hours": total_working_hours_for_given_date,
                        "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                        "is_on_leave": leave_object.get("on_leave"),
                        "total_leave_hours": daily_working_hours - total_working_hours_for_given_date,
                        "total_allocation_count": total_allocation_count,
                    }

                if date_data["total_allocation_count"] > 0 or date_data["is_on_leave"]:
                    all_dates_data[date_data["date"]] = date_data

                total_allocated_hours_for_given_week += total_allocated_hours_for_given_date
                total_working_hours_for_given_week += total_working_hours_for_given_date
                total_worked_hours_for_given_week += total_worked_hours_for_given_date
                max_allocation_count_for_single_date = max(max_allocation_count_for_single_date, total_allocation_count)

            if permissions["write"]:
                all_week_data[date_info.get("key")] = {
                    "total_allocated_hours": total_allocated_hours_for_given_week,
                    "total_working_hours": total_working_hours_for_given_week,
                    "total_worked_hours": total_worked_hours_for_given_week,
                }

            else:
                all_week_data[date_info.get("key")] = {
                    "total_allocated_hours": total_allocated_hours_for_given_week,
                    "total_working_hours": total_working_hours_for_given_week,
                }

        data.append(
            {
                **employee,
                **working_hours,
                "all_dates_data": all_dates_data,
                "all_week_data": all_week_data,
                "all_leave_data": all_leave_data,
                "employee_allocations": get_allocation_objects(employee_resource_allocation),
                "max_allocation_count_for_single_date": max_allocation_count_for_single_date,
                "employee_daily_working_hours": daily_working_hours,
            }
        )

    res["data"] = data
    res["customer"] = customer
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count
    res["permissions"] = permissions

    return res


@frappe.whitelist(methods=["GET"])
def get_leave_information(employee: str, start_date: str, end_date: str):
    """
    Get the leave information for given employee for given time range.
    """
    from next_pms.timesheet.api.employee import get_workable_days_for_employee

    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    return get_workable_days_for_employee(employee, start_date, end_date)
