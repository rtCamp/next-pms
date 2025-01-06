from frappe import enqueue, get_all, get_doc


def execute():
    enqueue(update_task_and_project_costing, queue="long", job_name="Update task and project costing for timesheet")


def update_task_and_project_costing():
    timesheets = get_all("Timesheet", filters={"docstatus": ["in", [0, 1]]}, pluck="name")

    for timesheet in timesheets:
        doc = get_doc("Timesheet", timesheet)
        doc.update_task_and_project()
