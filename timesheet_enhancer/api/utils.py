import frappe


@frappe.whitelist()
def get_employee_from_user(user: str = None):
    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})

    if not employee:
        frappe.throw(frappe._("Employee not found"))
    return employee
