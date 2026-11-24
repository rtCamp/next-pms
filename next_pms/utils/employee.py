import frappe
from frappe import _, get_cached_doc, get_cached_value, get_value
from frappe import throw as error
from frappe.utils import flt, get_date_str
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
        ctc = ctc * flt(exchange_rate)

    monthly_working_hours = get_employee_monthly_working_hours(employee)
    monthly_salary = ctc / 12
    hourly_salary = monthly_salary / monthly_working_hours

    return {"monthly_salary": monthly_salary, "hourly_salary": hourly_salary}


def get_employee_monthly_working_hours(employee: str):
    from next_pms.timesheet.api.employee import get_employee_working_hours

    work_info = get_employee_working_hours(employee)
    return get_monthly_working_hours(work_info.get("working_hour"), work_info.get("working_frequency"))


def get_monthly_working_hours(working_hour: float, working_frequency: str) -> float:
    """Return the monthly working hours for an employee's working hours and frequency.

    Args:
        working_hour (float): Employee.custom_working_hours, per day or per week.
        working_frequency (str): Employee.custom_work_schedule, "Per Day" or "Per Week".

    Returns:
        float: 160 for "Per Day", otherwise four weeks of `working_hour`.
    """
    if working_frequency == "Per Day":
        return 160
    return flt(working_hour) * 4


def get_salary_breakdown(employees: list[dict], to_currency: str | None = None, date: str | None = None) -> dict:
    """Return the monthly and hourly salary of each Employee row, keyed by employee.

    Args:
        employees (list[dict]): Rows with name, ctc, salary_currency, custom_working_hours and
            custom_work_schedule.
        to_currency (str | None): Currency of the amounts; each employee's salary currency when None.
        date (str | None): Exchange rate date; today when None.

    Returns:
        dict: {employee: {"monthly_salary": float, "hourly_salary": float, "currency": str}}.
        A missing exchange rate gives 0.
    """
    from erpnext.setup.utils import get_exchange_rate

    from next_pms.timesheet.api.employee import apply_working_hours_fallback

    rows = [frappe._dict(row) for row in employees]
    apply_working_hours_fallback(rows)

    exchange_rates = {}
    breakdown = {}
    for row in rows:
        currency = to_currency or row.salary_currency
        ctc = flt(row.ctc)
        if row.salary_currency != currency:
            pair = (row.salary_currency, currency)
            if pair not in exchange_rates:
                exchange_rates[pair] = flt(get_exchange_rate(row.salary_currency, currency, date))
            ctc *= exchange_rates[pair]

        monthly_salary = ctc / 12
        breakdown[row.name] = {
            "monthly_salary": monthly_salary,
            "hourly_salary": monthly_salary
            / get_monthly_working_hours(row.custom_working_hours, row.custom_work_schedule),
            "currency": currency,
        }
    return breakdown


def get_employees_salary(employees: list[str], to_currency: str | None = None, date: str | None = None) -> dict:
    """Return `get_salary_breakdown` for the given Employee IDs, read in one query."""
    if not employees:
        return {}

    Employee = frappe.qb.DocType("Employee")
    rows = (
        frappe.qb.from_(Employee)
        .select(
            Employee.name,
            Employee.ctc,
            Employee.salary_currency,
            Employee.custom_working_hours,
            Employee.custom_work_schedule,
        )
        .where(Employee.name.isin(employees))
        .run(as_dict=True)
    )
    return get_salary_breakdown(rows, to_currency, date)


def get_income_tax_slab(employee: str) -> str | None:
    """Return the income tax slab of the employee's latest submitted Salary Structure Assignment."""
    return frappe.db.get_value(
        "Salary Structure Assignment",
        {"employee": employee, "docstatus": 1},
        "income_tax_slab",
        order_by="from_date desc",
    )


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
    return amount * flt(exchange_rate)


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
    from frappe import get_all, get_meta
    from frappe.utils import month_diff

    all_comapines = get_all("Company", pluck="name")

    company_field = (
        "custom_company" if get_meta("Employee Internal Work History").has_field("custom_company") else "company"
    )

    all_work_history = get_all(
        "Employee Internal Work History",
        filters={
            "parent": employee.employee,
            company_field: ["in", all_comapines],
        },
        fields=[company_field, "from_date", "to_date"],
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
