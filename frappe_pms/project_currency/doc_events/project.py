def onload(doc, method=None):
    update_budget_in_project(doc)
    doc.update_costing()
    doc.db_update()


def on_update(doc, method=None):
    share_project_with_employee(doc)
    update_budget_in_project(doc)


def update_budget_in_project(doc):
    doc.custom_budget_spent_in_hours = doc.actual_time
    if not doc.custom_budget_in_hours:
        return
    if not doc.custom_budget_spent_in_hours:
        doc.custom_budget_spent_in_hours = 0
    doc.custom_budget_remaining_in_hours = (
        doc.custom_budget_in_hours - doc.custom_budget_spent_in_hours
    )


def share_project_with_employee(doc):
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
