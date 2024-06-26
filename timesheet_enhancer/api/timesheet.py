import frappe
from erpnext.setup.doctype.employee.employee import is_holiday
from frappe import _, throw
from frappe.utils import (
    add_days,
    get_first_day,
    get_first_day_of_week,
    get_last_day,
    get_last_day_of_week,
    getdate,
    nowdate,
)
from hrms.hr.utils import get_holiday_dates_for_employee

from timesheet_enhancer.api.utils import (
    get_employee_from_user,
    get_leaves_for_employee,
    get_week_dates,
)

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(employee: str, start_date=now, max_week: int = 4):
    """Get timesheet data for the given employee for the given number of weeks."""

    if not employee:
        employee = get_employee_from_user()
    data = {}
    #  We will loop over the number of weeks and get the timesheet data for each week.
    #  We will return the leaves, holidays, and timesheet details for each week.
    for i in range(max_week):
        current_week = True if start_date == now else False
        # Get the week dates for the given date, which will return list of dates.
        week_dates = get_week_dates(start_date, current_week=current_week)
        data[week_dates["key"]] = week_dates

        tasks, hours = get_timesheet(week_dates["dates"], employee)
        data[week_dates["key"]]["hours"] = hours
        data[week_dates["key"]]["tasks"] = tasks

        leaves = get_leaves_for_employee(
            week_dates["start_date"], week_dates["end_date"], employee
        )
        data[week_dates["key"]]["leaves"] = leaves

        data[week_dates["key"]]["holidays"] = get_holiday_dates_for_employee(
            employee, week_dates["start_date"], week_dates["end_date"]
        )

        data[week_dates["key"]]["state"] = get_timesheet_state(
            week_dates["dates"], employee
        )
        start_date = add_days(getdate(week_dates["start_date"]), -1)

    return data


@frappe.whitelist()
def get_employee_holidays_and_leave_dates(employee: str):
    """Returns the list of holidays and leaves dates after combining for the given employee."""
    from hrms.hr.utils import get_holiday_dates_for_employee

    start_date = get_first_day(nowdate())
    end_date = get_last_day(nowdate())

    dates = get_holiday_dates_for_employee(employee, start_date, end_date)
    leave_applications = get_leaves_for_employee(start_date, end_date, employee)

    # Loop over all the leaves and create the date map of the leaves.
    # If the leave is half day then we will skip the half day date as employee can still save time entry.
    for entry in leave_applications:
        from_date = getdate(entry["from_date"])
        to_date = getdate(entry["to_date"])
        while from_date <= to_date:
            if entry["half_day"] and entry["half_day_date"] == from_date:
                continue
            dates.append(from_date)
            from_date = add_days(from_date, 1)

    return list(set(dates))


@frappe.whitelist()
def save(
    date: str,
    description: str,
    task: str,
    name: str = None,
    hours: float = 0,
    parent: str = None,
    is_update: bool = False,
    employee: str = None,
):
    """Updates/create time entry in Timesheet Detail child table."""
    if not employee:
        employee = get_employee_from_user()
    if is_update and not name:
        throw(_("Timesheet is required for update"))
    if is_update:
        update_timesheet_detail(name, parent, hours, description, task)
        return _("Timesheet updated successfully.")

    parent = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", getdate(date)],
            "end_date": ["<=", getdate(date)],
        },
        "name",
    )
    if parent:
        existing_log = frappe.db.get_value(
            "Timesheet Detail", {"parent": parent, "task": task}, "name"
        )
        if existing_log:
            update_timesheet_detail(existing_log, parent, hours, description, task)
            return _("Timesheet updated successfully.")
    create_timesheet_detail(date, hours, description, task, employee, parent)
    return _("New Timesheet created successfully.")


@frappe.whitelist()
def delete(parent: str, name: str):
    """Delete single time entry from timesheet doctype."""
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if log.name == name:
            parent_doc.remove(log)
    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=True)
    else:
        parent_doc.save()
    return _("Timesheet deleted successfully.")


@frappe.whitelist()
def submit_for_approval(
    start_date: str, end_date: str, notes: str, employee: str = None
):
    from frappe.model.workflow import apply_workflow
    from frappe.workflow.doctype.workflow_action.workflow_action import (
        get_doc_workflow_state,
    )

    if not employee:
        employee = get_employee_from_user()
    #  get the timesheet for whole week.
    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": 0,
        },
    )

    wf = frappe.db.exists("Workflow", {"document_type": "Timesheet", "is_active": True})

    for timesheet in timesheets:
        #  First add the note in timesheet and run the workflow action.
        doc = frappe.get_doc("Timesheet", timesheet["name"])
        doc.note = notes
        doc.save()
        workflow_state = get_doc_workflow_state(doc)
        action = frappe.db.get_value(
            "Workflow Transition",
            {"parent": wf, "state": workflow_state},
            "action",
        )
        apply_workflow(doc, action)
    return _("Timesheet submitted for approval.")


def update_timesheet_detail(
    name: str, parent: str, hours: float, description: str, task: str
):
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if log.name != name:
            continue
        if log.task != task:
            throw(_("No matching task found for update."))
        log.hours = hours
        log.description = description
    parent_doc.save()


def create_timesheet_detail(
    date: str,
    hours: float,
    description: str,
    task: str,
    employee: str,
    parent: str = None,
):
    if not parent:
        timehseet = frappe.get_doc({"doctype": "Timesheet", "employee": employee})
    else:
        timehseet = frappe.get_doc("Timesheet", parent)
    timehseet.append(
        "time_logs",
        {
            "task": task,
            "hours": hours,
            "description": description,
            "from_time": date,
            "to_time": date,
        },
    )
    timehseet.save()


def get_timesheet(dates: list, employee: str):
    """Return the time entry from Timesheet Detail child table based on the list of dates and for the given employee.
    example:
        {
            "Task 1": {
                "name": "TS-00001",
                "data": [
                    {
                        "task": "Task 1",
                        "name": "TS-00001",
                        "hours": 8,
                        "description": "Task 1 description",
                        "from_time": "2021-08-01",
                        "to_time": "2021-08-01",
                    },
                    ...
                ]
            },
            ...
        }
    """
    data = {}
    week = []
    isManager = "Projects Manager" in frappe.get_roles(frappe.session.user)
    for date in dates:
        disabled = True
        start_date = get_first_day_of_week(now)
        end_date = get_last_day_of_week(now)
        date = getdate(date)
        if isManager:
            disabled = False
        else:
            if (
                (date >= start_date and date <= end_date)
                and not is_holiday(employee, date, raise_exception=False)
                and date <= getdate(now)
            ):
                disabled = False

        name = frappe.db.exists(
            "Timesheet",
            {
                "employee": str(employee),
                "start_date": date,
                "end_date": date,
            },
        )

        if not name:
            week.append({"date": date, "hours": 0, "disabled": disabled})
            continue
        timesheet = frappe.get_doc("Timesheet", name)

        week.append(
            {"date": date, "hours": timesheet.total_hours, "disabled": disabled}
        )

        for log in timesheet.time_logs:
            if not log.task:
                continue
            subject, task_name, project_name = frappe.get_value(
                "Task", log.task, ["subject", "name", "project.project_name"]
            )
            if not subject:
                continue
            if subject not in data:
                data[subject] = {"name": task_name, "data": [], "project": project_name}

            data[subject]["data"].append(log.as_dict())
    return [data, week]


@frappe.whitelist()
def get_timesheet_detail_for_employee(employee: str, date: str):
    """Get timesheet data for the given employee for the given date."""

    timesheet = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": getdate(date),
            "end_date": getdate(date),
        },
        "name",
    )
    if not timesheet:
        frappe.throw(_("No timesheet found for the given date."))

    timesheet_detail = frappe.qb.DocType("Timesheet Detail")
    project = frappe.qb.DocType("Project")
    task = frappe.qb.DocType("Task")
    res = (
        frappe.qb.from_(timesheet_detail)
        .left_join(project)
        .on(project.name == timesheet_detail.project)
        .inner_join(task)
        .on(task.name == timesheet_detail.task)
        .select(
            project.project_name,
            timesheet_detail.name,
            project.name.as_("project"),
            project.department,
            timesheet_detail.hours,
            task.subject.as_("task_subject"),
            task.name.as_("task_name"),
            timesheet_detail.parent,
            timesheet_detail.description,
        )
        .where(timesheet_detail.parent == timesheet)
    ).run(as_dict=True)
    return res


def get_timesheet_state(dates: list, employee: str):
    from frappe.workflow.doctype.workflow_action.workflow_action import (
        get_doc_workflow_state,
    )

    res = "open"
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "start_date": [">=", getdate(dates[0])],
            "end_date": ["<=", getdate(dates[-1])],
            "employee": employee,
        },
    )
    if len(timesheets) == 0:
        return res
    approved = 0
    submitted = 0

    for timesheet in timesheets:
        timesheet = frappe.get_doc("Timesheet", timesheet["name"])
        state = get_doc_workflow_state(timesheet)
        approved += 1 if state == "Approved" else 0
        submitted += 1 if state == "Waiting Approval" else 0

    if approved == 0 and submitted == 0:
        return res
    if approved > submitted:
        res = "approved"
    else:
        res = "submitted"
    return res
