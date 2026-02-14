import frappe
from frappe.utils import add_days, datetime, getdate

from next_pms.timesheet.api.employee import get_employee_daily_working_norm

BATCH_SIZE = 500
INITIAL_OFFSET = 0


def send_reminder(start=INITIAL_OFFSET, limit=BATCH_SIZE):
    current_date = getdate()
    date = add_days(current_date, -1)
    setting = frappe.get_doc("Timesheet Settings")
    send_reminder = setting.send_daily_reminder

    if not send_reminder:
        return
    reminder_template_name = setting.daily_reminder_template
    allowed_departments = [doc.department for doc in setting.allowed_departments]
    reminder_template = frappe.get_doc("Email Template", reminder_template_name)
    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active", "department": ["in", allowed_departments]},
        fields="*",
        limit=limit,
        start=start,
    )
    if not employees:
        return
    employee_names = [e.name for e in employees]
    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    holiday_names = set([e.holiday_list for e in employees if e.holiday_list])

    holiday_info = get_holidays(list(holiday_names), date)
    leaves = get_employee_leaves(employee_names, date)
    employee_hours = get_employee_hours(employee_names, date)

    for employee in employees:
        employee_hour = employee_hours.get(employee.name, 0)
        daily_norm = get_employee_daily_working_norm(employee.name)
        employee_leaves = leaves.get(employee.name, [])

        if is_holiday_or_leave(date, daily_norm, employee.holiday_list, holiday_info, employee_leaves):
            continue
        hour = reported_time_by_employee(date, daily_norm, employee_hour, employee_leaves)
        if hour >= daily_norm:
            continue
        user = employee.user_id
        args = {
            "date": date,
            "employee": employee,
            "hour": hour,
            "daily_norm": daily_norm,
        }
        message = frappe.render_template(email_message, args)  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti
        subject = frappe.render_template(email_subject, args)  # nosemgrep: frappe-semgrep.rules.security.frappe-ssti
        send_mail(user, subject, message)

    frappe.enqueue(
        "next_pms.timesheet.tasks.daily_reminder_for_time_entry.send_reminder",
        start=start + limit,
        limit=limit,
        queue="long",
    )


def send_mail(recipients, subject, message):
    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def get_employee_hours(employees: list[str], date: datetime.date):
    from frappe.query_builder.functions import Sum

    Timesheet = frappe.qb.DocType("Timesheet")
    query = (
        frappe.qb.from_(Timesheet)
        .select(Timesheet.employee, Sum(Timesheet.total_hours).as_("total_hours"))
        .where(
            (Timesheet.employee.isin(employees))
            & (Timesheet.start_date == date)
            & (Timesheet.end_date == date)
            & (Timesheet.docstatus.isin([0, 1]))
        )
        .groupby(Timesheet.employee)
    )
    result = query.run(as_dict=True)

    employee_hours = {row["employee"]: row["total_hours"] for row in result}
    return employee_hours


def reported_time_by_employee(date: datetime.date, daily_norm: int, hours: int = 0, leaves: list | None = None) -> int:
    total_hours = 0
    leave_info = get_leave_info(daily_norm, date, leaves)
    total_hours += leave_info.get("hours")
    total_hours += hours
    return total_hours


def get_holidays(holiday_names: list[str], date: datetime.date):
    return frappe.get_all(
        "Holiday",
        filters={
            "holiday_date": date,
            "parent": ["in", holiday_names],
        },
        fields=["name", "holiday_date", "parent"],
    )


def is_holiday_or_leave(
    date: datetime.date,
    daily_norm: int,
    holiday_name: str | None,
    holiday_info: list,
    employee_leaves: list,
) -> bool:
    if holiday_name:
        is_holiday = any(holiday.parent == holiday_name and holiday.holiday_date == date for holiday in holiday_info)
        if is_holiday:
            return True

    leave_info = get_leave_info(daily_norm, date, employee_leaves)
    is_leave = leave_info.get("is_leave")
    is_half_day = leave_info.get("is_half_day")
    if is_leave and not is_half_day:
        return True
    return False


def get_employee_leaves(employee: list[str], date: datetime.date) -> dict:
    leaves = frappe.db.get_all(
        "Leave Application",
        filters={
            "employee": ["in", employee],
            "status": ["in", ["Approved", "Open"]],
            "from_date": ["<=", date],
            "to_date": [">=", date],
        },
        fields=["half_day", "half_day_date"],
    )
    employee_leaves = {}
    for leave in leaves:
        emp = leave.employee
        if emp not in employee_leaves:
            employee_leaves[emp] = []
        employee_leaves[emp].append(leave)
    return employee_leaves


def get_leave_info(daily_norm: int, date: datetime.date, leaves: list | None = None) -> dict:
    if not leaves:
        return {"is_leave": False, "is_half_day": False, "hours": 0}
    leave_hours = 0
    for leave in leaves:
        if leave.half_day and getdate(leave.half_day_date) == date:
            leave_hours += daily_norm / 2
        else:
            leave_hours += daily_norm

    return {
        "is_leave": leave_hours > 0,
        "is_half_day": leave_hours < daily_norm,
        "hours": leave_hours,
    }
