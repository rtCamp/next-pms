import frappe
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
from hrms.hr.utils import get_holiday_dates_for_employee, get_holidays_for_employee

from .utils import (
    get_employee_from_user,
    get_employee_working_hours,
    get_leaves_for_employee,
    get_week_dates,
)

now = nowdate()


@frappe.whitelist()
def get_timesheet_data(
    employee: str,
    start_date=now,
    max_week: int = 4,
    holiday_with_description: bool = False,
):
    """Get timesheet data for the given employee for the given number of weeks."""
    if not employee:
        employee = get_employee_from_user()
    if not frappe.db.exists("Employee", employee):
        throw(_("Employee not found."))

    hour_detail = get_employee_working_hours(employee)
    res = {**hour_detail}
    data = {}
    # Retrieve holidays and leaves data outside the loop

    if not holiday_with_description:
        holidays = get_holiday_dates_for_employee(
            employee,
            add_days(start_date, -max_week * 7),
            add_days(start_date, max_week * 7),
        )
    else:
        holidays = get_holidays_for_employee(
            employee,
            add_days(start_date, -max_week * 7),
            add_days(start_date, max_week * 7),
        )
    res["holidays"] = holidays

    res["leaves"] = get_leaves_for_employee(
        add_days(start_date, -max_week * 7),
        add_days(start_date, max_week * 7),
        employee,
    )

    for i in range(max_week):
        current_week = start_date == now

        week_dates = get_week_dates(start_date, current_week=current_week)
        week_key = week_dates["key"]

        tasks, total_hours = get_timesheet(week_dates["dates"], employee)
        status = get_timesheet_state(week_dates["dates"], employee)

        data[week_key] = {
            **week_dates,
            "total_hours": total_hours,
            "tasks": tasks,
            "status": status,
        }
        start_date = add_days(getdate(week_dates["start_date"]), -1)
    res["data"] = data
    return res


@frappe.whitelist()
def get_employee_holidays_and_leave_dates(employee: str):
    """Returns the list of holidays and leaves dates after combining for the given employee."""
    from hrms.hr.utils import get_holiday_dates_for_employee

    start_date = get_first_day(nowdate())
    end_date = get_last_day(nowdate())

    dates = get_holiday_dates_for_employee(employee, start_date, end_date)

    leave_applications = frappe.get_list(
        "Leave Application",
        filters={
            "employee": employee,
            "status": ["IN", ["Open", "Approved"]],
            "half_day": False,
        },
        fields=["from_date", "to_date"],
    )

    leaves_dates = []
    for entry in leave_applications:
        leaves_dates.append(entry["from_date"])
        leaves_dates.append(entry["to_date"])

    dates.extend(leaves_dates)
    return list(set(dates))


@frappe.whitelist()
def save(
    date: str,
    description: str,
    task: str,
    hours: float = 0,
    name: str = None,
    parent: str = None,
    employee: str = None,
    is_billable: bool = False,
):
    """Updates/create time entry in Timesheet Detail child table."""
    if not employee:
        employee = get_employee_from_user()
    if not task:
        throw(_("Task is mandatory."))

    project = frappe.get_value("Task", task, "project")
    if not name and not parent:
        parent = frappe.db.get_value(
            "Timesheet",
            {
                "employee": employee,
                "start_date": [">=", getdate(date)],
                "end_date": ["<=", getdate(date)],
                "parent_project": project,
                "docstatus": ["!=", 2],
            },
            "name",
        )
        create_timesheet_detail(date, hours, description, task, employee, parent)
        return _("New Timesheet created successfully.")
    return update_timesheet_detail(
        name, parent, hours, description, task, date, is_billable
    )


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
    return _("Time entry deleted successfully.")


@frappe.whitelist()
def submit_for_approval(start_date: str, notes: str = None, employee: str = None):
    if not employee:
        employee = get_employee_from_user()
    reporting_manager = frappe.get_value("Employee", employee, "reports_to")
    if not reporting_manager:
        throw(_("Reporting Manager not found for the employee."))
    reporting_manager = frappe.get_value("Employee", reporting_manager, "employee_name")
    #  get the timesheet for whole week.
    start_date = get_first_day_of_week(start_date)
    end_date = get_last_day_of_week(start_date)

    timesheets = frappe.get_list(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": 0,
        },
    )
    if not timesheets:
        throw(_("No timesheet found for the given week."))

    length = len(timesheets)
    for index, timesheet in enumerate(timesheets):
        doc = frappe.get_doc("Timesheet", timesheet.name)
        doc.custom_approval_status = "Approval Pending"
        doc.save()
        if index == length - 1 and notes:
            doc.add_comment("Comment", text=notes)

    return _(f"Timesheet has been set for Approval to {reporting_manager}.")


@frappe.whitelist()
def update_timesheet_detail(
    name: str,
    parent: str,
    hours: float,
    description: str,
    task: str,
    date: str | None = None,
    is_billable: bool = False,
):
    parent_doc = frappe.get_doc("Timesheet", parent)
    for log in parent_doc.time_logs:
        if not name:
            continue
        if log.name == name:
            log.hours = hours
            log.description = description
            log.is_billable = is_billable
    if not name:
        parent_doc.append(
            "time_logs",
            {
                "task": task,
                "hours": hours,
                "description": description,
                "from_time": getdate(date),
                "to_time": getdate(date),
                "project": frappe.get_value("Task", task, "project"),
                "is_billable": is_billable,
            },
        )
    if not parent_doc.time_logs:
        parent_doc.delete(ignore_permissions=True)
    else:
        parent_doc.save()
        parent_doc.reload()

        if parent_doc.total_hours == 0:
            parent_doc.delete(ignore_permissions=True)

    return _("Time entry updated successfully.")


def create_timesheet_detail(
    date: str,
    hours: float,
    description: str,
    task: str,
    employee: str,
    parent: str | None = None,
):
    if parent:
        timehseet = frappe.get_doc("Timesheet", parent)
    else:
        timehseet = frappe.get_doc({"doctype": "Timesheet", "employee": employee})

    project, custom_is_billable = frappe.get_value(
        "Task", task, ["project", "custom_is_billable"]
    )

    timehseet.update({"parent_project": project})
    timehseet.append(
        "time_logs",
        {
            "task": task,
            "hours": hours,
            "description": description,
            "from_time": getdate(date),
            "to_time": getdate(date),
            "project": project,
            "is_billable": custom_is_billable,
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
    total_hours = 0
    for date in dates:
        timesheets = frappe.get_all(
            "Timesheet",
            filters={
                "employee": employee,
                "start_date": getdate(date),
                "end_date": getdate(date),
                "docstatus": ["!=", 2],
            },
        )
        if not timesheets:
            continue
        for timesheet in timesheets:
            timesheet = frappe.get_doc("Timesheet", timesheet.get("name"))
            total_hours += timesheet.total_hours
            for log in timesheet.time_logs:
                if not log.task:
                    continue
                subject, task_name, project_name, is_billable = frappe.get_value(
                    "Task",
                    log.task,
                    ["subject", "name", "project.project_name", "custom_is_billable"],
                )
                if not subject:
                    continue
                if subject not in data:
                    data[subject] = {
                        "name": task_name,
                        "data": [],
                        "is_billable": is_billable,
                        "project_name": project_name,
                    }

                data[subject]["data"].append(log.as_dict())
    return [data, total_hours]


def get_timesheet_state(dates: list, employee: str):
    from frappe.query_builder.functions import Count

    timesheet = frappe.qb.DocType("Timesheet")
    res = "Not Submitted"
    status_counts = {
        "Approved": 0,
        "Approval Pending": 0,
        "Not Submitted": 0,
        "Rejected": 0,
    }
    status_count = (
        frappe.qb.from_(timesheet)
        .select(
            timesheet.custom_approval_status,
            Count("custom_approval_status").as_("count"),
        )
        .where(timesheet.employee == employee)
        .where(timesheet.start_date >= dates[0])
        .where(timesheet.end_date <= dates[-1])
        .groupby(timesheet.custom_approval_status)
    ).run(as_dict=True)

    for status in status_count:
        status_counts[status["custom_approval_status"]] = status["count"]

    if (
        status_counts.get("Approved") == 0
        and status_counts.get("Rejected") == 0
        and status_counts.get("Approval Pending") == 0
        and status_counts.get("Not Submitted") > 0
    ):
        res = "Not Submitted"

    if status_counts.get("Approved") > 0 and (
        status_counts.get("Approval Pending") > 0
        or status_counts.get("Rejected") > 0
        or status_counts.get("Not Submitted") > 0
    ):
        res = "Partially Approved"

    if status_counts.get("Rejected") > 0 and (
        status_counts.get("Approval Pending") > 0
        or status_counts.get("Approved") > 0
        or status_counts.get("Not Submitted") > 0
    ):
        res = "Partially Rejected"

    if (
        status_counts.get("Approval Pending") == 0
        and status_counts.get("Not Submitted") == 0
        and status_counts.get("Rejected") > 0
    ):
        res = "Rejected"

    if (
        status_counts.get("Approved") > 0
        and status_counts.get("Approval Pending") == 0
        and status_counts.get("Rejected") == 0
        and status_counts.get("Not Submitted") == 0
    ):
        res = "Approved"

    if status_counts.get("Approval Pending") > 0:
        res = "Approval Pending"
    return res


@frappe.whitelist()
def get_remaining_hour_for_employee(employee: str, date: str):
    """Return the working hours for the given employee on the given date."""
    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": getdate(date),
            "end_date": getdate(date),
        },
        fields=["total_hours"],
    )
    total_hours = 0
    for timesheet in timesheets:
        total_hours += timesheet.total_hours
    return total_hours


@frappe.whitelist()
def get_timesheet_details(date: str, task: str, employee: str):
    """Return the time entry from Timesheet Detail child table based on the list of dates and for the given employee."""
    pass
    timesheet_detail = frappe.qb.DocType("Timesheet Detail")
    timesheet = frappe.qb.DocType("Timesheet")

    res = (
        frappe.qb.from_(timesheet_detail)
        .inner_join(timesheet)
        .on(timesheet_detail.parent == timesheet.name)
        .select(
            timesheet_detail.name,
            timesheet_detail.hours,
            timesheet_detail.description,
            timesheet_detail.task,
            timesheet_detail.from_time,
            timesheet_detail.to_time,
            timesheet_detail.parent,
            timesheet_detail.is_billable,
        )
        .where(timesheet_detail.task == task)
        .where(timesheet.employee == employee)
        .where(timesheet.start_date == getdate(date))
    )
    data = res.run(as_dict=True)
    subject = frappe.get_value("Task", task, "subject")
    return {
        "task": subject,
        "data": data,
    }
