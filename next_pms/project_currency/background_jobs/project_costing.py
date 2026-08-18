import frappe

from next_pms.api.utils import error_logger

COSTING_QUEUE = "pms_costings_queue"
COSTING_QUEUE_FALLBACK = "long"

from frappe.utils.background_jobs import is_job_enqueued


def enqueue_update_task_and_project(timesheet: str) -> None:
    job_name = f"next_pms_timesheet_task_project_costing::{timesheet}"

    if is_job_enqueued(job_name):
        return

    frappe.enqueue(
        update_task_and_project,
        queue=get_costing_queue(),
        job_id=job_name,
        job_name=job_name,
        enqueue_after_commit=True,
        timesheet=timesheet,
    )


@error_logger
def update_task_and_project(timesheet: str) -> None:
    if not frappe.db.exists("Timesheet", timesheet):
        return

    time_logs = frappe.get_doc("Timesheet", timesheet).time_logs

    tasks, projects = [], []

    for data in time_logs:
        if data.task and data.task not in tasks:
            task = frappe.get_doc("Task", data.task)
            task.update_time_and_costing()
            time_logs_completed = all(tl.completed for tl in time_logs if tl.task == task.name)

            if time_logs_completed:
                task.status = "Completed"
            else:
                task.status = "Working"
            task.save(ignore_permissions=True)
            tasks.append(data.task)

        if data.project and data.project not in projects:
            projects.append(data.project)

    for project in projects:
        project_doc = frappe.get_doc("Project", project)
        project_doc.update_project()
        project_doc.save(ignore_permissions=True)


def get_costing_queue() -> str:
    from frappe.utils.background_jobs import get_queue_list

    if COSTING_QUEUE in get_queue_list():
        return COSTING_QUEUE

    return COSTING_QUEUE_FALLBACK
