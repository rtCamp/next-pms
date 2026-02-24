from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, getdate

"""
to execute :
 bench execute next_pms.timesheet.patches.create_sales_timesheet.execute --kwargs '{"start_date":"2025-10-01","end_date":"2026-02-22","project":"PROJ-0024","department":"sales - test - T","task":"TASK-2026-00280"}'

 to delete :
 bench execute next_pms.timesheet.patches.create_sales_timesheet.delete --kwargs '{"start_date":"2025-10-01","end_date":"2026-02-22","project":"PROJ-0024","task":"TASK-2026-00280"}'

"""


@frappe.whitelist()
def execute(
    start_date: str,
    end_date: str,
    project: str,
    task: str | None = None,
    department: str = "Sales",
    full_day_hours: float = 8.0,
    half_day_hours: float = 4.0,
):
    """Create or top-up daily timesheets for active employees in the sales team.

    Rules:
    - Employee must be Active and belong to the given department.
    - Full day leave => skip
    - Half day leave => required hours are half_day_hours
    - Existing timesheets on the date are counted and only the remaining hours are added.
    - Time entry description uses the latest lead assigned to the employee's user.
    """
    if not start_date or not end_date:
        end_date = getdate()
        start_date = add_days(end_date, -1)

    if not project:
        frappe.throw(_("Project is mandatory."))

    start_date = getdate(start_date)
    end_date = getdate(end_date)

    if start_date > end_date:
        frappe.throw(_("Start Date cannot be greater than End Date."))

    employees = _get_active_department_employees(department)
    task, is_billable = _resolve_task_for_project(project=project, task=task)

    employee_lines = []

    for employee in employees:
        date = start_date
        lead_description = _get_lead_description_for_user(employee.get("user_id"))
        holiday_dates = _get_holiday_dates_for_employee(
            holiday_list=employee.get("holiday_list"), start_date=start_date, end_date=end_date
        )
        employee_created = 0
        employee_skipped = 0

        while date <= end_date:
            if date in holiday_dates:
                employee_skipped += 1
                date = add_days(date, 1)
                continue

            required_hours = _get_required_hours_for_date(
                employee=employee.name,
                date=date,
                full_day_hours=full_day_hours,
                half_day_hours=half_day_hours,
            )

            if required_hours <= 0:
                employee_skipped += 1
                date = add_days(date, 1)
                continue

            existing_hours = _get_existing_hours_for_date(employee=employee.name, date=date)
            remaining_hours = round(required_hours - existing_hours, 2)

            if remaining_hours <= 0:
                employee_skipped += 1
                date = add_days(date, 1)
                continue

            timesheet = _get_or_create_timesheet(
                employee=employee.name,
                date=date,
                project=project,
            )
            timesheet.append(
                "time_logs",
                {
                    "task": task,
                    "hours": remaining_hours,
                    "description": lead_description,
                    "from_time": date,
                    "to_time": date,
                    "project": project,
                    "is_billable": is_billable,
                },
            )
            timesheet.save(ignore_permissions=True)

            employee_created += 1

            date = add_days(date, 1)

        employee_lines.append(
            f"{employee.name} ({employee.employee_name}): created={employee_created}, skipped={employee_skipped}"
        )

    return "\n".join(employee_lines)


@frappe.whitelist()
def delete(
    start_date: str,
    end_date: str,
    project: str,
    task: str | None = None,
):
    """Bulk delete timesheets created by Administrator for the given filters."""
    if not start_date or not end_date:
        frappe.throw(_("Start Date and End Date are mandatory."))

    if not project:
        frappe.throw(_("Project is mandatory."))

    start_date = getdate(start_date)
    end_date = getdate(end_date)

    if start_date > end_date:
        frappe.throw(_("Start Date cannot be greater than End Date."))

    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "owner": "Administrator",
            "parent_project": project,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
            "docstatus": 0,
        },
        fields=["name", "employee"],
        limit_page_length=0,
    )
    if not timesheets:
        return f"No draft timesheets created by Administrator found for project {project} in the given date range."

    parent_names = [row.name for row in timesheets]

    if task:
        detail_rows = frappe.get_all(
            "Timesheet Detail",
            filters={
                "parent": ["in", parent_names],
                "task": task,
            },
            fields=["parent"],
            limit_page_length=0,
        )
        parent_names = sorted({row.parent for row in detail_rows})

    if not parent_names:
        return f"No draft timesheets created by Administrator matched the given task for project {project}."

    employee_counter = {}
    for row in timesheets:
        if row.name in parent_names:
            employee_counter[row.employee] = employee_counter.get(row.employee, 0) + 1

    deleted_logs = frappe.db.delete("Timesheet Detail", {"parent": ["in", parent_names]})
    deleted_timesheets = frappe.db.delete("Timesheet", {"name": ["in", parent_names]})

    frappe.clear_cache()
    lines = [f"{employee}: deleted_timesheets={count}" for employee, count in sorted(employee_counter.items())]
    lines.append(f"summary: deleted_timesheets={deleted_timesheets}, deleted_logs={deleted_logs}")
    return "\n".join(lines)


def _get_active_department_employees(department: str):
    return frappe.get_all(
        "Employee",
        filters={
            "status": "Active",
            "department": department,
        },
        fields=["name", "employee_name", "user_id", "holiday_list"],
    )


def _get_holiday_dates_for_employee(holiday_list: str | None, start_date, end_date) -> set:
    if not holiday_list:
        return set()

    holiday_rows = frappe.get_all(
        "Holiday",
        filters={
            "parent": holiday_list,
            "holiday_date": ["between", [start_date, end_date]],
        },
        fields=["holiday_date"],
    )

    return {getdate(row.holiday_date) for row in holiday_rows}


def _get_required_hours_for_date(employee: str, date, full_day_hours: float, half_day_hours: float) -> float:
    leaves = frappe.get_all(
        "Leave Application",
        filters={
            "employee": employee,
            "docstatus": ["!=", 2],
            "from_date": ["<=", date],
            "to_date": [">=", date],
        },
        fields=["half_day", "half_day_date"],
    )

    if not leaves:
        return full_day_hours

    for leave in leaves:
        if leave.half_day and leave.half_day_date and getdate(leave.half_day_date) == date:
            return half_day_hours

    return 0


def _get_existing_hours_for_date(employee: str, date) -> float:
    timesheet_hours = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": date,
            "end_date": date,
            "docstatus": ["!=", 2],
        },
        pluck="total_hours",
    )
    return float(sum(timesheet_hours or []))


def _get_or_create_timesheet(employee: str, date, project: str):
    existing_timesheet = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": date,
            "end_date": date,
            "parent_project": project,
            "docstatus": ["!=", 2],
        },
        "name",
    )

    if existing_timesheet:
        return frappe.get_doc("Timesheet", existing_timesheet)

    return frappe.get_doc(
        {
            "doctype": "Timesheet",
            "owner": "Administrator",
            "employee": employee,
            "start_date": date,
            "end_date": date,
            "parent_project": project,
        }
    )


def _resolve_task_for_project(project: str, task: str | None = None):
    if task:
        task_project, custom_is_billable = frappe.get_value("Task", task, ["project", "custom_is_billable"])
        if not task_project:
            frappe.throw(_("Task {0} does not exist.").format(task))
        if task_project != project:
            frappe.throw(_("Task {0} does not belong to project {1}.").format(task, project))
        return task, custom_is_billable

    task_details = frappe.db.get_value(
        "Task",
        {"project": project, "status": ["!=", "Cancelled"]},
        ["name", "custom_is_billable"],
        as_dict=True,
    )
    if not task_details:
        frappe.throw(_("Please provide a task. No active task found for project {0}.").format(project))

    return task_details.name, task_details.custom_is_billable


def _get_lead_description_for_user(user_id: str | None) -> str:
    latest_lead_name = _get_latest_assigned_lead_name(user_id)
    if latest_lead_name:
        return f"Lead assigned or work done on lead: {latest_lead_name}"
    return "Lead assigned or work done on lead"


def _get_latest_assigned_lead_name(user_id: str | None) -> str | None:
    if not user_id:
        return None

    if not frappe.db.exists("DocType", "Lead"):
        return None

    try:
        lead_meta = frappe.get_meta("Lead")
        owner_field = "lead_owner" if lead_meta.has_field("lead_owner") else "owner"

        fields = ["name"]
        if lead_meta.has_field("lead_name"):
            fields.append("lead_name")

        leads = frappe.get_all(
            "Lead",
            filters={owner_field: user_id},
            fields=fields,
            order_by="modified desc",
            limit=1,
        )
        if not leads:
            return None

        lead = leads[0]
        return lead.get("name")
    except Exception:
        return None
