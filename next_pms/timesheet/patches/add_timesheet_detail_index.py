def execute():
    import frappe

    frappe.db.add_index("Timesheet Detail", ["from_time"])
    frappe.db.add_index("Timesheet Detail", ["project", "from_time"])
