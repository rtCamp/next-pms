# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt, getdate

from next_pms.next_projects.utils import count_working_days
from next_pms.utils.employee import get_employee_leaves_and_holidays


def on_update(doc, method):
    """
    When an employee's relieving_date is set/changed, recalculate total_cost
    for Resource Allocations that extend beyond the relieving date.

    The total_cost is recalculated to only count working days until the relieving_date,
    excluding holidays and approved/open leaves.
    """
    if not doc.has_value_changed("relieving_date"):
        return

    if not doc.relieving_date:
        return

    relieving_date = getdate(doc.relieving_date)

    allocations = frappe.get_all(
        "Resource Allocation",
        filters={
            "employee": doc.name,
            "allocation_end_date": [">", relieving_date],
        },
        fields=[
            "name",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "hourly_cost_rate",
        ],
    )

    if not allocations:
        return

    for alloc in allocations:
        alloc_start = getdate(alloc.allocation_start_date)
        hours_per_day = flt(alloc.hours_allocated_per_day)
        hourly_rate = flt(alloc.hourly_cost_rate)

        if alloc_start > relieving_date:
            total_cost = 0
        else:
            leave_holiday_data = get_employee_leaves_and_holidays(doc.name, alloc_start, relieving_date)
            holidays = leave_holiday_data.get("holidays", [])
            leaves = leave_holiday_data.get("leaves", [])

            working_days = count_working_days(alloc_start, relieving_date, hours_per_day, holidays, leaves)
            total_cost = hourly_rate * hours_per_day * working_days

        frappe.db.set_value(
            "Resource Allocation",
            alloc.name,
            {"total_cost": total_cost},
            update_modified=False,
        )
