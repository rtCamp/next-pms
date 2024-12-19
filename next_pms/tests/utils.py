import frappe
from erpnext import get_default_company


def make_employee(user, company=None, **kwargs):
    if not frappe.db.get_value("User", user):
        frappe.get_doc(
            {
                "doctype": "User",
                "email": user,
                "first_name": user,
                "new_password": "password",
                "send_welcome_email": 0,
                "roles": [{"doctype": "Has Role", "role": "Employee"}],
            }
        ).insert()

    if not frappe.db.get_value("Employee", {"user_id": user}):
        employee = frappe.get_doc(
            {
                "doctype": "Employee",
                "naming_series": "EMP-",
                "first_name": user,
                "company": company or get_default_company(),
                "user_id": user,
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "department": frappe.get_all("Department", fields="name")[0].name,
                "gender": "Female",
                "company_email": user,
                "prefered_contact_email": "Company Email",
                "prefered_email": user,
                "status": "Active",
                "employment_type": "Intern",
            }
        )
        if kwargs:
            employee.update(kwargs)
        employee.insert()
        return employee.name
    else:
        employee = frappe.get_doc("Employee", {"employee_name": user})
        employee.update(kwargs)
        employee.status = "Active"
        employee.save()
        return employee.name
