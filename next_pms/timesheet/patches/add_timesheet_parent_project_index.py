def execute():
    import frappe

    frappe.db.add_index("Timesheet", ["parent_project"])
