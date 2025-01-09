# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document
from frappe.utils.background_jobs import is_job_enqueued

from next_pms.resource_management.api.project import (
    get_employees_resrouce_data_for_given_project,
    get_resource_management_project_view_data,
)
from next_pms.resource_management.api.team import get_resource_management_team_view_data


class ResourceAllocation(Document):
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
            job_name=job_name,
            queue="default",
            is_async=False,
        )
