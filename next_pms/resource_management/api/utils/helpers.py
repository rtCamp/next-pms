import datetime
import json

import frappe
from frappe.utils import flt
from frappe.utils.data import add_days, getdate

from next_pms.timesheet.api.team import get_week_dates


def add_customer_data_if_not_exists(customer: dict, customer_name: str | None) -> dict:
    """If customer is not present in the customer dictionary then add it with name, image and abbr information.

    Args:
        customer (dict): Running lookup dict keyed by customer name. Mutated in place.
        customer_name (str | None): The customer field value from a Resource Allocation
            record.

    Returns:
        ```py
        >>> customer = {}
        >>> add_customer_data_if_not_exists(customer, "ACME Corp")
        {"ACME Corp": {"name": "ACME Corp", "abbr": "AC", "image": "/files/acme.png"}}

        >>> add_customer_data_if_not_exists(customer, "Stark Industries")
        {
            "ACME Corp": {"name": "ACME Corp", "abbr": "AC", "image": "/files/acme.png"},
            "Stark Industries": {"name": "Stark Industries", "abbr": "SI", "image": None},
        }
        ```
    """
    if not customer_name:
        return customer

    if customer_name not in customer:
        customer_data = frappe.db.get_value(
            "Customer", customer_name, ["customer_name", "image", "custom_abbr"], as_dict=1
        )
        customer[customer_name] = {
            "name": customer_data.get("customer_name"),
            "abbr": customer_data.get("custom_abbr"),
            "image": customer_data.get("image"),
        }

    return customer


def get_allocation_objects(employee_resource_allocation: list[object]) -> object:
    """Convert the allocation object to a dictionary.

    Args:
        employee_resource_allocation (list[object]): List of Resource Allocation objects

    Returns:
        Object: Allocation dictionary
    """

    resource_object = {}

    for allocation in employee_resource_allocation:
        resource_object[allocation.name] = allocation

    return resource_object


def is_on_leave(date: datetime.date, daily_working_hours: float, leaves: list[dict], holidays: list) -> dict:
    """Determine whether an employee is on leave or a holiday on a given date,
    and calculate how many working hours they have on that day.

    Checks leave applications first, then public/employee holidays.
    A full-day leave or holiday results in 0 working hours.
    A half-day leave on the exact `date` results in half the normal daily hours.
    If neither applies, `leave_work_hours` equals `daily_working_hours` (unchanged).

    Note: `leave_work_hours` represents the hours the employee IS available to work
    on that day — not the hours taken as leave. It is 0 for a full day off and
    daily_working_hours / 2 for a half day.

    Args:
        date (datetime.date): The specific day to check.
        daily_working_hours (float): The employee's normal working hours per day
            (already converted from weekly if needed).
        leaves (list[dict]): Leave Application records for the employee, each
            containing at minimum: from_date, to_date, half_day, half_day_date.
        holidays (list): Holiday records for the employee, each containing
            holiday_date.

    Returns:
        ```py
        >>> is_on_leave(
        ...     datetime.date(2026, 5, 20), 8.0,
        ...     [{"from_date": datetime.date(2026, 5, 20), "to_date": datetime.date(2026, 5, 22),
        ...       "half_day": 0, "half_day_date": None}],
        ...     [],
        ... )
        {"on_leave": True, "leave_work_hours": 0.0}

        >>> is_on_leave(datetime.date(2026, 5, 21), 8.0, [], [])
        {"on_leave": False, "leave_work_hours": 8.0}
        ```
    """
    leave_work_hours = daily_working_hours
    on_leave = False
    for leave in leaves:
        if leave["from_date"] <= date <= leave["to_date"]:
            if leave.get("half_day") and leave.get("half_day_date") == date:
                leave_work_hours = daily_working_hours / 2
            else:
                leave_work_hours = 0
            on_leave = True

    for holiday in holidays:
        if date == holiday.holiday_date:
            leave_work_hours = 0
            on_leave = True

    return {"on_leave": on_leave, "leave_work_hours": leave_work_hours}


def get_dates_date(max_week: int, date: str) -> list[dict]:
    """Return a list of week descriptors starting from the week that contains `date`.

    Args:
        max_week (int): Number of consecutive weeks to generate.
        date (str): Anchor date string ("YYYY-MM-DD"). Any day within the desired
            starting week is acceptable — the function resolves to that week's Monday.

    Returns:
        ```py
        >>> get_dates_date(max_week=2, date="2026-05-21")
        [
            {
                "start_date": datetime.date(2026, 5, 18),
                "end_date": datetime.date(2026, 5, 24),
                "key": "This Week",
                "dates": [
                    datetime.date(2026, 5, 18), # Monday
                    datetime.date(2026, 5, 19),
                    datetime.date(2026, 5, 20),
                    datetime.date(2026, 5, 21),
                    datetime.date(2026, 5, 22), # Friday
                ],
            },
            {
                "start_date": datetime.date(2026, 5, 25),
                "end_date": datetime.date(2026, 5, 31),
                "key": "May 25 - May 29",
                "dates": [
                    datetime.date(2026, 5, 25),
                    datetime.date(2026, 5, 26),
                    datetime.date(2026, 5, 27),
                    datetime.date(2026, 5, 28),
                    datetime.date(2026, 5, 29),
                ],
            },
        ]
        ```
    """

    next_dates = []
    current_date = getdate(date)

    # fetch the currant and next week dates object
    for _ in range(max_week):
        week = get_week_dates(date=current_date, ignore_weekend=True)
        next_dates.append(week)
        current_date = add_days(getdate(week["end_date"]), 1)

    current_date = getdate(date)

    return next_dates


def find_worked_hours(timesheet_data: list, date: str, project: str = None):
    total_hours = 0
    for ts in timesheet_data:
        if date != ts.start_date:
            continue

        if project:
            if ts.parent_project == project:
                total_hours += flt(ts.get("total_hours"))
        else:
            total_hours += flt(ts.get("total_hours"))
    return total_hours


def _parse_multi_select_filter(value: str | list | None) -> list | None:
    if not value:
        return None
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            value = parsed if isinstance(parsed, list) else [parsed]
        except json.JSONDecodeError:
            value = [value]
    if isinstance(value, list) and len(value) > 0:
        return value
    return None


def filter_project_list(
    project_name=None,
    customer=None,
    billing_type=None,
    project_type=None,
    project_manager=None,
    tag=None,
    page_length=10,
    start=0,
    ids=None,
):
    from next_pms.timesheet.api import get_count

    start = int(start)
    page_length = int(page_length)

    filters = {}

    fields = ["name", "project_name", "status"]

    if ids:
        filters["name"] = ["in", ids]

    else:
        if project_name:
            filters["project_name"] = ["like", f"%{project_name}%"]

        customer_values = _parse_multi_select_filter(customer)
        if customer_values:
            filters["customer"] = ["in", customer_values]

        billing_type_values = _parse_multi_select_filter(billing_type)
        if billing_type_values:
            filters["custom_billing_type"] = ["in", billing_type_values]

        project_type_values = _parse_multi_select_filter(project_type)
        if project_type_values:
            filters["project_type"] = ["in", project_type_values]

        project_manager_values = _parse_multi_select_filter(project_manager)
        if project_manager_values:
            filters["custom_project_manager"] = ["in", project_manager_values]

        tag_values = _parse_multi_select_filter(tag)
        if tag_values:
            tagged_projects = frappe.get_all(
                "Tag Link",
                filters={"document_type": "Project", "tag": ["in", tag_values]},
                pluck="document_name",
                distinct=True,
            )
            filters["name"] = ["in", tagged_projects or []]

    projects = frappe.get_list(
        "Project",
        filters=filters,
        fields=fields,
        start=start,
        page_length=page_length,
    )

    total_count = get_count("Project", filters=filters)

    return projects, total_count


def resource_api_permissions_check():
    if "Contractor" in frappe.get_roles() and frappe.session.user != "Administrator":
        frappe.throw(
            frappe._("You don't have permission to access this resource"),
            frappe.PermissionError,
        )
    frappe.only_for(["Projects Manager", "Projects User", "Employee"], message=True)

    roles = frappe.get_roles()

    if ("Projects Manager" in roles) or ("Projects User" in roles):
        return {"read": True, "write": True, "delete": True}

    return {"read": False, "write": False, "delete": False}


def get_employees_by_skills(skill_criteria):
    """
    Retrieve employee IDs from Employee Skill Map Doctype based on skill and proficiency criteria.

    Args:
        skill_criteria (list[dict]): A list of dictionaries where each dictionary contains:
            - name (str): Skill name.
            - proficiency (int): Proficiency level.
            - operator (str): Comparison operator (>, <, =, >=, <=).

    Returns:
        list: List of employee IDs matching the skill criteria.
    """
    try:
        where_condition = ""
        conditions = []

        for criteria in skill_criteria:
            sub_condition = "(`skill` = '{0}' and `proficiency` {1} {2})".format(
                criteria["name"], criteria["operator"], criteria["proficiency"]
            )
            conditions.append(sub_condition)

        where_condition = " OR ".join(conditions)

        # nosemgrep
        res = frappe.db.sql(
            """SELECT parent FROM `tabEmployee Skill` WHERE {0} GROUP BY parent HAVING COUNT(DISTINCT skill) = {1}""".format(
                where_condition, len(skill_criteria)
            ),
            as_dict=True,
        )

        return [r.get("parent") for r in res]
    except Exception as e:
        frappe.log_error(f"Error fetching employees by skills: {e}")
        return []
