import json

import frappe
from frappe import _, throw
from frappe.utils import nowdate
from frappe.utils.data import add_days, getdate

from .employee import get_employee_working_hours
from .timesheet import get_timesheet_state
from .utils import (
    filter_employees,
    get_holidays,
    get_leaves_for_employee,
    get_week_dates,
    is_timesheet_manager,
    update_weekly_status_of_timesheet,
)

now = nowdate()


@frappe.whitelist()
def get_compact_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    department=None,
    project=None,
    user_group=None,
    page_length=10,
    start=0,
    status_filter=None,
    status=None,
    reports_to: str | None = None,
):
    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    dates = []
    data = {}
    if status_filter and isinstance(status_filter, str):
        status_filter = json.loads(status_filter)

    for i in range(max_week):
        week = get_week_dates(date=date)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)

    dates.reverse()
    res = {"dates": dates}

    employees, total_count = filter_employee_by_timesheet_status(
        employee_name,
        department,
        project,
        user_group=user_group,
        page_length=page_length,
        start=start,
        reports_to=reports_to,
        status=status,
        timesheet_status=status_filter,
        start_date=dates[0].get("start_date"),
        end_date=dates[-1].get("end_date"),
    )
    employee_names = [employee.name for employee in employees]

    # Get all the timesheet between the date range for the employees
    timesheet_data = frappe.get_all(
        "Timesheet",
        filters={
            "employee": ["in", employee_names],
            "start_date": [">=", dates[0].get("start_date")],
            "end_date": ["<=", dates[-1].get("end_date")],
        },
        fields=[
            "employee",
            "start_date",
            "end_date",
            "total_hours",
            "note",
            "custom_approval_status",
        ],
    )

    #  Group the timesheet data by employee in the dictionary
    timesheet_map = {}
    for ts in timesheet_data:
        if ts.employee not in timesheet_map:
            timesheet_map[ts.employee] = []
        timesheet_map[ts.employee].append(ts)

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        daily_working_hours = (
            working_hours.get("working_hour")
            if working_hours.get("working_frequency") == "Per Day"
            else working_hours.get("working_hour") / 5
        )
        local_data = {**employee, **working_hours}
        employee_timesheets = timesheet_map.get(employee.name, [])

        status = get_timesheet_state(
            employee.name,
            start_date=dates[0].get("start_date"),
            end_date=dates[-1].get("end_date"),
        )
        local_data["status"] = status
        local_data["data"] = []

        leaves = get_leaves_for_employee(
            from_date=add_days(dates[0].get("start_date"), -max_week * 7),
            to_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )
        holidays = get_holidays(employee.name, dates[0].get("start_date"), dates[-1].get("end_date"))

        for date_info in dates:
            for date in date_info.get("dates"):
                hour = 0
                on_leave = False

                for leave in leaves:
                    if leave["from_date"] <= date <= leave["to_date"]:
                        if leave.get("half_day") and leave.get("half_day_date") == date:
                            hour += daily_working_hours / 2
                        else:
                            hour += daily_working_hours
                        on_leave = True

                for holiday in holidays:
                    if date == holiday.holiday_date:
                        if not holiday.weekly_off:
                            hour = daily_working_hours
                        else:
                            hour = 0
                        on_leave = False
                total_hours = 0
                notes = ""
                for ts in employee_timesheets:
                    if ts.start_date == date and ts.end_date == date:
                        total_hours += ts.get("total_hours")
                        notes += ts.get("note", "")
                hour += total_hours

                local_data["data"].append(
                    {
                        "date": date,
                        "hour": hour,
                        "is_leave": on_leave,
                        "note": notes.replace("<br>", "\n"),
                    }
                )

        data[employee.name] = local_data

    res["data"] = data
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count

    return res


@frappe.whitelist()
def approve_or_reject_timesheet(employee: str, status: str, dates: list[str] | str | None = None, note: str = ""):
    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    current_week = get_week_dates(dates[0])
    timesheets = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", current_week.get("start_date")],
            "end_date": ["<=", current_week.get("end_date")],
            "docstatus": ["=", 0],
        },
        ["name", "start_date"],
    )
    if not timesheets:
        return throw(_("No timesheet found for the given date range."), exc=frappe.DoesNotExistError)

    for timesheet in timesheets:
        if str(timesheet.start_date) not in dates:
            continue
        doc = frappe.get_doc("Timesheet", timesheet.name)
        doc.flags.ignore_permissions = is_timesheet_manager()
        doc.custom_approval_status = status
        doc.save()
        if status == "Approved":
            doc.submit()

    update_weekly_status_of_timesheet(employee, current_week.get("start_date"))
    trigger_notification_for_approved_or_rejected_timesheet(status, employee, dates, note)
    return _("Timesheet status updated successfully")


def filter_employee_by_timesheet_status(
    employee_name=None,
    department=None,
    project=None,
    page_length=10,
    start=0,
    user_group=None,
    timesheet_status=None,
    reports_to: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status=None,
):
    """
    This wrapper method to filter the employees based on the certain filters.
    For example, when the timesheet_status is provided,
    it will filter the employees based on the timesheet status. After filtering the employees,
    it will return the employees and the count of the employees using the `filter_employees` method.
    """

    start = int(start)
    page_length = int(page_length)

    if not timesheet_status:
        employees, count = filter_employees(
            employee_name,
            department,
            project,
            status=status,
            page_length=page_length,
            start=start,
            user_group=user_group,
            reports_to=reports_to,
        )

        return employees, count

    if timesheet_status and isinstance(timesheet_status, str):
        timesheet_status = json.loads(timesheet_status)

    timesheet = frappe.qb.DocType("Timesheet")
    # get the list of the employees from the timesheet based on the timesheet status.
    employees = (
        frappe.qb.from_(timesheet)
        .select("employee")
        .where(timesheet.start_date >= getdate(start_date))
        .where(timesheet.end_date <= getdate(end_date))
        .where(timesheet.custom_weekly_approval_status.isin(timesheet_status))
        .groupby("employee")
    ).run(as_dict=True)

    if not employees:
        return [], 0
    employees = [emp.employee for emp in employees]
    employees = employees[start : start + page_length]

    employees, count = filter_employees(
        ids=employees,
        department=department,
        project=project,
        status=status,
        page_length=page_length,
        start=start,
        user_group=user_group,
        reports_to=reports_to,
    )

    if start + page_length > count:
        page_length = count - start

    return employees, count


def trigger_notification_for_approved_or_rejected_timesheet(
    status: str, employee: str, dates: list[str] | None = None, note: str = ""
):
    if status not in ["Approved", "Rejected"]:
        return
    if status == "Approved":
        template = frappe.db.get_single_value("Timesheet Settings", "timesheet_approval_template")
    else:
        template = frappe.db.get_single_value("Timesheet Settings", "timesheet_rejection_template")

    if not template:
        return
    template = frappe.get_doc("Email Template", template)
    employee = frappe.get_doc("Employee", employee)
    email_message = ""
    if template.use_html:
        email_message = template.response_html
    else:
        email_message = template.response

    email_subject = template.subject
    args = {
        "employee": employee,
        "note": note,
        "dates": dates,
        "updated_by": frappe.get_value("User", frappe.session.user, "full_name"),
    }
    message = frappe.render_template(email_message, args)
    subject = frappe.render_template(email_subject, args)
    frappe.sendmail(recipients=employee.user_id, subject=subject, message=message)
