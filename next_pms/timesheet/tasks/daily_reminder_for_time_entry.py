import frappe
from frappe.utils import add_days, datetime, getdate


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
        fields=["name", "employee_name", "user_id", "holiday_list", "custom_working_hours", "custom_work_schedule"],
    )

    if not employees:
        return

    email_message = ""
    if reminder_template.use_html:
        email_message = reminder_template.response_html
    else:
        email_message = reminder_template.response

    email_subject = reminder_template.subject

    employee_names = [e.name for e in employees]

    # Batch fetch all holiday lists
    holiday_lists = set(e.holiday_list for e in employees if e.holiday_list)
    holidays_on_date = set()
    if holiday_lists:
        holidays = frappe.get_all(
            "Holiday",
            filters={"parent": ["in", list(holiday_lists)], "holiday_date": date},
            pluck="parent",
        )
        holidays_on_date = set(holidays)

    # Batch fetch leaves for all employees on this date
    leave_map = {}
    leaves = frappe.db.sql(
        """
        SELECT employee, half_day, half_day_date
        FROM `tabLeave Application`
        WHERE %(date)s BETWEEN from_date AND to_date
        AND employee IN %(employees)s
        AND status IN ('Approved', 'Open')
        """,
        {"date": date, "employees": employee_names},
        as_dict=True,
    )

    for leave in leaves:
        if leave.employee not in leave_map:
            leave_map[leave.employee] = []
        leave_map[leave.employee].append(leave)

    # Batch fetch timesheets for all employees on this date
    timesheets = frappe.get_all(
        "Timesheet",
        filters={"employee": ["in", employee_names], "start_date": date, "end_date": date},
        fields=["employee", "total_hours"],
    )
    timesheet_map = {}
    for ts in timesheets:
        if ts.employee not in timesheet_map:
            timesheet_map[ts.employee] = 0
        timesheet_map[ts.employee] += ts.total_hours

    # Now process employees without additional queries
    for employee in employees:
        daily_norm = calculate_daily_norm(employee)

        # Check holiday
        if employee.holiday_list in holidays_on_date:
            continue

        # Check leave
        emp_leaves = leave_map.get(employee.name, [])
        is_full_day_leave = False
        leave_hours = 0
        for leave in emp_leaves:
            if leave.half_day and getdate(leave.half_day_date) == date:
                leave_hours += daily_norm / 2
            else:
                is_full_day_leave = True
                break

        if is_full_day_leave:
            continue

        # Calculate reported hours
        total_hours = leave_hours + timesheet_map.get(employee.name, 0)
        if total_hours >= daily_norm:
            continue

        # Send reminder
        user = employee.user_id
        args = {
            "date": date,
            "employee": employee,
            "hour": total_hours,
            "daily_norm": daily_norm,
        }
        message = frappe.render_template(email_message, args)
        subject = frappe.render_template(email_subject, args)
        send_mail(user, subject, message)


def send_mail(recipients, subject, message):
    frappe.sendmail(recipients=recipients, subject=subject, message=message)


def calculate_daily_norm(employee):
    """Calculate daily norm from already-fetched employee fields."""
    working_hour = employee.custom_working_hours or 8
    working_frequency = employee.custom_work_schedule or "Per Day"
    if working_frequency != "Per Day":
        return working_hour / 5
    return working_hour
