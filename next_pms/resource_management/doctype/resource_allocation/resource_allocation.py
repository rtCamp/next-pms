# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, today
from frappe.utils.background_jobs import is_job_enqueued

from next_pms.resource_management.api.project import (
    get_employees_resrouce_data_for_given_project,
    get_resource_management_project_view_data,
)
from next_pms.resource_management.api.team import get_resource_management_team_view_data


class ResourceAllocation(Document):
    def validate(self):
        if self.allocation_end_date < self.allocation_start_date:
            frappe.throw(frappe._("End date should be greater than or equal to start date"))

        self.calculate_cost()

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
        get_resource_management_team_view_data.clear_cache()
        get_resource_management_project_view_data.clear_cache()
        get_employees_resrouce_data_for_given_project.clear_cache()

    job_name = "resource_allocation_clear_cache"

    if not is_job_enqueued(job_name):
        frappe.enqueue(
            clear_cache_job,
            job_id=job_name,
            job_name=job_name,
            queue="default",
            is_async=False,
        )
