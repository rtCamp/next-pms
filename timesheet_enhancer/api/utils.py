import frappe


@frappe.whitelist()
def get_employee_from_user(user: str = None):
    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})

    if not employee:
        frappe.throw(frappe._("Employee not found"))
    return employee


def get_leaves_for_employee(from_date: str, to_date: str, employee: str):
    leave_application = frappe.qb.DocType("Leave Application")
    filtered_data = (
        frappe.qb.from_(leave_application)
        .select("*")
        .where(leave_application.employee == employee)
        .where(
            (leave_application.from_date >= from_date)
            & (leave_application.to_date <= to_date)
        )
        .where(leave_application.status.isin(["Open", "Approved"]))
    ).run(as_dict=True)

    return filtered_data
