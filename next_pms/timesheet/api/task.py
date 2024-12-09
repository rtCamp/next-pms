import datetime

import frappe
from frappe.query_builder import Case, DocType
from frappe.query_builder import functions as fn
from frappe.utils import getdate
from pypika import Criterion, Order

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

    frappe.has_permission(doctype="Project", throw=True)
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

    #  Limit the task fetched based on the projects the user has access to.
    if projects:
        projects = frappe.get_list("Project", pluck="name", filters={"name": ["in", projects]})
    else:
        projects = frappe.get_list("Project", pluck="name")

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
        meta = frappe.get_meta("Task")
        condition = []
        condition.append(doctype.name.like(f"%{search}%"))
        condition.append(doctype.subject.like(f"%{search}%"))

        #  Check if the Task DocType has custom_github_issue_link field
        if meta.has_field("custom_github_issue_link"):
            condition.append(doctype.custom_github_issue_link.like(f"%{search}%"))
            search_filter.update({"custom_github_issue_link": ["like", f"%{search}%"]})

        tasks = tasks.where(Criterion.any(condition))
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

    #  We need to order the tasks based on the user's liked tasks.
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
def get_task(task: str, start_date: str | datetime.date, end_date: str | datetime.date):
    from frappe.query_builder.functions import Sum

    if isinstance(start_date, str):
        start_date = getdate(start_date)
    if isinstance(end_date, str):
        end_date = getdate(end_date)
    project = frappe.db.get_value("Task", task, "project")

    # Since all the task are supposed to be under a project, we need to check if the user has access to the project
    # if task has project field set.
    if project:
        frappe.has_permission(doctype="Project", doc=project, throw=True)

    gh_link = ""
    task = frappe.get_doc("Task", task)
    timesheet = DocType("Timesheet")
    timesheet_detail = DocType("Timesheet Detail")
    employee = DocType("Employee")
    result = (
        frappe.qb.from_(timesheet)
        .join(timesheet_detail)
        .on(timesheet.name == timesheet_detail.parent)
        .join(employee)
        .on(timesheet.employee == employee.name)
        .select(
            Sum(timesheet_detail.hours).as_("total_hour"),
            timesheet.employee,
            employee.image,
            timesheet.employee_name,
        )
        .where(timesheet_detail.task == task.name)
        .where((timesheet_detail.from_time >= start_date) & (timesheet_detail.to_time <= end_date))
        .groupby(timesheet.employee)
    ).run(as_dict=True)

    #  Check if task DocType has custom_github_issue_id and custom_github_repository fields
    #  If yes, then create github link else it will be blank.
    if task.meta.has_field("custom_github_issue_id") and task.meta.has_field("custom_github_repository"):
        if task.custom_github_issue_id and task.custom_github_repository:
            repo = task.custom_github_repository
            issue_id = task.custom_github_issue_id
            gh_link = f"https://github.com{repo if repo.startswith('/') else f'/{repo}'}/issues/{issue_id}"
    return {
        "subject": task.subject,
        "expected_time": task.expected_time,
        "project_name": frappe.db.get_value("Project", task.project, "project_name"),
        "project": task.project,
        "actual_time": task.actual_time,
        "status": task.status,
        "worked_by": result,
        "name": task.name,
        "gh_link": gh_link,
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
