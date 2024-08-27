import frappe
from frappe.utils import nowdate
from frappe.utils.data import add_days, getdate
from hrms.hr.utils import get_holiday_dates_for_employee

from .timesheet import get_timesheet_state
from .utils import get_employee_working_hours, get_week_dates

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
):
    import json

    from .utils import filter_employees, get_leaves_for_employee

    employees, total_count = filter_employees(
        employee_name,
        department,
        project,
        user_group=user_group,
        page_length=page_length,
        start=start,
    )
    dates = []
    data = {}
    if status_filter and isinstance(status_filter, str):
        status_filter = json.loads(status_filter)

    for i in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)
    dates.reverse()
    res = {"dates": dates}

    employee_names = [employee.name for employee in employees]
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

    timesheet_map = {}
    for ts in timesheet_data:
        if ts.employee not in timesheet_map:
            timesheet_map[ts.employee] = []
        timesheet_map[ts.employee].append(ts)

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        local_data = {**employee, **working_hours}
        employee_timesheets = timesheet_map.get(employee.name, [])

        status = get_timesheet_state(
            employee=employee.name,
            dates=[dates[0].get("start_date"), dates[-1].get("end_date")],
        )

        local_data["status"] = status
        local_data["data"] = []

        leaves = get_leaves_for_employee(
            from_date=add_days(dates[0].get("start_date"), -max_week * 7),
            to_date=add_days(dates[-1].get("end_date"), max_week * 7),
            employee=employee.name,
        )
        holidays = get_holiday_dates_for_employee(
            employee.name,
            start_date=dates[0].get("start_date"),
            end_date=dates[-1].get("end_date"),
        )
        holidays = [getdate(holiday) for holiday in holidays]
        for date_info in dates:
            for date in date_info.get("dates"):
                hour = 0
                on_leave = False
                leave = next(
                    (l for l in leaves if l["from_date"] <= date <= l["to_date"]), None
                )

                if leave:
                    if leave.get("half_day") and leave.get("half_day_date") == date:
                        hour += 4
                    else:
                        hour += 8
                    on_leave = True

                if date in holidays:
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

        if status_filter and local_data["status"] in status_filter:
            data[employee.name] = local_data

        if not status_filter:
            data[employee.name] = local_data

    res["data"] = data
    res["total_count"] = len(data)
    res["has_more"] = int(start) + int(page_length) < total_count
    return res


@frappe.whitelist()
def get_timesheet_for_employee(employee: str, date: str):
    from timesheet_enhancer.api.timesheet import get_timesheet_data

    date = getdate(date)
    return get_timesheet_data(employee=employee, start_date=date, max_week=1)


@frappe.whitelist()
def update_timesheet_status(
    employee: str, status: str, dates: list[str] | str | None = None, note: str = ""
):
    import json

    if isinstance(dates, str):
        dates = json.loads(dates)

    timesheets = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", dates[0]],
            "end_date": ["<=", dates[-1]],
            "docstatus": ["=", 0],
        },
        ["name"],
    )
    if not timesheets:
        return frappe._("No timesheet found for the given date range.")

    for timesheet in timesheets:
        doc = frappe.get_doc("Timesheet", timesheet.name)
        doc.custom_approval_status = status
        doc.save()
        if status == "Approved":
            doc.submit()
        if note:
            doc.add_comment(text=note)

    return frappe._("Timesheet status updated successfully")
