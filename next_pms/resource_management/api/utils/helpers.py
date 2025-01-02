import frappe
from frappe.utils import flt
from frappe.utils.data import add_days, getdate, nowdate

from next_pms.timesheet.api.team import get_week_dates


def handle_customer(customer, customer_name):
    """If customer is not present in the customer dictionary then add it with name, image and abbr information.

    Args:
        customer (object): customer object
        customer_name (string): name of customer

    Returns:
        customer (object): customer object
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


def is_on_leave(date, daily_working_hours, leaves, holidays):
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


def get_dates_date(max_week: int, date: str):
    """Get the dates for the given week count.

    Args:
        max_week (number): Number of weeks
        date (string): Date string

    Returns:
        object: date objects
    """

    dates = []
    now = nowdate()

    # fetch the currant and next week dates object
    for _ in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week, ignore_weekend=True)
        dates.append(week)
        date = add_days(getdate(week["end_date"]), 1)

    return dates


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


def filter_employee_list(
    employee_name=None,
    business_unit=None,
    designation=None,
    page_length=10,
    status=None,
    reports_to=None,
    start=0,
    ignore_permissions=False,
):
    from next_pms.timesheet.api.utils import filter_employees

    start = int(start)
    page_length = int(page_length)

    employees, count = filter_employees(
        employee_name,
        page_length=page_length,
        start=start,
        business_unit=business_unit,
        designation=designation,
        status=status,
        reports_to=reports_to,
        ignore_permissions=True,
    )

    return employees, count


def filter_project_list(
    project_name=None,
    customer=None,
    page_length=10,
    start=0,
):
    import json

    from next_pms.timesheet.api.utils import get_count

    start = int(start)
    page_length = int(page_length)

    filters = {}

    fields = ["name", "project_name", "status"]

    if project_name:
        filters["project_name"] = ["like", f"%{project_name}%"]

    if customer:
        if isinstance(customer, str):
            customer = json.loads(customer)
        if customer and len(customer) > 0:
            filters["customer"] = ["in", customer]

    projects = frappe.get_list("Project", filters=filters, fields=fields, start=start, page_length=page_length)

    total_count = get_count("Project", filters=filters)

    return projects, total_count


def resource_api_permissions_check():
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

        res = frappe.db.sql(
            """SELECT DISTINCT parent FROM `tabEmployee Skill` WHERE {0}""".format(where_condition),
            as_dict=True
        )

        return [r.get("parent") for r in res]
    except Exception as e:
        frappe.log_error(f"Error fetching employees by skills: {e}")
        return []
