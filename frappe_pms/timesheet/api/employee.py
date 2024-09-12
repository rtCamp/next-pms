import frappe


@frappe.whitelist()
def get_employee_from_user(user=None):

    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user_id": user})

    if not employee:
        frappe.throw(frappe._("Employee not found"))
    return employee


def get_user_from_employee(employee: str):
    return frappe.get_value("Employee", employee, "user_id")


@frappe.whitelist()
def get_employee_working_hours(employee: str = None):
    if not employee:
        employee = get_employee_from_user()
    working_hour, working_frequency = frappe.get_value(
        "Employee",
        employee,
        ["custom_working_hours", "custom_work_schedule"],
    )
    if not working_hour:
        working_hour = frappe.db.get_single_value(
            "HR Settings", "standard_working_hours"
        )
    if not working_frequency:
        working_frequency = "Per Day"
    return {"working_hour": working_hour or 8, "working_frequency": working_frequency}


@frappe.whitelist()
def get_employee(filters=None, fieldname=None):
    import json

    if not fieldname:
        fieldname = ["name", "employee_name", "image"]

    if fieldname and isinstance(fieldname, str):
        fieldname = json.loads(fieldname)

    if filters and isinstance(filters, str):
        filters = json.loads(filters)

    return frappe.db.get_value(
        "Employee", filters=filters, fieldname=fieldname, as_dict=True
    )


@frappe.whitelist()
def get_employee_list(
    employee_name=None,
    department=None,
    project=None,
    page_length=None,
    start=0,
    user_group=None,
    ignore_permissions=False,
):
    from .utils import filter_employees

    employees, count = filter_employees(
        employee_name,
        department,
        project,
        page_length,
        start,
        user_group,
        ignore_permissions,
    )
    return {"data": employees, "count": count}
