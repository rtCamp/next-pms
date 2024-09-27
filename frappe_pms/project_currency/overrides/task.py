import frappe
from erpnext.projects.doctype.task.task import Task


class TaskOverride(Task):
    def update_time_and_costing(self):
        # Updated sql query to consider draft and submitted timesheets
        tl = frappe.db.sql(
            """select min(from_time) as start_date, max(to_time) as end_date,
            sum(billing_amount) as total_billing_amount, sum(costing_amount) as total_costing_amount,
            sum(hours) as time from `tabTimesheet Detail` where task = %s and (docstatus=1 or docstatus=0)""",
            self.name,
            as_dict=1,
        )[0]
        if self.status == "Open":
            self.status = "Working"
        self.total_costing_amount = tl.total_costing_amount
        self.total_billing_amount = tl.total_billing_amount
        self.actual_time = tl.time
        self.act_start_date = tl.start_date
        self.act_end_date = tl.end_date
