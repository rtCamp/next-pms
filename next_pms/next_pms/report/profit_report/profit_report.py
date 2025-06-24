# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe import _, get_all, get_meta, qb
from frappe.utils import add_days, date_diff, flt, getdate
from frappe.utils.caching import redis_cache

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.timesheet.api.employee import get_employee_daily_working_norm
from next_pms.utils.employee import (
    convert_currency,
    get_employee_joining_date_based_on_work_history,
    get_employee_leaves_and_holidays,
    get_employee_salary,
)


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_data(filters=None):
    res = []
    start_date = getdate(filters.get("from_date"))
    end_date = getdate(filters.get("to_date"))
    employees = get_employees(
        department=filters.get("department"),
        status=filters.get("status"),
        start_date=start_date,
        end_date=end_date,
    )
    emp_names = [employee.employee for employee in employees]

    timesheets = get_employees_timesheet_hours(emp_names, start_date, end_date)
    billing_amount = get_employees_billable_amount(emp_names, start_date, end_date)
    for employee in employees:
        emp_timesheet = next(
            (timesheet for timesheet in timesheets if timesheet.employee == employee.employee),
            None,
        )
        if employee.status != "Active" and not emp_timesheet:
            continue
        employee_leave_and_holidays = get_employee_leaves_and_holidays(employee.employee, start_date, end_date)
        daily_hours = get_employee_daily_working_norm(employee.employee)
        num_of_holidays = len(employee_leave_and_holidays.get("holidays"))
        num_unpaid_leaves = calculate_un_paid_leaves(employee_leave_and_holidays)
        total_hours = calculate_employee_total_hours(
            employee,
            start_date=start_date,
            end_date=end_date,
            daily_hours=daily_hours,
            employee_leave_and_holidays=employee_leave_and_holidays,
        )

        if not emp_timesheet:
            emp_timesheet = {"billable_hours": 0, "non_billable_hours": 0}
        employee["billable_hours"] = emp_timesheet.get("billable_hours", 0)
        employee["non_billable_hours"] = emp_timesheet.get("non_billable_hours", 0)
        employee["capacity"] = total_hours
        employee["utilization"] = employee["billable_hours"] + employee["non_billable_hours"]
        employee["hourly_rate"] = get_employee_salary(employee.employee, "USD", throw=False).get("hourly_salary", 0)
        employee["cost"] = calculate_employee_cost(
            employee,
            start_date=start_date,
            end_date=end_date,
            num_of_holidays=num_of_holidays,
            num_unpaid_leaves=num_unpaid_leaves,
            daily_hours=daily_hours,
            hourly_rate=employee["hourly_rate"],
        )
        employee["revenue"] = billing_amount.get(employee.employee, 0)
        employee["profit"] = employee["revenue"] - employee["cost"]
        employee["profit_percentage"] = (employee["profit"] / employee["revenue"]) * 100 if employee["revenue"] else 0
        employee["employee_name"] = employee.get("employee_name")
        res.append(employee)
    return res


def calculate_employee_cost(
    employee,
    start_date,
    end_date,
    num_of_holidays,
    num_unpaid_leaves,
    daily_hours,
    hourly_rate,
):
    days = 0

    has_employee_left = True if employee.status == "Left" and employee.relieving_date else False

    if has_employee_left and start_date >= employee.relieving_date and employee.relieving_date <= end_date:
        days = date_diff(employee.relieving_date, start_date) + 1
    elif start_date <= employee.date_of_joining <= end_date:
        days = date_diff(end_date, employee.date_of_joining) + 1
    elif has_employee_left and start_date > employee.relieving_date:
        days = 0
    else:
        days = date_diff(end_date, start_date) + 1

    days = days - (num_of_holidays + num_unpaid_leaves)
    if days < 1:
        return 0

    return (days * daily_hours) * hourly_rate


def calculate_un_paid_leaves(employee_leave_and_holidays):
    leaves = employee_leave_and_holidays.get("leaves")
    leave_types = get_leave_types()
    leave_types_dict = {leave_type.name: leave_type for leave_type in leave_types}
    unpaid_leaves = 0
    for leave in leaves:
        leave_type = leave_types_dict.get(leave.leave_type)
        if not leave_type.is_lwp:
            continue
        unpaid_leaves += leave.total_leave_days

    return unpaid_leaves


def calculate_employee_total_hours(employee, start_date, end_date, daily_hours, employee_leave_and_holidays):
    total_hours = 0

    has_employee_left = True if employee.status == "Left" and employee.relieving_date else False

    while start_date <= end_date:
        if start_date < employee.date_of_joining:
            start_date = add_days(start_date, 1)
            continue
        data = is_on_leave(
            start_date,
            daily_hours,
            employee_leave_and_holidays.get("leaves"),
            employee_leave_and_holidays.get("holidays"),
        )

        if not data.get("on_leave"):
            total_hours += daily_hours
        else:
            total_hours += flt(data.get("leave_work_hours"))

        if has_employee_left and start_date > employee.relieving_date:
            break
        start_date = add_days(start_date, 1)
    return total_hours


def get_employees(start_date, end_date, department=None, status=None):
    if status:
        filter = {"status": status}
    else:
        filter = {}
    if department:
        filter.update({"department": ["in", department]})

    if status == "Left":
        filter.update({"relieving_date": ["between", [start_date, end_date]]})
    fields = [
        "name as employee",
        "employee_name",
        "designation",
        "date_of_joining",
        "department",
        "status",
        "relieving_date",
    ]
    meta = get_meta("Employee")
    if meta.has_field("custom_business_unit"):
        fields.append("custom_business_unit")

    employees = get_all(
        "Employee",
        filters=filter,
        fields=fields,
        order_by="employee_name ASC",
    )
    for employee in employees:
        joining_date = get_employee_joining_date_based_on_work_history(employee)
        employee["date_of_joining"] = joining_date
        employee["currency"] = "USD"

    return employees


def get_employees_billable_amount(employees, start_date, end_date):
    data = {}
    Timesheet = qb.DocType("Timesheet")
    TimesheetDetail = qb.DocType("Timesheet Detail")
    query = (
        qb.from_(Timesheet)
        .join(TimesheetDetail)
        .on(Timesheet.name == TimesheetDetail.parent)
        .select(
            Timesheet.employee,
            Timesheet.currency,
            TimesheetDetail.billing_amount,
        )
        .where(Timesheet.start_date[start_date:end_date])
        .where(Timesheet.employee.isin(employees))
        .where(TimesheetDetail.is_billable == 1)
        .where(Timesheet.docstatus.isin([0, 1]))
    )

    res = query.run(as_dict=True)
    for row in res:
        if row.employee not in data:
            data[row.employee] = 0
        amount = convert_currency(row.billing_amount, row.currency, "USD")
        data[row.employee] += amount
    return data


def get_employees_timesheet_hours(employees, start_date, end_date):
    from pypika import Case
    from pypika.functions import Sum

    Timesheet = qb.DocType("Timesheet")
    TimesheetDetail = qb.DocType("Timesheet Detail")

    query = (
        qb.from_(Timesheet)
        .join(TimesheetDetail)
        .on(Timesheet.name == TimesheetDetail.parent)
        .select(
            Timesheet.employee,
            Sum(Case().when(TimesheetDetail.is_billable == 1, TimesheetDetail.hours).else_(0)).as_("billable_hours"),
            Sum(Case().when(TimesheetDetail.is_billable == 0, TimesheetDetail.hours).else_(0)).as_(
                "non_billable_hours"
            ),
        )
        .where(Timesheet.start_date[start_date:end_date])
        .where(Timesheet.employee.isin(employees))
        .where(Timesheet.docstatus.isin([0, 1]))
        .groupby(Timesheet.employee)
    )
    return query.run(as_dict=True)


def get_columns():
    columns = [
        {
            "fieldname": "employee",
            "label": _("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee Name"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "employee_name",
            "label": _("Employee Name"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "designation",
            "label": _("Designation"),
            "fieldtype": "Link",
            "options": "Designation",
        },
        {
            "fieldname": "status",
            "label": _("Status"),
            "fieldtype": "Data",
        },
        {
            "fieldname": "department",
            "label": _("Department"),
            "fieldtype": "Link",
            "options": "Department",
        },
        {
            "fieldname": "custom_business_unit",
            "label": _("Business Unit"),
            "fieldtype": "Link",
            "options": "Business Unit",
        },
        {
            "fieldname": "capacity",
            "label": _("Capacity"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "billable_hours",
            "label": _("Billable Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "non_billable_hours",
            "label": _("Non Billable Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "utilization",
            "label": _("Utilization"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "hourly_rate",
            "label": _("Hourly $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "cost",
            "label": _("Cost $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "revenue",
            "label": _("Revenue $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "profit",
            "label": _("Profit $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "profit_percentage",
            "label": _("Profit %"),
            "fieldtype": "Percent",
        },
    ]

    meta = get_meta("Employee")
    if not meta.has_field("custom_business_unit"):
        columns.pop(3)
    return columns


@redis_cache()
def get_leave_types():
    return get_all("Leave Type", fields=["*"])
