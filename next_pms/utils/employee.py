from frappe import _, get_cached_doc, get_cached_value, get_value
from frappe import throw as error
from frappe.utils import get_date_str
from hrms.hr.utils import get_holidays_for_employee

from next_pms.resource_management.api.utils.query import get_employee_leaves


def get_employee_leaves_and_holidays(employee, start_date, end_date):
    holidays = get_holidays_for_employee(employee, start_date, end_date)
    leaves = get_employee_leaves(employee, get_date_str(start_date), get_date_str(end_date))
    return {"holidays": holidays, "leaves": leaves}


def get_employee_joining_date_based_on_work_history(employee: dict | str):
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
    date: any = None,
    throw: bool = True,
    ctc: float | None = None,
    salary_currency: str | None = None,
):
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


def get_employee_monthly_working_hours(employee: str):
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
):
    from erpnext.setup.utils import get_exchange_rate

    if from_currency == to_currency:
        return amount

    exchange_rate = get_exchange_rate(from_currency, to_currency, date)
    return amount * (exchange_rate or 1)


def generate_flat_tree(doctype: str, nsm_field: str, filters: dict, fields: list[str] | None = None):
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


def employee_age_in_company(employee, end_date):
    from frappe import get_all
    from frappe.utils import month_diff

    all_comapines = get_all("Company", pluck="name")

    all_work_history = get_all(
        "Employee Internal Work History",
        filters={
            "parent": employee.employee,
            "custom_company": ["in", all_comapines],
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
