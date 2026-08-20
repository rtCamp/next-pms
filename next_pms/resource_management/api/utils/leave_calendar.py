# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import datetime
from collections.abc import Iterable

import frappe
from frappe.utils import DATE_FORMAT, flt, getdate, strip_html_tags

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import get_employee_leaves
from next_pms.timesheet.api.utils import resolve_holiday_lists


def get_leave_calendars(employees: Iterable[dict], start_date, end_date) -> tuple[dict, dict]:
    """Return the leaves and holidays of a whole page of employees in three queries.

    Batched on every axis that would otherwise scale with the employee count: one leave
    query for all employees, one assignment query to resolve their holiday lists (hrms
    overrides `get_holiday_list_for_employee` to read Holiday List Assignment, uncached,
    once per employee), and one Holiday query covering every list involved.

    Args:
        employees: Employee rows carrying at least `name` and `company`; `company` is what
            lets an employee fall back to their company's holiday list.
        start_date: Range start, inclusive.
        end_date: Range end, inclusive.

    Returns:
        tuple[dict, dict]: leaves and holidays, each keyed by employee id and shaped the way
        :func:`is_on_leave` expects them.
    """
    employee_meta = {employee["name"]: employee for employee in employees}
    if not employee_meta:
        return {}, {}

    leaves_map = {}
    for leave in get_employee_leaves(
        employee=tuple(employee_meta),
        start_date=str(getdate(start_date)),
        end_date=str(getdate(end_date)),
    ):
        leaves_map.setdefault(leave.employee, []).append(leave)

    holiday_list_by_employee = resolve_holiday_lists(employee_meta, list(employee_meta))
    holiday_lists = {holiday_list for holiday_list in holiday_list_by_employee.values() if holiday_list}

    holidays_by_list = {}
    if holiday_lists:
        for holiday in frappe.get_all(
            "Holiday",
            filters={
                "parent": ["in", list(holiday_lists)],
                "holiday_date": ["between", (getdate(start_date), getdate(end_date))],
            },
            fields=["parent", "holiday_date", "weekly_off", "description"],
        ):
            holidays_by_list.setdefault(holiday.parent, []).append(holiday)

    holidays_map = {
        employee: holidays_by_list.get(holiday_list_by_employee.get(employee), []) for employee in employee_meta
    }

    return leaves_map, holidays_map


def get_daily_working_hours(employee: dict) -> float:
    """The employee's normal hours for a single day.

    Expects `apply_working_hours_fallback` to have filled the blanks; anything other than a
    "Per Day" schedule is spread over a five-day week, as the team view does.
    """
    working_hours = flt(employee.get("custom_working_hours"))

    if employee.get("custom_work_schedule") == "Per Day":
        return working_hours

    return working_hours / 5


def build_leave_map(employees: Iterable[dict], dates: Iterable[datetime.date], leaves_map: dict, holidays_map: dict):
    """Map each employee to the days they are away, over the dates a view already renders.

    Sparse by design: an employee with nothing booked off in the window is absent from the
    result, as is every date they are fully available, so the payload carries no filler for
    the common case.

    `total_leave_hours` is the part of a normal day the employee is away — a full day off for
    leave or a holiday, half of one for a half-day leave.
    """
    leave_map = {}

    for employee in employees:
        leaves = leaves_map.get(employee["name"], [])
        holidays = holidays_map.get(employee["name"], [])

        if not leaves and not holidays:
            continue

        daily_working_hours = get_daily_working_hours(employee)
        holiday_names_by_date = {
            holiday.holiday_date: strip_html_tags(holiday.description or "").strip() for holiday in holidays
        }
        dates_off = {}

        for date in dates:
            leave_object = is_on_leave(date, daily_working_hours, leaves, holidays)

            if not leave_object.get("on_leave"):
                continue

            is_holiday = date in holiday_names_by_date
            holiday_name = holiday_names_by_date.get(date)
            dates_off[date.strftime(DATE_FORMAT)] = {
                "is_on_leave": True,
                "is_holiday": is_holiday,
                "total_leave_hours": flt(daily_working_hours - leave_object.get("leave_work_hours"), 2),
                **({"holiday_name": holiday_name} if holiday_name else {}),
            }

        if dates_off:
            leave_map[employee["name"]] = dates_off

    return leave_map
