# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

from next_pms.resource_management.doctype.resource_allocation.resource_allocation import clear_cache


class TimesheetSettings(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        from next_pms.resource_management.doctype.employee_department.employee_department import EmployeeDepartment
        from next_pms.timesheet.doctype.timesheet_department.timesheet_department import TimesheetDepartment
        from next_pms.timesheet.doctype.timesheet_role.timesheet_role import TimesheetRole

        allocation_email_template: DF.Link | None
        allow_backdated_entries: DF.Check
        allow_backdated_entries_till_employee: DF.Int
        allow_backdated_entries_till_manager: DF.Int
        allow_future_entries: DF.Check
        allow_weekend_entries: DF.Check
        allowed_departments: DF.TableMultiSelect[TimesheetDepartment]
        approval_request_reminder_template: DF.Link | None
        auto_expand_weeks_by_default: DF.Int
        daily_reminder_template: DF.Link | None
        day_to_send_reminder: DF.Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        default_currency: DF.Link | None
        designations: DF.TableMultiSelect[EmployeeDepartment]
        ignored_role: DF.TableMultiSelect[TimesheetRole]
        pm_report_api_key: DF.Password | None
        remind_on: DF.Literal["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        send_daily_reminder: DF.Check
        send_missing_allocation_reminder: DF.Check
        send_reminder_on_approval_request: DF.Check
        send_weekly_approval_reminder: DF.Check
        timesheet_approval_template: DF.Link | None
        timesheet_rejection_template: DF.Link | None
        weekly_approval_reminder_template: DF.Link | None
    # end: auto-generated types

    def on_update(self):
        if self.has_value_changed("default_currency"):
            # The resource management views cache their payload with the rates already
            # restated in this currency, so a stale cache keeps serving the old one.
            clear_cache()
