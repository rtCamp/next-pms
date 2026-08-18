import frappe

from next_pms.api.utils import error_logger

COSTING_QUEUE = "pms_costings_queue"
COSTING_QUEUE_FALLBACK = "long"

JOB_ID_PREFIX = "next_pms_timesheet_task_project_costing"


def enqueue_update_task_and_project(timesheet: str, tasks: list, projects: list) -> None:
    """Queue the costing recalculation for the given tasks/projects.

    The caller passes the task/project names captured from the in-memory Timesheet, not the
    timesheet itself: `enqueue_after_commit` means this can run after a delete is committed,
    by which point the Timesheet row (and possibly the Timesheet itself) is already gone, so
    there is nothing left in the DB to re-derive the names from at job time.
    """
    if not tasks and not projects:
        return

    job_name = f"{JOB_ID_PREFIX}::{timesheet}"

    frappe.enqueue(
        update_task_and_project,
        queue=get_costing_queue(),
        job_id=job_name,
        job_name=job_name,
        enqueue_after_commit=True,
        deduplicate=True,
        tasks=tasks,
        projects=projects,
    )


@error_logger
def update_task_and_project(tasks: list, projects: list) -> None:
    """Recalculate costings for the given tasks/projects.

    Names come from the caller, captured off the in-memory Timesheet at enqueue time -
    this runs after commit, so the row itself may no longer exist by then.
    """
    tasks = tasks or []
    projects = projects or []
    statuses = {task: get_task_status_from_remaining_logs(task) for task in tasks}

    update_tasks(tasks, statuses)
    update_projects(projects)


def get_affected_tasks_and_projects(time_logs) -> tuple[list, list]:
    """Task and project names referenced by `time_logs`, de-duplicated, first-seen order kept."""
    tasks, projects = [], []

    for data in time_logs:
        if data.task and data.task not in tasks:
            tasks.append(data.task)

        if data.project and data.project not in projects:
            projects.append(data.project)

    return tasks, projects


def get_task_status_from_remaining_logs(task: str) -> str | None:
    """Status for `task` derived from the time logs that still exist, or None to leave it alone.

    For the delete path, where the deleted timesheet's own `completed` checkboxes are gone:
    the remaining logs decide, which is what a live save of any of them would have set. Drafts
    count alongside submitted rows, matching the docstatus range TaskOverride's
    `update_time_and_costing` sums over. With no logs left there is nothing to derive a status
    from, so the task keeps whatever status it has.
    """
    completed_flags = frappe.get_all(
        "Timesheet Detail",
        filters={"task": task, "docstatus": ["!=", 2]},
        pluck="completed",
    )

    if not completed_flags:
        return None

    return "Completed" if all(completed_flags) else "Working"


def update_tasks(tasks: list, statuses: dict) -> None:
    """Resave each task so its time/costing totals are re-derived, applying any given status.

    Tasks that no longer exist are skipped: a deletion can reach here after the task itself
    was removed (deleting a project cascades to its tasks and timesheets).
    """
    for task in tasks:
        if not frappe.db.exists("Task", task):
            continue

        task_doc = frappe.get_doc("Task", task)
        task_doc.update_time_and_costing()

        status = statuses.get(task)
        if status:
            task_doc.status = status

        task_doc.save(ignore_permissions=True)


def update_projects(projects: list) -> None:
    """Resave each project so its costing rollup is re-derived, skipping deleted ones."""
    for project in projects:
        project_doc = frappe.get_doc("Project", project)
        project_doc.update_project()
        project_doc.save(ignore_permissions=True)


def get_costing_queue() -> str:
    from frappe.utils.background_jobs import get_queue_list

    if COSTING_QUEUE in get_queue_list():
        return COSTING_QUEUE

    return COSTING_QUEUE_FALLBACK
