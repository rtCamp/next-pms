import datetime

import frappe
from frappe.query_builder import Case, DocType
from frappe.query_builder import functions as fn
from frappe.utils import add_days, getdate, now_datetime
from pypika import Criterion, Order

from . import get_count
from .project import get_project_filter_for_contractor


@frappe.whitelist()
def get_task_list(
    search: str = None,
    page_length: int | bool = 20,
    start: int | None = 0,
    projects=None,
    status: list | str = None,
    fields: list | str = None,
    filter_recent: bool = False,
):
    import json

    frappe.has_permission(doctype="Project", throw=True)
    search_filter = {}
    if isinstance(projects, str):
        projects = json.loads(projects)
    if status and isinstance(status, str):
        status = json.loads(status)
    if fields and isinstance(fields, str):
        fields = json.loads(fields)

    field_list = [
        "name",
        "subject",
        "status",
        "priority",
        "description",
        "actual_time",
        "expected_time",
        "_liked_by",
    ]
    if fields:
        field_list.extend(fields)
        field_list = list(set(field_list))
        if "project_name" in field_list:
            field_list.remove("project_name")
    #  Limit the task fetched based on the projects the user has access to.
    allowed_projects = get_project_filter_for_contractor(only_list=True)
    project_filters = {}

    if allowed_projects:
        if projects:
            project_filters["name"] = ["in", list(set(allowed_projects).intersection(set(projects)))]
        else:
            project_filters["name"] = ["in", allowed_projects]
    else:
        project_filters["name"] = ["in", projects]

    projects = frappe.get_list("Project", pluck="name", filters=project_filters)

    filter = {"project": ["in", projects]}
    if not projects:
        # If no projects are available, we return an empty list.
        return {"task": [], "total_count": 0, "has_more": False}
    doctype = DocType("Task")
    doctype_project = DocType("Project")
    tasks = (
        frappe.qb.from_(doctype)
        .join(doctype_project)
        .on(doctype.project == doctype_project.name)
        .select(
            *field_list,
            doctype_project.name.as_("project"),
            doctype_project.project_name,
            doctype.custom_is_billable,
            doctype.exp_end_date,
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

    order_conditions = []

    # If filter_recent is True, we will order the tasks based on the recent worked tasks First.
    # This will help in showing the tasks that the user has worked on recently at the top.
    if filter_recent:
        recent_worked_tasks = get_recent_log_tasks()
        order_conditions = []
        if recent_worked_tasks:
            order_conditions.append(Case().when(doctype.name.isin(recent_worked_tasks), 1).else_(0))

    order_conditions.append(
        Case()
        .when(
            fn.Function("INSTR", doctype._liked_by, f'"{frappe.session.user}"') > 0,
            1,
        )
        .else_(0)
    )
    # Since we can not hide closed tasks, as user might need to add time against it,
    # We can deprioritize the closed tasks.
    order_conditions.append(Case().when(doctype.status.isin(["Open", "Working"]), 1).else_(0))

    tasks = tasks.offset(start).orderby(
        *order_conditions,
        order=Order.desc,
    )
    tasks = tasks.run(as_dict=True)

    count = get_count(
        doctype="Task",
        filters=filter,
        or_filters=search_filter,
        ignore_permissions=True,
    )

    return {
        "task": tasks,
        "total_count": count,
        "has_more": int(start) + int(page_length) < count,
    }


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
        .orderby(timesheet.employee_name, order=frappe.qb.asc)
    ).run(as_dict=True)

    return {
        "subject": task.subject,
        "expected_time": task.expected_time,
        "project_name": frappe.db.get_value("Project", task.project, "project_name"),
        "project": task.project,
        "actual_time": task.actual_time,
        "status": task.status,
        "worked_by": result,
        "name": task.name,
        "gh_link": task.custom_github_issue_link if task.meta.has_field("custom_github_issue_link") else "",
    }


@frappe.whitelist()
def get_task_log(task: str, start_date: str = None, end_date: str = None):
    project = frappe.db.get_value("Task", task, "project")

    if project:
        frappe.has_permission(doctype="Project", doc=project, throw=True)
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
        .orderby(timesheet.start_date, order=frappe.qb.desc)
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


@frappe.whitelist()
def get_liked_tasks():
    from next_pms.timesheet.api.app import get_liked_documents

    return get_liked_documents("Task", fields=["project.project_name"])


def get_recent_log_tasks():
    return frappe.get_all(
        "Timesheet Detail",
        filters={
            "owner": frappe.session.user,
            "creation": [">=", add_days(now_datetime(), -7)],
        },
        pluck="task",
    )
