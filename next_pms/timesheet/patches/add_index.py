def execute():
    import frappe

    frappe.db.add_index("Timesheet", ["start_date", "end_date"])

    frappe.db.add_index("Employee", ["employee_name"])
    frappe.db.add_index("Employee", ["user_id"])
