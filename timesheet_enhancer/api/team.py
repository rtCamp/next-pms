import frappe
from frappe.utils import nowdate
from frappe.utils.data import add_days, getdate

from .utils import get_employee_working_hours, get_week_dates

now = nowdate()


@frappe.whitelist()
def get_compact_view_data(
    date: str,
    max_week: int = 2,
    employee_name=None,
    department=None,
    project=None,
    page_length=10,
    start=0,
):
    from .utils import filter_employees, get_leaves_for_employee

    employees, total_count = filter_employees(
        employee_name, department, project, page_length=page_length, start=start
    )
    dates = []
    data = {}

    for i in range(max_week):
        current_week = True if date == now else False
        week = get_week_dates(date=date, current_week=current_week)
        dates.append(week)
        date = add_days(getdate(week["start_date"]), -1)
    dates.reverse()
    data = {}
    res = {"dates": dates}

    for employee in employees:
        working_hours = get_employee_working_hours(employee.name)
        local_data = {**employee, **working_hours}
        is_approved = frappe.db.count(
            "Timesheet",
            {
                "employee": employee.name,
                "custom_approval_status": "Approved",
                "start_date": [">=", dates[0].get("start_date")],
                "end_date": ["<=", dates[-1].get("end_date")],
            },
        )
        is_pending = frappe.db.count(
            "Timesheet",
            {
                "employee": employee.name,
                "custom_approval_status": "Approval Pending",
                "start_date": [">=", dates[0].get("start_date")],
                "end_date": ["<=", dates[-1].get("end_date")],
            },
        )
        local_data["status"] = is_approved > is_pending and "Approved" or "Pending"
        if is_approved == 0 and is_pending == 0:
            local_data["status"] = "Not Submitted"
        local_data["data"] = []

        for date_info in dates:
            leaves = get_leaves_for_employee(
                from_date=date_info.get("start_date"),
                to_date=date_info.get("end_date"),
                employee=employee.name,
            )

            for date in date_info.get("dates"):
                hour = 0
                leave = list(
                    filter(
                        lambda data: data["from_date"] <= date <= data["to_date"],
                        leaves,
                    )
                )

                total_hours = frappe.get_value(
                    "Timesheet",
                    {
                        "employee": employee.name,
                        "start_date": date,
                        "end_date": date,
                    },
                    "total_hours",
                )
                if leave:
                    leave = leave[0]
                    if leave.get("half_day") and leave.get("half_day_date") == date:
                        hour += 4
                    else:
                        hour += 8

                if total_hours:
                    hour += total_hours

                local_data["data"].append(
                    {
                        "date": date,
                        "hour": hour,
                    }
                )
        data[employee.name] = local_data

    res["data"] = data
    res["total_count"] = total_count
    res["has_more"] = True if int(start) + int(page_length) < total_count else False
    return res


@frappe.whitelist()
def get_timesheet_for_employee(employee: str, date: str):
    from timesheet_enhancer.api.timesheet import get_timesheet_data

    date = getdate(date)
    return get_timesheet_data(employee=employee, start_date=date, max_week=1)


@frappe.whitelist()
def update_timesheet_status(start_date: str, end_date: str, employee: str, status: str):
    timesheets = frappe.get_all(
        "Timesheet",
        {
            "employee": employee,
            "start_date": [">=", start_date],
            "end_date": ["<=", end_date],
        },
        ["name"],
    )
    if not timesheets:
        return frappe._("No timesheet found for the given date range.")

    for timesheet in timesheets:
        doc = frappe.get_doc("Timesheet", timesheet.name)
        doc.custom_approval_status = status
        doc.save()
        doc.submit()
    return frappe._("Timesheet status updated successfully")
