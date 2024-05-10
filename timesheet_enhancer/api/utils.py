import frappe


@frappe.whitelist()
def get_employee_from_user(user: str = None):
    if not user:
        user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})

    if not employee:
        frappe.throw("Employee not found")
    return employee
