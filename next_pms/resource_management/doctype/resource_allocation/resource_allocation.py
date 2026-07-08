# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, today
from frappe.utils.background_jobs import is_job_enqueued

from next_pms.resource_management.api.project import (
    _get_employees_resrouce_data_for_given_project,
    _get_resource_management_project_view_data,
)
from next_pms.resource_management.api.team import _get_resource_management_team_view_data


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

        self.validate_no_overlap()
        self.validate_project_and_customer()
        self.calculate_cost()

    def validate_no_overlap(self):
        """Block a second allocation for the same employee + project whose date range
        overlaps an existing one (partial or exact overlap)."""
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

        existing = frappe.db.get_value(
            "Resource Allocation",
            filters,
            ["name", "allocation_start_date", "allocation_end_date"],
            as_dict=True,
        )
        if existing:
            frappe.throw(
                frappe._(
                    "{0} is already allocated to {1} between {2} and {3}. "
                    "Overlapping allocations for the same project are not allowed."
                ).format(
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
