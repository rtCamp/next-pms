import frappe
from frappe.query_builder import Case, DocType
from frappe.query_builder import functions as fn
from frappe.utils import getdate
from pypika import Order

from .utils import get_count


@frappe.whitelist()
def get_task_list(
    search: str = None,
    page_length: int | bool = 20,
    start: int | None = 0,
    projects=None,
    status: list | str = None,
):
    import json

    search_filter = {}
    if isinstance(projects, str):
        projects = json.loads(projects)
    if status and isinstance(status, str):
        status = json.loads(status)

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
        projects = frappe.get_list("Project", pluck="name", filters={"name": ["in", projects]})
    else:
        projects = frappe.get_list("Project", pluck="name")
    if not projects:
        frappe.throw(
            frappe._(
                f"User {frappe.session.user} does not have doctype access via role permission for document Project"
            ),
            frappe.PermissionError,
        )
    filter = {"project": ["in", projects]}

    doctype = DocType("Task")
    doctype_project = DocType("Project")
    tasks = (
        frappe.qb.from_(doctype)
        .join(doctype_project)
        .on(doctype.project == doctype_project.name)
        .select(
            *fields,
            doctype_project.name.as_("project"),
            doctype_project.project_name,
            doctype.custom_is_billable.as_("is_billable"),
            doctype.exp_end_date.as_("due_date"),
        )
        .where(doctype.project.isin(projects))
    )
    if search:
        tasks = tasks.where(doctype.name.like(f"%{search}%") | doctype.subject.like(f"%{search}%"))
        search_filter.update(
            {
                "name": ["like", f"%{search}%"],
                "subject": ["like", f"%{search}%"],
            }
        )
    if status:
        tasks = tasks.where(doctype.status.isin(status))
        filter.update({"status": ["in", status]})
    if page_length:
        tasks = tasks.limit(page_length)
    tasks = (
        tasks.offset(start).orderby(
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


@frappe.whitelist()
def get_task(task: str):
    from frappe.query_builder.functions import Sum

    project = frappe.db.get_value("Task", task, "project")
    if project and not frappe.has_permission(doctype="Project", doc=project):
        frappe.throw(
            frappe._(
                f"User {frappe.session.user} does not have doctype access via role permission for document Project"
            ),
            frappe.PermissionError,
        )

    task = frappe.get_doc("Task", task)
    timesheet = DocType("Timesheet")
    timesheet_detail = DocType("Timesheet Detail")
    result = (
        frappe.qb.from_(timesheet)
        .join(timesheet_detail)
        .on(timesheet.name == timesheet_detail.parent)
        .select(Sum(timesheet_detail.hours).as_("total_hour"), timesheet.employee)
        .where(timesheet_detail.task == task.name)
        .groupby(timesheet.employee)
    ).run(as_dict=True)

    for res in result:
        employee_name, image = frappe.db.get_value("Employee", res.employee, ["employee_name", "image"])
        res["employee_name"] = employee_name
        res["image"] = image

    return {
        "subject": task.subject,
        "expected_time": task.expected_time,
        "project_name": frappe.db.get_value("Project", task.project, "project_name"),
        "project": task.project,
        "actual_time": task.actual_time,
        "status": task.status,
        "worked_by": result,
        "name": task.name,
    }


@frappe.whitelist()
def get_task_log(task: str, start_date: str = None, end_date: str = None):
    project = frappe.db.get_value("Task", task, "project")

    if project and not frappe.has_permission(doctype="Project", doc=project):
        frappe.throw(
            frappe._(
                f"User {frappe.session.user} does not have doctype access via role permission for document Project"
            ),
            frappe.PermissionError,
        )
    timesheet = DocType("Timesheet")
    timesheet_detail = DocType("Timesheet Detail")
    start_date = getdate(start_date)
    end_date = getdate(end_date)
    query = (
        frappe.qb.from_(timesheet)
        .join(timesheet_detail)
        .on(timesheet.name == timesheet_detail.parent)
        .select(
            timesheet_detail.hours,
            timesheet.employee,
            timesheet_detail.description,
            timesheet.start_date,
        )
        .where(
            (timesheet_detail.task == task)
            & (timesheet.start_date >= str(start_date))
            & (timesheet.start_date <= str(end_date))
        )
    )

    result = query.run(as_dict=True)

    aggregated_data = {}

    for res in result:
        employee_name = res.get("employee")
        start_date = res.get("start_date")
        hours = res.get("hours")
        description = res.get("description")

        key = start_date

        if key not in aggregated_data:
            aggregated_data[key] = {}

        if employee_name not in aggregated_data[key]:
            aggregated_data[key][employee_name] = {"hours": 0, "description": []}

        aggregated_data[key][employee_name]["hours"] += hours
        aggregated_data[key][employee_name]["description"].append(description)

    response = {
        str(key): [
            {
                "employee": emp,
                "hours": data["hours"],
                "description": data["description"],
            }
            for emp, data in value.items()
        ]
        for key, value in aggregated_data.items()
    }
    return response
