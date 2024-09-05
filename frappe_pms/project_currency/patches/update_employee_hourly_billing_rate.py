import frappe

from frappe_pms.project_currency.overrides.timesheet import (
    calculate_monthly_and_hourly_salary,
)


def execute():
    employee_list = frappe.get_all(
        "Employee",
        filters={"custom_hourly_billing_rate": ["=", 0], "ctc": [">", 0]},
        fields=["name", "ctc"],
    )

    for employee in employee_list:
        # Update the billing rate for the employee with 3x ctc for hourly
        frappe.db.set_value(
            "Employee",
            employee.name,
            "custom_hourly_billing_rate",
            calculate_monthly_and_hourly_salary(employee.ctc).get("hourly_salary") * 3,
        )
