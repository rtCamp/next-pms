def on_update(doc, method=None):
    import frappe
    import frappe.share
    from frappe import get_value

    employee_set = set()
    for team in doc.custom_project_billing_team:
        employee_set.add(team.employee)

    if not employee_set:
        return
    for employee in employee_set:
        user = get_value("Employee", employee, "user_id")
        already_shared = frappe.db.exists(
            "DocShare",
            {"user": user, "share_name": doc.name, "share_doctype": "Project"},
        )
        if not user or already_shared:
            continue
        frappe.share.add_docshare("Project", doc.name, user=user)
