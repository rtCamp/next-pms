# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.utils.background_jobs import is_job_enqueued

from next_pms.next_projects.api.project import clear_project_tracking_cache


def clear_cache(doc=None, method=None):
    if not doc:
        return

    project = doc.name

    def clear_cache_job(project=project):
        clear_project_tracking_cache(project)

    job_name = f"project_tracking_clear_cache::{project}"

    if not is_job_enqueued(job_name):
        frappe.enqueue(
            clear_cache_job,
            job_id=job_name,
            job_name=job_name,
            queue="default",
            is_async=False,
        )
