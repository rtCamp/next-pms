import frappe

from next_pms.api.utils import error_logger

COSTING_QUEUE = "pms_costings_queue"
COSTING_QUEUE_FALLBACK = "long"


def enqueue_update_task_and_project(tasks: list[str], projects: list[str]) -> None:
    """Queue the costing recalculation for the given tasks/projects."""
    if not tasks and not projects:
        return

    frappe.enqueue(
        update_task_and_project,
        queue=get_costing_queue(),
        enqueue_after_commit=True,
        tasks=tasks,
        projects=projects,
    )


@error_logger
def update_task_and_project(tasks: list[str], projects: list[str]) -> None:
    """Recalculate costings for the given tasks/projects.

    Names come from the caller, captured off the in-memory Timesheet at enqueue time -
    this runs after commit, so the row itself may no longer exist by then.
    """
    tasks = tasks or []
    projects = projects or []
    statuses = {task: get_task_status_from_remaining_logs(task) for task in tasks}

    update_tasks(tasks, statuses)
    update_projects(projects)


def get_affected_tasks_and_projects(time_logs: list) -> tuple[list[str], list[str]]:
    """Task and project names referenced by time_logs, de-duplicated, first-seen order kept."""
    tasks, projects = [], []

    for data in time_logs:
        if data.task and data.task not in tasks:
            tasks.append(data.task)

        if data.project and data.project not in projects:
            projects.append(data.project)

    return tasks, projects


def get_task_status_from_remaining_logs(task: str) -> str | None:
    """Status for task derived from the time logs that still exist, or None to leave it alone."""
    completed_flags = frappe.get_all(
        "Timesheet Detail",
        filters={"task": task, "docstatus": ["!=", 2]},
        pluck="completed",
    )

    if not completed_flags:
        return None

    return "Completed" if all(completed_flags) else "Working"


def update_tasks(tasks: list[str], statuses: dict[str, str | None]) -> None:
    """Resave each task so its time/costing totals are re-derived, applying any given status.

    Tasks that no longer exist are skipped: a deletion can reach here after the task itself
    was removed (deleting a project cascades to its tasks and timesheets).
    """
    for task in tasks:
        if not frappe.db.exists("Task", task):
            continue

        task_doc = frappe.get_doc("Task", task)

        status = statuses.get(task)
        if status:
            task_doc.status = status

        task_doc.save(ignore_permissions=True)


def update_projects(projects: list[str]) -> None:
    """Resave each project so its costing rollup is re-derived, skipping deleted ones."""
    for project in projects:
        if not frappe.db.exists("Project", project):
            continue

        project_doc = frappe.get_doc("Project", project)
        project_doc.update_project()
        project_doc.save(ignore_permissions=True)


def get_costing_queue() -> str:
    from frappe.utils.background_jobs import get_queue_list

    if COSTING_QUEUE in get_queue_list():
        return COSTING_QUEUE

    return COSTING_QUEUE_FALLBACK
