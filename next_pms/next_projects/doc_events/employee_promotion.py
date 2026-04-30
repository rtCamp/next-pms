# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import add_days, flt, getdate

from next_pms.next_projects.utils import count_working_days
from next_pms.utils.employee import get_employee_leaves_and_holidays, get_employee_salary


def on_submit(doc, method):
    """
    Recalculate total_cost for Resource Allocations affected by employee promotion.

    For allocations spanning the promotion_date:
    - Working days before promotion: calculated with old CTC rate
    - Working days from promotion onwards: calculated with new CTC rate (revised_ctc)

    For allocations entirely after promotion: full recalculation with new rate.

    Working days exclude holidays and approved/open leaves.
    """
    employee = doc.employee
    promotion_date = getdate(doc.promotion_date)
    new_ctc = flt(doc.revised_ctc)
    new_salary_currency = doc.salary_currency

    if not new_ctc:
        return

    old_ctc = frappe.db.get_value("Employee", employee, "ctc")

    allocations = frappe.get_all(
        "Resource Allocation",
        filters={
            "employee": employee,
            "allocation_end_date": [">=", promotion_date],
        },
        fields=[
            "name",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "currency",
        ],
    )

    if not allocations:
        return

    for alloc in allocations:
        alloc_start = getdate(alloc.allocation_start_date)
        alloc_end = getdate(alloc.allocation_end_date)
        hours_per_day = flt(alloc.hours_allocated_per_day)
        target_currency = alloc.currency

        leave_holiday_data = get_employee_leaves_and_holidays(employee, alloc_start, alloc_end)
        holidays = leave_holiday_data.get("holidays", [])
        leaves = leave_holiday_data.get("leaves", [])

        if alloc_start >= promotion_date:
            new_salary_info = get_employee_salary(
                employee=employee,
                to_currency=target_currency,
                ctc=new_ctc,
                salary_currency=new_salary_currency,
                throw=False,
            )
            if not new_salary_info:
                continue

            hourly_rate = flt(new_salary_info.get("hourly_salary", 0))
            working_days = count_working_days(alloc_start, alloc_end, hours_per_day, holidays, leaves)
            total_cost = hourly_rate * hours_per_day * working_days
        else:
            old_salary_info = get_employee_salary(
                employee=employee,
                to_currency=target_currency,
                ctc=old_ctc,
                salary_currency=new_salary_currency,
                throw=False,
            )
            new_salary_info = get_employee_salary(
                employee=employee,
                to_currency=target_currency,
                ctc=new_ctc,
                salary_currency=new_salary_currency,
                throw=False,
            )

            if not old_salary_info or not new_salary_info:
                continue

            old_hourly = flt(old_salary_info.get("hourly_salary", 0))
            new_hourly = flt(new_salary_info.get("hourly_salary", 0))

            day_before_promotion = add_days(promotion_date, -1)
            working_days_before = count_working_days(alloc_start, day_before_promotion, hours_per_day, holidays, leaves)
            working_days_after = count_working_days(promotion_date, alloc_end, hours_per_day, holidays, leaves)

            cost_before = old_hourly * hours_per_day * working_days_before
            cost_after = new_hourly * hours_per_day * working_days_after

            total_cost = cost_before + cost_after
            hourly_rate = new_hourly

        frappe.db.set_value(
            "Resource Allocation",
            alloc.name,
            {"hourly_cost_rate": hourly_rate, "total_cost": total_cost},
            update_modified=False,
        )

    frappe.db.commit()
