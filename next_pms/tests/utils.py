import frappe
from erpnext import get_default_company
from frappe.utils import add_days, nowdate


def make_holiday_list(name, from_date=None, to_date=None, holiday_dates=None):
    if from_date is None:
        from_date = add_days(nowdate(), -10)

    if to_date is None:
        to_date = nowdate()

    frappe.delete_doc_if_exists("Holiday List", name, force=1)
    return frappe.get_doc(
        {
            "doctype": "Holiday List",
            "holiday_list_name": name,
            "from_date": from_date,
            "to_date": to_date,
            "holidays": holiday_dates,
        }
    ).insert()


def make_employee(user, company=None, **kwargs):
    holiday = make_holiday_list(
        "Test Holiday List", from_date=add_days(nowdate(), -365), to_date=add_days(nowdate(), 365)
    )
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
                "ctc": 100000,
                "salary_currency": "INR",
                "holiday_list": holiday.name,
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
