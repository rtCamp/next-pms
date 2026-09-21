# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, getdate, today
from frappe.utils.background_jobs import is_job_enqueued

from next_pms.resource_management.api.project import (
    _get_employees_resrouce_data_for_given_project,
    _get_resource_management_project_view_data,
)
from next_pms.resource_management.api.team import _get_resource_management_team_view_data
from next_pms.resource_management.api.utils import leave_sync
from next_pms.resource_management.api.utils.helpers import allocation_hours_for_date, override_hours_by_date
from next_pms.resource_management.api.utils.query import attach_extra_entries


class ResourceAllocation(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.resource_management.doctype.resource_allocation_extra_entry.resource_allocation_extra_entry import (
            ResourceAllocationExtraEntry,
        )

        allocation_end_date: DF.Date
        allocation_start_date: DF.Date
        currency: DF.Link | None
        customer: DF.Link
        employee: DF.Link
        employee_name: DF.Data | None
        hourly_cost_rate: DF.Currency
        hours_allocated_per_day: DF.Float
        include_holidays: DF.Check
        include_weekends: DF.Check
        is_billable: DF.Check
        naming_series: DF.Literal["RA-.{employee}.-.YYYY.-.####."]
        note: DF.Text | None
        override: DF.Table[ResourceAllocationExtraEntry]
        project: DF.Link | None
        project_name: DF.Data | None
        recurrence_id: DF.Data | None
        status: DF.Literal["Tentative", "Confirmed"]
        total_allocated_hours: DF.Float
        total_cost: DF.Currency
    # end: auto-generated types

    def validate(self):
        if self.allocation_end_date < self.allocation_start_date:
            frappe.throw(frappe._("End date should be greater than or equal to start date"))

        self.set_project_currency()
        self.validate_project_and_customer()
        # Overlap is judged on the days each side actually books, so this document's
        # leave-derived rows have to be in place before the check reads them.
        self.apply_leave_availability()
        self.validate_no_overlap()
        self.calculate_cost()

    def set_project_currency(self):
        if not self.project:
            return

        project_currency = frappe.get_cached_value("Project", self.project, "custom_currency")
        if project_currency:
            self.currency = project_currency

    @staticmethod
    def booked_dates(allocation: dict, start, end) -> set:
        """The dates in [start, end] on which an allocation books more than zero hours.

        The override table already carries every reduction -- a holiday or a full day of leave
        is a cancelled row, a half day a reduced one, a manual entry whatever the manager typed,
        and `include_holidays` simply leaves no row at all -- so reading it alongside the weekday
        rule covers every way a day can end up unbooked.
        """
        override_hours = override_hours_by_date(allocation)

        return {
            day
            for day in leave_sync.allocation_dates(start, end, allocation.get("include_weekends"))
            if allocation_hours_for_date(allocation, day, override_hours) > 0
        }

    def books_a_day_shared_with(self, other) -> bool:
        """Whether this allocation and `other` both book at least one of the days their ranges share.

        Overlapping on the calendar is not the same as competing for a day: a weekends-off
        allocation can span a weekend without booking any of it, and two allocations can meet
        on nothing but a public holiday that neither books.
        """
        start = max(getdate(self.allocation_start_date), getdate(other.allocation_start_date))
        end = min(getdate(self.allocation_end_date), getdate(other.allocation_end_date))
        if start > end:
            return False

        mine = self.booked_dates(
            {
                "hours_allocated_per_day": self.hours_allocated_per_day,
                "include_weekends": self.include_weekends,
                "override": [
                    {"date": row.date, "hours": row.hours, "cancelled": row.cancelled} for row in self.override
                ],
            },
            start,
            end,
        )

        return bool(mine) and bool(mine & self.booked_dates(other, start, end))

    def validate_no_overlap(self):
        """Block a second allocation for the same employee + project that books a day this one books."""
        if not self.project:
            return

        filters = [
            ["employee", "=", self.employee],
            ["project", "=", self.project],
            # overlap: existing.start <= new.end AND existing.end >= new.start
            ["allocation_start_date", "<=", self.allocation_end_date],
            ["allocation_end_date", ">=", self.allocation_start_date],
            ["name", "!=", self.name or ""],
        ]

        candidates = frappe.get_all(
            "Resource Allocation",
            filters=filters,
            fields=[
                "name",
                "allocation_start_date",
                "allocation_end_date",
                "total_allocated_hours",
                "hours_allocated_per_day",
                "include_weekends",
            ],
        )
        attach_extra_entries(candidates)

        existing = next((row for row in candidates if self.books_a_day_shared_with(row)), None)
        if not existing:
            return

        # An allocation fully consumed by leave, holidays or day overrides books no hours and
        # renders as an inert placeholder, so "already allocated" reads as a contradiction.
        # Name the real situation and the action that resolves it.
        if not flt(existing.total_allocated_hours):
            message = frappe._(
                "{0} already has an allocation on {1} between {2} and {3} that currently books "
                "no hours. Edit or delete that allocation instead of creating a new one."
            )
        else:
            message = frappe._(
                "{0} is already allocated to {1} between {2} and {3}. "
                "Overlapping allocations for the same project are not allowed."
            )

        frappe.throw(
            message.format(
                self.employee_name or self.employee,
                self.project_name or self.project,
                frappe.format(existing.allocation_start_date, {"fieldtype": "Date"}),
                frappe.format(existing.allocation_end_date, {"fieldtype": "Date"}),
            ),
            title=frappe._("Overlapping Allocation"),
            exc=frappe.ValidationError,
        )

    def validate_project_and_customer(self):
        """Reject allocations pointed at a cancelled/inactive project or a disabled customer.

        Only fires when the project/customer is newly set or changed, so an allocation
        created while its project was valid stays editable if the project is later cancelled.
        """
        if self.project and (self.is_new() or self.has_value_changed("project")):
            status, is_active = frappe.db.get_value("Project", self.project, ["status", "is_active"])
            if status == "Cancelled":
                frappe.throw(frappe._("Cannot allocate to cancelled project {0}.").format(self.project))
            if is_active == "No":
                frappe.throw(frappe._("Cannot allocate to inactive project {0}.").format(self.project))

        # Customer is fetched from project.customer, so a project change can swap in a
        # different (possibly disabled) customer without customer itself registering a
        # change when both projects share the same customer. Re-check on project change too.
        if self.customer and (self.is_new() or self.has_value_changed("customer") or self.has_value_changed("project")):
            if frappe.db.get_value("Customer", self.customer, "disabled"):
                frappe.throw(frappe._("Cannot allocate to disabled customer {0}.").format(self.customer))

    def apply_leave_availability(self):
        """Drop leave and holiday days from this allocation, and keep its total in step.

        Lives in `validate` so every write path — the allocation APIs, the desk form, and the
        resync triggered when a Leave Application changes — reduces the same way.
        """
        leave_sync.sync_leave_overrides(self)
        self.total_allocated_hours = leave_sync.effective_total_hours(self)

    def calculate_cost(self):
        """Calculate hourly_cost_rate and total_cost based on employee CTC."""
        from next_pms.utils.employee import get_employee_salary

        if not self.currency:
            return

        try:
            salary_info = get_employee_salary(
                employee=self.employee,
                to_currency=self.currency,
                date=today(),
                throw=False,
            )
            if salary_info:
                self.hourly_cost_rate = flt(salary_info.get("hourly_salary", 0))
            else:
                self.hourly_cost_rate = 0
        except Exception as e:
            frappe.log_error(
                message=f"Failed to calculate hourly cost rate for employee {self.employee}: {e!s}",
                title="Resource Allocation Cost Calculation",
            )
            self.hourly_cost_rate = 0

        self.total_cost = flt(self.hourly_cost_rate) * flt(self.total_allocated_hours)

    def on_update(self):
        # Clear all type of allocation related chache if something is changed in allocation
        clear_cache()

    def on_trash(self):
        # Clear all type of allocation related chache if something is deleted in allocation
        clear_cache()


def clear_cache(doc=None, method=None):
    def clear_cache_job():
        _get_resource_management_team_view_data.clear_cache()
        _get_resource_management_project_view_data.clear_cache()
        _get_employees_resrouce_data_for_given_project.clear_cache()

    job_name = "resource_allocation_clear_cache"

    if not is_job_enqueued(job_name):
        frappe.enqueue(
            clear_cache_job,
            job_id=job_name,
            job_name=job_name,
            queue="default",
            now=True,
        )
