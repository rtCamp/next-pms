from collections import defaultdict

BU_FIELD_NAME = "custom_business_unit"

from erpnext.setup.utils import get_exchange_rate
from frappe.utils import getdate


def convert_currency(value, from_currency, to_currency, date=None):
    if not date:
        date = getdate()
    exchange_rate = get_exchange_rate(from_currency, to_currency, transaction_date=date)
    return value * (exchange_rate or 1)


def get_employee_fields(has_bu_field=False):
    fields = ["name", "reports_to", "status", "designation", "employee_name", "ctc", "salary_currency as currency"]
    if has_bu_field:
        fields.append(BU_FIELD_NAME)
    return fields


def get_employee_filters(filters=None, has_bu_field=False):
    if not filters:
        return None

    employee_filters = {}

    if filters.get("status"):
        employee_filters["status"] = filters["status"]

    if filters.get("designation"):
        employee_filters["designation"] = ["in", filters["designation"]]

    if filters.get("business_unit") and has_bu_field:
        employee_filters[BU_FIELD_NAME] = ["in", filters["business_unit"]]

    return employee_filters


def sort_by_reports_to(employees):
    result = []
    reporting_map = defaultdict(list)

    employee_map = {}

    for emp in employees:
        employee_map[emp["name"]] = emp
        reporting_map[emp.get("reports_to")].append(emp["name"])

    def dfs(emp_id):
        emp = employee_map.get(emp_id)
        if emp:
            result.append(emp)
        for subordinate in sorted(reporting_map.get(emp_id, [])):
            dfs(subordinate)

    top_level_emps = [emp for emp in employees if emp["reports_to"] not in employee_map]

    for top_emp in sorted(top_level_emps, key=lambda x: x["name"]):
        dfs(top_emp["name"])
    return result
