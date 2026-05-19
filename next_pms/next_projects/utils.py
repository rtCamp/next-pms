# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from frappe.utils import add_days, flt, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave


def count_working_days(start_date, end_date, daily_working_hours, holidays, leaves):
    """
    Count working days between start_date and end_date (inclusive),
    excluding holidays and full leave days. Half-day leaves count as 0.5 days.

    Args:
        start_date: Start date of the range
        end_date: End date of the range (inclusive)
        daily_working_hours: Number of working hours per day
        holidays: List of holiday records with 'holiday_date' field
        leaves: List of leave records with 'from_date', 'to_date', 'half_day', 'half_day_date' fields

    Returns:
        float: Number of working days (can be fractional for half-day leaves)
    """
    if getdate(start_date) > getdate(end_date):
        return 0

    if daily_working_hours <= 0:
        return 0

    working_days = 0
    current_date = getdate(start_date)
    end_date = getdate(end_date)

    while current_date <= end_date:
        leave_data = is_on_leave(current_date, daily_working_hours, leaves, holidays)

        if not leave_data.get("on_leave"):
            working_days += 1
        else:
            leave_work_hours = flt(leave_data.get("leave_work_hours", 0))
            if leave_work_hours > 0:
                working_days += leave_work_hours / daily_working_hours

        current_date = add_days(current_date, 1)

    return working_days
