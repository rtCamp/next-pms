from typing import Any, Dict, List, Union
import frappe
from frappe import _, get_cached_doc, get_cached_value, get_value
from frappe import throw as error
from frappe.utils import get_date_str
from hrms.hr.utils import get_holidays_for_employee

from next_pms.resource_management.api.utils.query import get_employee_leaves


def get_employee_leaves_and_holidays(employee: str, start_date: Any, end_date: Any) -> Dict[str, List]:
    """Retrieve holidays and leaves for a specific employee within a date range.

    Args:
        employee (str): Employee identifier.
        start_date (Any): Start of the date range.
        end_date (Any): End of the date range.

    Returns:
        Dict[str, List]: A dictionary containing lists of holidays and leaves.
    """
    holidays = get_holidays_for_employee(employee, start_date, end_date)
    leaves = get_employee_leaves(employee, get_date_str(start_date), get_date_str(end_date))
    return {"holidays": holidays, "leaves": leaves}


def get_employee_joining_date_based_on_work_history(employee: Union[Dict, str]) -> Any:
    """Determine the employee's earliest joining date based on internal work history.

    If no work history is configured, falls back to the date_of_joining field on the Employee document.

    Args:
        employee (Union[Dict, str]): Employee ID or a dict representation of the Employee document.

    Returns:
        Any: Joining date (Date object or string).
    """
    if isinstance(employee, str):
        employee = get_value("Employee", employee, ["name as employee", "date_of_joining"], as_dict=True)
    joining_date = employee.get("date_of_joining")
    name = employee.get("employee")
    if not joining_date:
        joining_date = get_cached_value("Employee", name, "date_of_joining")

    work_history = get_cached_doc("Employee", name).get("internal_work_history")
    if not work_history:
        return joining_date

    work_history.sort(key=lambda x: x.get("from_date"))
    date = work_history[0].get("from_date")
    if not date:
        return joining_date
    return date


def get_employee_salary(
    employee: str,
    to_currency: str,
    date: Any = None,
    throw: bool = True,
    ctc: float | None = None,
    salary_currency: str | None = None,
) -> Dict[str, float]:
    """Calculate the monthly and hourly salary rates for an employee.

    Optionally performs currency conversion if the salary currency is different from the target currency.

    Args:
        employee (str): Employee identifier.
        to_currency (str): Target currency for the salary calculation.
        date (Any, optional): Date for selecting currency exchange rates. Defaults to None.
        throw (bool, optional): Whether to raise an exception if salary configuration is missing. Defaults to True.
        ctc (float | None, optional): Cost to Company rate. Defaults to None.
        salary_currency (str | None, optional): Salary currency of the CTC rate. Defaults to None.

    Returns:
        Dict[str, float]: A dictionary containing calculated monthly_salary and hourly_salary.
    """
    from erpnext.setup.utils import get_exchange_rate

    if not ctc or not salary_currency:
        ctc, salary_currency = get_cached_value("Employee", employee, ["ctc", "salary_currency"])
        if (not ctc or not salary_currency) and throw:
            error(_("Salary Currency or CTC not set for employee {0}").format(employee))

    if salary_currency != to_currency:
        exchange_rate = get_exchange_rate(salary_currency, to_currency, date)
        ctc = ctc * (exchange_rate or 1)

    monthly_working_hours = get_employee_monthly_working_hours(employee)
    monthly_salary = ctc / 12
    hourly_salary = monthly_salary / monthly_working_hours

    return {"monthly_salary": monthly_salary, "hourly_salary": hourly_salary}


def get_employee_monthly_working_hours(employee: str) -> float:
    """Get the standard monthly working hours for an employee.

    Args:
        employee (str): Employee identifier.

    Returns:
        float: Calculated monthly working hours.
    """
    from next_pms.timesheet.api.employee import get_employee_working_hours

    work_info = get_employee_working_hours(employee)
    if work_info.get("working_frequency") != "Per Day":
        working_hours = work_info.get("working_hours", 8)
        monthly_working_hours = working_hours * 4
    else:
        monthly_working_hours = 160
    return monthly_working_hours


def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    date: str = None,
) -> float:
    """Convert a financial amount from one currency to another using the exchange rate.

    Args:
        amount (float): The amount to convert.
        from_currency (str): Source currency.
        to_currency (str): Target currency.
        date (str, optional): Date for selecting currency exchange rates. Defaults to None.

    Returns:
        float: Converted amount.
    """
    from erpnext.setup.utils import get_exchange_rate

    if from_currency == to_currency:
        return amount

    exchange_rate = get_exchange_rate(from_currency, to_currency, date)
    return amount * (exchange_rate or 1)


def generate_flat_tree(
    doctype: str, nsm_field: str, filters: dict, fields: List[str] | None = None
) -> Dict[str, Any]:
    """Generates a hierarchical tree representation in flat and nested lookup structures.

    Args:
        doctype (str): The Frappe DocType to query.
        nsm_field (str): The parent-linking fieldname.
        filters (dict): Database filters.
        fields (List[str] | None, optional): Specific fields to retrieve. Defaults to None.

    Returns:
        Dict[str, Any]: A dictionary containing flat "level" list and "with_children" dictionary.
    """
    from collections import deque
    from frappe import get_all

    flat_tree = []

    if not fields:
        fields = ["name"]
    if nsm_field not in fields:
        fields.append(nsm_field)
    if "name" not in fields:
        fields.append("name")

    data = get_all(doctype, fields=fields, filters=filters)

    lookup_dict = {d["name"]: d for d in data}
    children_dict = {d["name"]: {**d, "childrens": []} for d in data}

    for d in data:
        parent = d.get(nsm_field)
        if parent and parent in children_dict:
            children_dict[parent]["childrens"].append(d)

    # Find root nodes — those with no parent, or parent not in filtered data
    root_nodes = {d["name"] for d in data if not d.get(nsm_field) or d.get(nsm_field) not in lookup_dict}

    # fallback: if no roots detected, treat all as roots (flat list)
    if not root_nodes:
        root_nodes = set(lookup_dict.keys())

    queue = deque([(lookup_dict[root], 0) for root in root_nodes])
    visited = set()

    while queue:
        current, level = queue.popleft()

        if current["name"] in visited:
            continue
        visited.add(current["name"])

        current["level"] = level
        flat_tree.append(current)

        children = children_dict.get(current["name"], {})
        for child in children.get("childrens", []):
            queue.append((child, level + 1))

    return {"level": flat_tree, "with_children": children_dict}


def employee_age_in_company(employee: Any, end_date: Any) -> str:
    """Calculate the total service duration of an employee within the company.

    Considers internal work history for continuous calculation.

    Args:
        employee (Any): Employee document or object containing date_of_joining and employee identifier.
        end_date (Any): Evaluation end date.

    Returns:
        str: Service duration description (e.g., "5 years 3 months").
    """
    from frappe import get_all
    from frappe.utils import month_diff

    all_companies = get_all("Company", pluck="name")

    all_work_history = get_all(
        "Employee Internal Work History",
        filters={
            "parent": employee.employee,
            "custom_company": ["in", all_companies],
        },
        fields=["custom_company", "from_date", "to_date"],
    )

    total_age = month_diff(end_date, employee.date_of_joining)

    for work_history in all_work_history:
        if not work_history.from_date or not work_history.to_date:
            continue

        if work_history.from_date <= employee.date_of_joining <= work_history.to_date:
            continue

        total_age += month_diff(work_history.to_date, work_history.from_date)

    years = int(total_age / 12)
    remaining_months = int(total_age % 12)

    return f"{years} years {remaining_months} months" if years > 0 else f"{remaining_months} months"
