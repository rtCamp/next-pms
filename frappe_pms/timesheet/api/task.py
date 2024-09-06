import frappe

from .utils import get_count


@frappe.whitelist()
def get_task_list(
    search: str = None,
    page_length: int = 20,
    start: int = 0,
    project=None,
    fields: list | str | None = None,
):
    import json

    if isinstance(project, str):
        project = json.loads(project)
    if fields is None:
        fields = [
            "name",
            "subject",
            "status",
            "priority",
            "description",
            "custom_is_billable as is_billable",
            "project.project_name",
            "actual_time",
            "exp_end_date as due_date",
            "expected_time",
            "_liked_by",
        ]
    if isinstance(fields, str):
        fields = json.loads(fields)
    if project:
        filter = {"project": ["in", project]}
    else:
        projects = frappe.get_list("Project", pluck="name")
        filter = {"project": ["in", projects]}

    search_filter = {}
    if search:
        search_filter.update(
            {
                "name": ["like", f"%{search}%"],
                "subject": ["like", f"%{search}%"],
            }
        )

    project_task = frappe.get_all(
        "Task",
        filters=filter,
        or_filters=search_filter,
        fields=fields,
        page_length=page_length,
        start=start,
        order_by="name desc",
    )
    count = get_count(
        doctype="Task",
        filters=filter,
        or_filters=search_filter,
        ignore_permissions=True,
    )

    return {"task": project_task, "total_count": count}


@frappe.whitelist()
def get_task_list_by_project(project=None, task_search=None):
    import json

    filter = {}
    if isinstance(project, str):
        project = json.loads(project)
        filter.update({"name": ["in", project]})

    projects = frappe.get_list(
        "Project", fields=["name", "project_name"], filters=filter
    )
    fields = [
        "name",
        "subject",
        "status",
        "priority",
        "description",
        "custom_is_billable as is_billable",
        "actual_time",
        "exp_end_date as due_date",
        "expected_time",
        "_liked_by",
    ]
    for project in projects:
        data = get_task_list(
            project=[project["name"]], fields=fields, search=task_search
        )
        project["tasks"] = data.get("task")
    count = frappe.db.count("Project", filters=filter)
    return {"projects": projects, "count": count}


@frappe.whitelist()
def add_task(subject: str, expected_time: str, project: str, description: str):
    frappe.get_doc(
        {
            "doctype": "Task",
            "subject": subject,
            "expected_time": expected_time,
            "project": project,
            "description": description,
        }
    ).insert(ignore_permissions=True)
    return frappe._("Task Created Successfully")
