import frappe

from .utils import get_count


@frappe.whitelist()
def get_task_list(
    search: str = None,
    page_length: int = 20,
    start: int = 0,
    projects=None,
):
    import json

    from frappe.query_builder import Case, DocType
    from frappe.query_builder import functions as fn
    from pypika import Order

    search_filter = {}
    if isinstance(projects, str):
        projects = json.loads(projects)

    fields = [
        "name",
        "subject",
        "status",
        "priority",
        "description",
        "actual_time",
        "expected_time",
        "_liked_by",
    ]

    if projects:
        filter = {"project": ["in", projects]}
    else:
        projects = frappe.get_list("Project", pluck="name")
        filter = {"project": ["in", projects]}

    if search:
        search_filter.update(
            {
                "name": ["like", f"%{search}%"],
                "subject": ["like", f"%{search}%"],
            }
        )

    doctype = DocType("Task")
    doctype_project = DocType("Project")
    tasks = (
        frappe.qb.from_(doctype)
        .join(doctype_project)
        .on(doctype.project == doctype_project.name)
        .select(
            *fields,
            doctype_project.project_name,
            doctype.custom_is_billable.as_("is_billable"),
            doctype.exp_end_date.as_("due_date"),
        )
        .where(doctype.project.isin(projects))
    )
    if search:
        tasks = tasks.where(
            doctype.name.like(f"%{search}%") | doctype.subject.like(f"%{search}%")
        )

    tasks = (
        tasks.limit(page_length)
        .offset(start)
        .orderby(
            Case()
            .when(
                fn.Function("INSTR", doctype._liked_by, f'"{frappe.session.user}"') > 0,
                1,
            )
            .else_(0),
            order=Order.desc,
        )
    ).run(as_dict=True)

    count = get_count(
        doctype="Task",
        filters=filter,
        or_filters=search_filter,
        ignore_permissions=True,
    )

    return {"task": tasks, "total_count": count}


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

    for project in projects:
        data = get_task_list(projects=[project["name"]], search=task_search)
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
