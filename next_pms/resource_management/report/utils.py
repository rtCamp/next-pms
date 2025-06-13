from datetime import datetime

from frappe.utils import add_days, flt, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave


def calculate_employee_hours(
    daily_hours: float,
    start_date: datetime.date,
    end_date: datetime.date,
    resource_allocations: list,
    holidays: list,
    leaves: list,
):
    """
    Calculate the total hours allocated to an employee within a given date range, excluding holidays and leaves.

    :param daily_hours: The number of working hours per day.
    :param start_date: The start date of the period to calculate hours for.
    :param end_date: The end date of the period to calculate hours for.
    :param resource_allocations: A list of resource allocation of an employee. It can be filtered list of allocations, for example: only billable allocations.
    :param holidays: A list of holiday dates to exclude from the calculation.
    :param leaves: A list of leave dates to exclude from the calculation.

    :return: The total number of hours allocated to the employee within the specified date range."""
    if isinstance(start_date, str):
        start_date = getdate(start_date)
    if isinstance(end_date, str):
        end_date = getdate(end_date)
    total_hours = 0
    date = start_date

    while date <= end_date:
        data = is_on_leave(date, daily_hours, leaves, holidays)
        if data.get("on_leave"):
            date = add_days(date, 1)
            continue
        allocation_for_date = get_employee_allocations_for_date(resource_allocations, date)
        if not allocation_for_date:
            date = add_days(date, 1)
            continue
        for allocation in allocation_for_date:
            total_hours += allocation.hours_allocated_per_day
        date = add_days(date, 1)
    return total_hours


def calculate_employee_available_hours(
    daily_hours: float,
    start_date: datetime.date,
    end_date: datetime.date,
    resource_allocations: list,
    holidays: list,
    leaves: list,
):
    """
    Calculate the total available hours for an employee within a given date range, excluding holidays and leaves.

    :param daily_hours: The number of working hours per day.
    :param start_date: The start date of the period to calculate free hours for.
    :param end_date: The end date of the period to calculate free hours for.
    :param resource_allocations: A list of resource allocation objects containing allocation details.
    :param holidays: A list of holiday dates to exclude from the calculation.
    :param leaves: A list of leave dates to exclude from the calculation.

    :return: The total number of free hours for the employee within the specified date range.
    """
    if isinstance(start_date, str):
        start_date = getdate(start_date)
    if isinstance(end_date, str):
        end_date = getdate(end_date)
    total_hours = 0
    total_hours_for_resource_allocation = 0
    date = start_date

    while date <= end_date:
        data = is_on_leave(date, daily_hours, leaves, holidays)
        if not data.get("on_leave"):
            total_hours += daily_hours
            allocation_for_date = get_employee_allocations_for_date(resource_allocations, date)
            for allocation in allocation_for_date:
                total_hours_for_resource_allocation += allocation.hours_allocated_per_day
        else:
            total_hours += flt(data.get("leave_work_hours"))

        date = add_days(date, 1)

    return total_hours - total_hours_for_resource_allocation


def get_employee_allocations_for_date(employee_allocations: list, date: datetime.date):
    """
    Get all employee allocations for a specific date.

    :param employee_allocations: A list of resource allocation objects containing allocation details.
    :param date: The date for which to retrieve allocations.

    :return: A list of allocations that are active on the specified date.
    """
    return [
        allocation
        for allocation in employee_allocations
        if getdate(allocation.allocation_start_date) <= getdate(date) <= getdate(allocation.allocation_end_date)
    ]
