def execute():
    import frappe

    frappe.db.add_index("Timesheet", ["start_date", "custom_weekly_approval_status"])
    frappe.db.add_index("Timesheet", ["employee", "start_date"])

    frappe.db.add_index("Timesheet", ["start_date", "end_date"])
    frappe.db.add_index("Employee", ["employee_name"])
