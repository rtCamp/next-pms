from collections import defaultdict
from copy import deepcopy

from erpnext.setup.utils import get_exchange_rate
from frappe import _, _dict, throw
from frappe.utils import getdate

BU_FIELD_NAME = "custom_business_unit"


def convert_currency(value, from_currency, to_currency, date=None):
    if not date:
        date = getdate()
    exchange_rate = get_exchange_rate(from_currency, to_currency, transaction_date=date)
    return value * (exchange_rate or 1)


def get_employee_fields(has_bu_field=False):
    fields = [
        "name",
        "reports_to",
        "status",
        "designation",
        "employee_name",
        "ctc",
        "salary_currency as currency",
        "custom_working_hours",
        "custom_work_schedule",
        "holiday_list",
    ]
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

    if filters.get("company"):
        employee_filters["company"] = filters["company"]
    return employee_filters


def sort_by_reports_to(employees):
    """
    Sorts employees based on their reporting hierarchy.
    i.e. All employees will be grouped under their respective managers

    :example:
    employees = [
        {"name": "manager", "reports_to": None},
        {"name": "Bob", "reports_to": "Alice"},
        {"name": "Charlie", "reports_to": "Alice"},
        {"name": "Manager-1", "reports_to": "None"},
    ]
    """
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

    top_level_emps = [
        emp for emp in employees if not emp.get("reports_to") or emp.get("reports_to") not in employee_map
    ]

    for top_emp in sorted(top_level_emps, key=lambda x: x["name"]):
        dfs(top_emp["name"])
    return result


def sort_by_business_unit(employees, has_bu_field=False, currency="USD"):
    """
    Sorts employees based on their business unit.
    If has_bu_field is True, it will sort by the business unit field.
    """
    if not has_bu_field:
        return employees

    units = list({emp[BU_FIELD_NAME] for emp in employees if emp.get(BU_FIELD_NAME)})
    if not units:
        return employees
    result = []
    default = deepcopy(employees[0])
    empty_copy = {key: 0 for key in default}

    for unit in units:
        empty_copy.update({"name": unit, "indent": 0, "has_value": False, "is_employee": False, "currency": currency})
        bu_employees = [emp for emp in employees if emp.get(BU_FIELD_NAME) == unit]
        if bu_employees:
            empty_copy["has_value"] = True
            result.append(_dict(empty_copy.copy()))
            for e in bu_employees:
                e["indent"] = 1
                e["has_value"] = False

            sorted_bu_employees = sorted(bu_employees, key=lambda x: x.get("name", ""))
            result.extend(sorted_bu_employees)
    return result


def sort_by_designation(employees, currency="USD"):
    """
    Sorts employees based on their designation.
    """

    designations = list({emp["designation"] for emp in employees if emp.get("designation")})

    result = []
    default = deepcopy(employees[0])
    empty_copy = {key: 0 for key in default}

    for des in designations:
        empty_copy.update({"name": des, "indent": 0, "has_value": False, "is_employee": False, "currency": currency})
        data = [emp for emp in employees if emp.get("designation") == des]
        if data:
            empty_copy["has_value"] = True
            result.append(_dict(empty_copy.copy()))
            for e in data:
                e["indent"] = 1
                e["has_value"] = False

            sorted_employees = sorted(data, key=lambda x: x.get("name", ""))
            result.extend(sorted_employees)
    return result


def filter_by_capacity(data, show_no_capacity):
    """
    Filters the data to include only employees with no capacity or those with capacity.
    If show_no_capacity is True, it will include employees with no capacity.
    """
    if show_no_capacity:
        return [emp for emp in data if emp.get("available_capacity", 0) == 0 and emp.get("is_employee", True)]
    else:
        return [emp for emp in data if emp.get("available_capacity", 0) > 0 and emp.get("is_employee", True)]


def validate_filters(filters):
    if not filters.get("from") or not filters.get("to"):
        throw(_("Both 'From' and 'To' dates must be provided."))

    start_date = getdate(filters.get("from"))
    end_date = getdate(filters.get("to"))

    if start_date > end_date:
        throw(_("The 'From' date should be than the 'To' date."))
