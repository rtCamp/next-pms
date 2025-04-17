from frappe import get_cached_doc, get_cached_value
from frappe.utils import get_date_str
from hrms.hr.utils import get_holidays_for_employee

from next_pms.resource_management.api.utils.query import get_employee_leaves


def get_employee_leaves_and_holidays(employee, start_date, end_date):
    holidays = get_holidays_for_employee(employee, start_date, end_date)
    leaves = get_employee_leaves(employee, get_date_str(start_date), get_date_str(end_date))
    return {"holidays": holidays, "leaves": leaves}


def get_employee_joining_date_based_on_work_history(employee: dict):
    joining_date = employee.get("date_of_joining")
    name = employee.get("employee")
    if not joining_date:
        joining_date = get_cached_value("Employee", name, "date_of_joining")

    work_history = get_cached_doc("Employee", name).get("internal_work_history")
    if not work_history:
        return joining_date

    work_history.sort(key=lambda x: x.get("from_date"))
    return work_history[0].get("from_date")


def get_employee_hourly_salary(employee: str, to_currency: str):
    from erpnext.setup.utils import get_exchange_rate

    ctc, salary_currency = get_cached_value("Employee", employee, ["ctc", "salary_currency"])
    monthly_salary = ctc / 12
    hourly_salary = monthly_salary / 160
    if salary_currency != to_currency:
        exchange_rate = get_exchange_rate(salary_currency, to_currency)
        hourly_salary = hourly_salary * (exchange_rate or 1)
    return hourly_salary


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
