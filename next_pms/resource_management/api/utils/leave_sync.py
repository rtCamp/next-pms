# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import datetime
from collections.abc import Iterator

import frappe
from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee
from frappe.utils import add_days, cint, flt, getdate

from next_pms.resource_management.api.utils.helpers import is_on_leave
from next_pms.resource_management.api.utils.query import get_employee_leaves

LEAVE_SOURCE = "Leave"
MANUAL_SOURCE = "Manual"


def availability_factor(date: datetime.date, leaves: list[dict], holidays: list) -> float:
    """Return the fraction of a normal day the employee is available to work on `date`."""
    return flt(is_on_leave(date, 1.0, leaves, holidays)["leave_work_hours"])


def effective_hours(base_hours: float, date: datetime.date, leaves: list[dict], holidays: list) -> float:
    """Scale an allocation's per-day hours by how much of `date` the employee is available."""
    return flt(base_hours) * availability_factor(date, leaves, holidays)


def get_leave_calendar(employee: str, start_date, end_date, include_weekends=False) -> tuple[list[dict], list]:
    """Return the leave applications and holidays that shape an employee's availability.

    Weekly-off rows are dropped when the allocation includes weekends: a holiday list marks
    every Saturday and Sunday as a weekly off, so keeping them would cancel exactly the days
    the allocation opted into. Weekends are excluded by date iteration instead — leaving real
    public holidays as the only holidays that reduce an allocation.
    """
    leaves = get_employee_leaves(
        employee=employee,
        start_date=str(getdate(start_date)),
        end_date=str(getdate(end_date)),
    )

    holiday_list = get_holiday_list_for_employee(employee, raise_exception=False)
    if not holiday_list:
        return leaves, []

    holiday_filters = {
        "parent": holiday_list,
        "holiday_date": ["between", (getdate(start_date), getdate(end_date))],
    }
    if cint(include_weekends):
        holiday_filters["weekly_off"] = 0

    holidays = frappe.get_all("Holiday", filters=holiday_filters, fields=["holiday_date"])

    return leaves, holidays


def allocation_dates(start_date, end_date, include_weekends) -> Iterator[datetime.date]:
    """Yield every date an allocation actually books, honouring its weekend setting."""
    current, end = getdate(start_date), getdate(end_date)
    while current <= end:
        if cint(include_weekends) or current.weekday() < 5:
            yield current
        current = add_days(current, 1)


def override_signature(doc) -> tuple:
    """A comparable snapshot of the override table, used to skip no-op saves."""
    return tuple(
        sorted(
            (str(getdate(row.date)), flt(row.hours), cint(row.cancelled), row.source or MANUAL_SOURCE)
            for row in doc.override
        )
    )


def sync_leave_overrides(doc, leaves: list[dict] | None = None, holidays: list | None = None) -> None:
    """Rewrite the leave-derived rows of an allocation's override table in place.

    Days on which the employee is fully unavailable (full-day leave or a public holiday) are
    cancelled; half days are halved. Leave owns every day it touches: a manual row on a leave
    date is replaced, so hours are never booked against leave. Manual rows on every other date
    are left untouched, and rows this function previously wrote are dropped once the leave that
    caused them is cancelled or moved — which is what returns those days to their base hours.

    Idempotent: syncing an already-synced doc leaves the table unchanged.
    """
    if not (doc.employee and doc.allocation_start_date and doc.allocation_end_date):
        return

    if leaves is None or holidays is None:
        leaves, holidays = get_leave_calendar(
            doc.employee,
            doc.allocation_start_date,
            doc.allocation_end_date,
            doc.include_weekends,
        )

    base_hours = flt(doc.hours_allocated_per_day)
    reduced_days = {}
    for date in allocation_dates(doc.allocation_start_date, doc.allocation_end_date, doc.include_weekends):
        factor = availability_factor(date, leaves, holidays)
        if factor < 1:
            reduced_days[date] = base_hours * factor

    retained_rows, synced_dates = [], set()

    for row in doc.override:
        row_date = getdate(row.date)
        is_leave_row = row.source == LEAVE_SOURCE

        if row_date in reduced_days:
            if not is_leave_row:
                continue
            _apply_leave_hours(row, reduced_days[row_date])
            synced_dates.add(row_date)
        elif is_leave_row:
            continue

        retained_rows.append(row)

    doc.override = retained_rows

    for date, hours in sorted(reduced_days.items()):
        if date in synced_dates:
            continue
        row = doc.append("override", {"date": date, "source": LEAVE_SOURCE})
        _apply_leave_hours(row, hours)


def _apply_leave_hours(row, hours: float) -> None:
    """Set a leave row to `hours`, cancelling the day outright when nothing remains."""
    row.hours = flt(hours)
    row.cancelled = 0 if flt(hours) else 1


def effective_total_hours(doc) -> float:
    """Total hours an allocation books once day overrides are applied."""
    override_hours = {getdate(row.date): (0.0 if cint(row.cancelled) else flt(row.hours)) for row in doc.override}
    base_hours = flt(doc.hours_allocated_per_day)

    return flt(
        sum(
            override_hours.get(date, base_hours)
            for date in allocation_dates(doc.allocation_start_date, doc.allocation_end_date, doc.include_weekends)
        ),
        2,
    )
