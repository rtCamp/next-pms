import frappe
from frappe.utils import add_days, datetime, getdate
from hrms.hr.utils import get_holiday_list_for_employee

from next_pms.timesheet.api.employee import get_employee_daily_working_norm


def send_reminder():
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
    )

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    for employee in employees:
        daily_norm = get_employee_daily_working_norm(employee.name)
        if is_holiday_or_leave(date, employee.name, daily_norm):
            continue
        hour = reported_time_by_employee(employee.name, date, daily_norm)
        if hour >= daily_norm:
            continue
        user = employee.user_id
        args = {
            "date": date,
            "employee": employee,
            "hour": hour,
            "daily_norm": daily_norm,
        }
        message = frappe.render_template(email_message, args)
        subject = frappe.render_template(email_subject, args)
        send_mail(user, subject, message)


def send_mail(recipients, subject, message):
    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def reported_time_by_employee(employee: str, date: datetime.date, daily_norm: int) -> int:
    total_hours = 0
    leave_info = get_leave_info(employee, date, daily_norm)
    total_hours += leave_info.get("hours")
    if_exists = frappe.db.exists(
        "Timesheet",
        {
            "employee": employee,
            "start_date": date,
        },
    )
    if not if_exists:
        return total_hours

    timesheets = frappe.get_all(
        "Timesheet",
        filters={
            "employee": employee,
            "start_date": date,
            "end_date": date,
        },
        fields=["total_hours"],
    )
    total_hours += sum(timesheet.total_hours for timesheet in timesheets)
    return total_hours


def is_holiday_or_leave(date: datetime.date, employee: str, daily_norm: int) -> bool:
    holiday_list = get_holiday_list_for_employee(employee)
    is_holiday = frappe.db.exists(
        "Holiday",
        {
            "holiday_date": date,
            "parent": holiday_list,
        },
    )
    if is_holiday:
        return True
    leave_info = get_leave_info(employee, date, daily_norm)
    is_leave = leave_info.get("is_leave")
    is_half_day = leave_info.get("is_half_day")
    if is_leave and not is_half_day:
        return True
    return False


def get_leave_info(employee: str, date: datetime.date, daily_norm: int) -> bool:
    leaves = frappe.get_all(
        "Leave Application",
        filters={
            "employee": employee,
            "from_date": ["<=", date],
            "to_date": [">=", date],
            "status": ["in", ["Open", "Approved"]],
        },
        fields=["name", "half_day", "half_day_date"],
    )

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
