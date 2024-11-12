import frappe
from frappe.utils import add_days, add_months, getdate, today
from frappe.utils.fixtures import sync_fixtures
from next_pms.timesheet.api.utils import update_weekly_status_of_timesheet


def execute():
    timesheet_meta = frappe.get_meta("Timesheet")

    if not timesheet_meta.has_field("custom_weekly_approval_status"):
        sync_fixtures()
    today_date = getdate(today())
    base_date = add_months(getdate(today_date), -2)
    employees = frappe.get_all("Employee", filters={"status": "Active"}, pluck="name")
    start_date = today_date
    while start_date > base_date:
        print(f"Updating weekly status for {start_date} date's week.")
        for employee in employees:
            update_weekly_status_of_timesheet(employee, date=start_date)
        start_date = add_days(start_date, -7)
