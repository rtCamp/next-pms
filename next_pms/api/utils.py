from datetime import datetime, timedelta
from functools import wraps
from typing import Any

import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from erpnext.setup.utils import get_exchange_rate
from frappe import log_error
from frappe.utils import flt, getdate


def transform_google_events(events: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Transform Google Calendar API events to the desired Event structure.

    Args:
        events (dict): Google Calendar API events response

    Returns:
        List[Dict[str, Any]]: Transformed events in the new Event structure
    """
    transformed_events = []

    for event in events.get("items", []):
        start = event.get("start", {})
        end = event.get("end", {})

        starts_on = datetime.fromisoformat(start.get("dateTime", start.get("date"))) if start else None
        ends_on = datetime.fromisoformat(end.get("dateTime", end.get("date"))) if end else None

        if starts_on and isinstance(starts_on, datetime):
            if starts_on.hour == 0 and starts_on.minute == 0:
                starts_on = starts_on.date()

        if ends_on and isinstance(ends_on, datetime):
            if ends_on.hour == 0 and ends_on.minute == 0:
                ends_on = ends_on.date()

        # Determine if it's an all-day event
        all_day = 0
        if starts_on and ends_on:
            start_date = starts_on.date() if isinstance(starts_on, datetime) else starts_on
            end_date = ends_on.date() if isinstance(ends_on, datetime) else ends_on

            # Check if the difference between start and end is exactly 24 hours
            # or if the end date is one day after the start date
            if (
                isinstance(starts_on, datetime)
                and isinstance(ends_on, datetime)
                and (ends_on - starts_on == timedelta(days=1))
            ) or (end_date - start_date == timedelta(days=1)):
                all_day = 1

        transformed_event = {
            "id": event.get("id", ""),
            "subject": event.get("summary", ""),
            "starts_on": starts_on,
            "ends_on": ends_on,
            "selected": False,
            "description": event.get("description", ""),
            "color": event.get("colorId"),
            "owner": event.get("creator", {}).get("email"),
            "all_day": all_day,
            "event_type": event.get("eventType"),
            "repeat_this_event": 1 if "recurringEventId" in event else 0,
            "repeat_on": None,
            "repeat_till": None,
        }

        transformed_events.append(transformed_event)

    return transformed_events


def error_logger(func):
    @wraps(func)
    def innerfn(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception:
            log_error(title=f"Error[Next PMS] in {func.__name__}")
            raise

    return innerfn


def get_employee_allocated_hours_for_date(allocations: list, date) -> float:
    """Sum allocation hours for one employee on a single date.

    Iterates the employee's allocations that overlap the given date. For each
    allocation, skips it when the date is outside the allocation range or when a
    per-day override marks that date as cancelled. Uses override hours when set,
    otherwise hours_allocated_per_day.

    Args:
        allocations: Resource Allocation dicts for one employee, each
            optionally containing an override list from attach_extra_entries.
        date: The calendar date to evaluate.

    Returns:
        Total allocated hours across all matching allocations for the date.
    """
    allocated_hours = 0.0
    for allocation in allocations:
        if not (allocation.allocation_start_date <= date <= allocation.allocation_end_date):
            continue

        override = None
        for row in allocation.get("override", []):
            if getdate(row.date) == date:
                override = row
                break

        if override and override.cancelled:
            continue

        allocated_hours += (
            flt(override.hours) if override and override.hours is not None else flt(allocation.hours_allocated_per_day)
        )

    return allocated_hours


def get_working_dates_for_range(start_date, end_date, allow_weekend_entries: int) -> set:
    working_dates = set()
    date = getdate(start_date)
    end = getdate(end_date)
    while date <= end:
        if allow_weekend_entries or date.weekday() < 5:
            working_dates.add(date)
        date += timedelta(days=1)
    return working_dates


def is_full_day_leave(date, leaves: list) -> bool:
    for leave in leaves:
        if not (leave.from_date <= date <= leave.to_date):
            continue
        if leave.half_day:
            continue
        return True
    return False


def is_holiday(date, holidays: list) -> bool:
    for holiday in holidays:
        if holiday.holiday_date == date:
            return True
    return False


def sum_to_usd(rows: list, cur_key: str, prev_key: str) -> tuple[float, float]:
    """Convert per-currency query rows to a single USD total for each period.

    Parameters
    ----------
    rows : list of dict
            Query result rows, each with currency, transaction_date, cur_key, prev_key fields.
    cur_key : str
            Field name for the current period amount.
    prev_key : str
            Field name for the previous period amount.

    Returns
    -------
    tuple[float, float]
            (current_usd, previous_usd)
    """
    current = 0.0
    previous = 0.0
    for row in rows:
        rate = 1.0
        if row.currency != "USD":
            rate = get_exchange_rate(row.currency, "USD", row.transaction_date) or 1
        current += flt(row[cur_key]) * rate
        previous += flt(row[prev_key]) * rate
    return current, previous


def get_holidays_by_employee(employee_names: list, start_date, end_date) -> dict:
    """Map each employee to the set of their holiday dates within the window.

    Resolves each employee's holiday list once, then fetches holidays per unique
    list to avoid a query per employee.

    Args:
        employee_names: Employee doctype names to resolve holidays for.
        start_date: Inclusive window start.
        end_date: Inclusive window end.

    Returns:
        A dict of employee name to a set of holiday dates. Employees without a
        holiday list map to an empty set.
    """
    holiday_list_by_employee = {}
    for employee_name in employee_names:
        holiday_list_by_employee[employee_name] = get_holiday_list_for_employee(
            employee_name,
            raise_exception=False,
            as_on=start_date,
        )

    unique_holiday_lists = {holiday_list for holiday_list in holiday_list_by_employee.values() if holiday_list}
    dates_by_list = {}
    for holiday_list in unique_holiday_lists:
        holidays = frappe.get_all(
            "Holiday",
            filters={"parent": holiday_list, "holiday_date": ["between", (start_date, end_date)]},
            fields=["holiday_date"],
        )
        holiday_dates = set()
        for holiday in holidays:
            holiday_dates.add(holiday.holiday_date)
        dates_by_list[holiday_list] = holiday_dates

    return {
        employee_name: dates_by_list.get(holiday_list_by_employee.get(employee_name), set())
        for employee_name in employee_names
    }
