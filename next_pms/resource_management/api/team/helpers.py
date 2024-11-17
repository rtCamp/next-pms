import frappe
from frappe.utils import flt


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
    page_length=10,
    start=0,
):
    from next_pms.timesheet.api.utils import filter_employees

    start = int(start)
    page_length = int(page_length)

    employees, count = filter_employees(
        employee_name,
        page_length=page_length,
        start=start,
        business_unit=business_unit,
    )

    return employees, count
