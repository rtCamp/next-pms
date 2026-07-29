import datetime

import frappe
from frappe.query_builder import Case, DocType
from frappe.query_builder import functions as fn
from frappe.utils import add_days, getdate, now_datetime
from pypika import Criterion, Order

from next_pms.timesheet.utils.constant import TASK_FILTER_OPERATORS, TASK_META_FIELDS

from . import get_count
from .project import get_project_filter_for_contractor
from .timesheet import _apply_qb_condition


def parse_task_filters(raw_filters: list | str | None) -> list:
    """Parse [field, operator, value] filters into validated triples for Task.

    Args:
        raw_filters: A list of [field, operator, value] entries, or a JSON string encoding one.
            Every field must be a Task field or a Frappe default column (e.g. modified, creation),
            so all real Task columns are supported without allowing arbitrary column access.

    Returns:
        A list of validated [field, operator, value] triples.
    """
    import json

    if not raw_filters:
        return []

    if isinstance(raw_filters, str):
        try:
            raw_filters = json.loads(raw_filters)
        except ValueError, TypeError:
            frappe.throw(frappe._("Invalid filters format. Expected a JSON array of [field, operator, value] entries."))

    if not isinstance(raw_filters, list):
        frappe.throw(frappe._("Filters must be a list of [field, operator, value] entries."))

    meta = frappe.get_meta("Task")
    parsed = []
    for condition in raw_filters:
        if not isinstance(condition, (list, tuple)) or len(condition) != 3:
            frappe.throw(frappe._("Each filter must be a list of [field, operator, value]."))
        field, operator, value = condition
        if not isinstance(operator, str) or operator.lower().strip() not in TASK_FILTER_OPERATORS:
            frappe.throw(frappe._("Unsupported filter operator '{0}'.").format(operator))
        if field not in TASK_META_FIELDS and not meta.has_field(field):
            frappe.throw(frappe._("Filtering on field '{0}' of Task is not supported.").format(field))
        parsed.append([field, operator.lower().strip(), value])
    return parsed


def parse_task_order_by(order_by: str | None) -> list:
    """Parse a Frappe-style order_by string into validated sort pairs for Task.

    Args:
        order_by: A sort string such as "field asc, other desc". Every field must be a Task field
            or a Frappe default column (e.g. modified, creation).

    Returns:
        A list of (field, Order) pairs to apply to the query in order.
    """
    if not order_by:
        return []

    meta = frappe.get_meta("Task")
    parsed = []
    for clause in str(order_by).split(","):
        clause = clause.strip()
        if not clause:
            continue
        tokens = clause.split()
        field = tokens[0]
        direction = tokens[1].lower() if len(tokens) > 1 else "asc"
        if len(tokens) > 2 or direction not in ("asc", "desc"):
            frappe.throw(frappe._("Invalid order_by clause '{0}'.").format(clause))
        if field not in TASK_META_FIELDS and not meta.has_field(field):
            frappe.throw(frappe._("Sorting on field '{0}' of Task is not supported.").format(field))
        parsed.append((field, Order.asc if direction == "asc" else Order.desc))
    return parsed


@frappe.whitelist(methods=["GET"])
def get_task_list(
    search: str = None,
    page_length: int | bool = 20,
    start: int | None = 0,
    projects: list | str | None = None,
    status: list | str = None,
    fields: list | str = None,
    filter_recent: bool = False,
    filters: list | str | None = None,
    order_by: str | None = None,
):
    """Get the list of tasks for projects the user has access to, with optional filters and sorting.

    Args:
        search: Text matched against task name, subject, and github issue link.
        page_length: Number of tasks to return.
        start: Pagination offset.
        projects: Restrict results to these project names.
        status: Restrict results to these task statuses.
        fields: Extra Task fields to include in each result row.
        filter_recent: Order tasks the user logged time against in the last week first.
        filters: Composite conditions on any Task field, combined with AND. A list of
            [field, operator, value] entries, or a JSON string encoding one.
        order_by: Frappe-style sort string such as "priority desc, modified asc". When provided it
            replaces the default recent/liked/open ordering.

    Returns:
        A dict with the task list, the total matching count, and whether more results exist.
    """
    import json

    frappe.has_permission(doctype="Project", throw=True)
    search_filter = {}
    if isinstance(projects, str):
        projects = json.loads(projects)
    if status and isinstance(status, str):
        status = json.loads(status)
    if fields and isinstance(fields, str):
        fields = json.loads(fields)

    parsed_filters = parse_task_filters(filters)
    parsed_order_by = parse_task_order_by(order_by)

    field_list = [
        "name",
        "subject",
        "status",
        "priority",
        "description",
        "actual_time",
        "expected_time",
        "_liked_by",
        "owner",
    ]
    if fields:
        field_list.extend(fields)
        field_list = list(set(field_list))
        if "project_name" in field_list:
            field_list.remove("project_name")
    #  Limit the task fetched based on the projects the user has access to.
    project_filters = {}

    allowed_projects = set(get_project_filter_for_contractor(only_list=True) or [])
    input_projects = set(projects or [])

    if allowed_projects and input_projects:
        # intersection of allowed and requested
        filtered_projects = list(allowed_projects & input_projects)
    elif allowed_projects:
        # only allowed
        filtered_projects = list(allowed_projects)
    elif input_projects:
        # no restriction, but user passed explicit projects
        filtered_projects = list(input_projects)
    else:
        filtered_projects = []

    if filtered_projects:
        project_filters["name"] = ["in", filtered_projects]

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

    for field, operator, value in parsed_filters:
        tasks = _apply_qb_condition(tasks, doctype, field, operator, value)

    if page_length:
        tasks = tasks.limit(int(page_length))
    tasks = tasks.offset(int(start or 0))

    if parsed_order_by:
        # An explicit caller sort replaces the default recent/liked/open heuristic ordering.
        for field, order in parsed_order_by:
            tasks = tasks.orderby(getattr(doctype, field), order=order)
    else:
        order_conditions = []

        # If filter_recent is True, we will order the tasks based on the recent worked tasks First.
        # This will help in showing the tasks that the user has worked on recently at the top.
        if filter_recent:
            recent_worked_tasks = get_recent_log_tasks()
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

        tasks = tasks.orderby(*order_conditions, order=Order.desc)

    tasks = tasks.run(as_dict=True)

    count_filters = [[field, condition[0], condition[1]] for field, condition in filter.items()]
    count_filters.extend(parsed_filters)
    count = get_count(
        doctype="Task",
        filters=count_filters,
        or_filters=search_filter,
        ignore_permissions=True,
    )

    return {
        "task": tasks,
        "total_count": count,
        "has_more": int(start) + int(page_length) < count,
    }


@frappe.whitelist(methods=["POST"])
def add_task(subject: str, expected_time: str, project: str, description: str):
    """API to add task, it will create a task under the given project with the given details."""
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


@frappe.whitelist(methods=["GET"])
def get_task(task: str, start_date: str | datetime.date, end_date: str | datetime.date):
    """API to get the task details along with the time logged against it between the given start date and end date."""
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
        "exp_end_date": task.exp_end_date or "",
        "project_name": frappe.db.get_value("Project", task.project, "project_name"),
        "project": task.project,
        "actual_time": task.actual_time,
        "status": task.status,
        "worked_by": result,
        "name": task.name,
        "gh_link": task.custom_github_issue_link if task.meta.has_field("custom_github_issue_link") else "",
    }


@frappe.whitelist(methods=["GET"])
def get_task_log(task: str, start_date: str = None, end_date: str = None, employee: str = None):
    """API to get the time log details for a task between the given start date and end date. with an optional parameter of passing in employee"""
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

    if employee:
        query = query.where(timesheet.employee == employee)

    result = query.run(as_dict=True)

    log_entries = {}

    for res in result:
        key = str(res.get("start_date"))
        if key not in log_entries:
            log_entries[key] = []

        log_entries[key].append(
            {
                "employee": res.get("employee"),
                "hours": res.get("hours"),
                "description": [res.get("description")] if res.get("description") else [],
            }
        )

    return log_entries


@frappe.whitelist(methods=["GET"])
def get_liked_tasks():
    """API to get the list of tasks that the user has liked, along with the project name."""
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
