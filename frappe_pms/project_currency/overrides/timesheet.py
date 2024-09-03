import frappe
from erpnext import get_company_currency
from erpnext.projects.doctype.timesheet.timesheet import Timesheet
from erpnext.setup.utils import get_exchange_rate
from frappe.utils.data import flt, nowdate


class TimesheetOverwrite(Timesheet):

    def calculate_hours(self):
        return

    def validate_time_logs(self):
        if not self.get("time_logs"):
            return
        for data in self.get("time_logs"):
            self.validate_overlap(data)
            self.set_project(data)
            self.validate_project(data)

    def validate_mandatory_fields(self):
        for data in self.time_logs:
            if not data.from_time and not data.to_time:
                frappe.throw(
                    frappe._("Row {0}: From Time and To Time is mandatory.").format(
                        data.idx
                    )
                )

            if flt(data.hours) == 0.0:
                frappe.throw(
                    frappe._("Row {0}: Hours value must be greater than zero.").format(
                        data.idx
                    )
                )

    def update_cost(self):
        if not self.parent_project:
            return frappe.throw(
                "The timesheet does not include the project. Project is mandatory."
            )

        if not self.customer:
            self.customer = frappe.db.get_value(
                "Project", self.parent_project, "customer"
            )
            self.company = frappe.db.get_value(
                "Project", self.parent_project, "company"
            )
            if self.customer:
                self.currency = frappe.db.get_value(
                    "Customer", self.customer, "default_currency"
                )
                self.exchange_rate = get_exchange_rate(
                    self.currency, frappe.defaults.get_global_default("currency")
                )
            elif self.company:
                self.currency = get_company_currency(self.company)
                self.exchange_rate = get_exchange_rate(
                    self.currency, frappe.defaults.get_global_default("currency")
                )

        for data in self.time_logs:
            rate = self.get_activity_cost(
                currency=self.currency, valid_from_date=data.from_time
            )
            base_rate = self.get_activity_cost(
                currency=frappe.defaults.get_global_default("currency"),
                valid_from_date=data.from_time,
            )
            costing_hours = data.billing_hours or data.hours or 0

            if rate:
                data.costing_rate = rate.get("costing_rate")
                data.costing_amount = data.costing_rate * costing_hours

            if base_rate:
                data.base_costing_rate = base_rate.get("costing_rate")
                data.base_costing_amount = data.base_costing_rate * costing_hours

            if data.activity_type or data.is_billable:
                hours = data.billing_hours or 0
                if rate:
                    data.billing_rate = rate.get("billing_rate")
                    data.billing_amount = data.billing_rate * hours
                if base_rate:
                    data.base_billing_rate = base_rate.get("billing_rate")
                    data.base_billing_amount = data.base_billing_rate * hours

    def get_activity_cost(self, currency=None, valid_from_date=None):
        if not self.parent_project:
            return frappe.throw("Project is not defined in Timesheet.")

        if not valid_from_date:
            valid_from_date = nowdate()

        employee_project_billing = frappe.db.get_all(
            "Project Billing Team",
            {
                "employee": self.employee,
                "parent": self.parent_project,
                "valid_from": ["<=", valid_from_date],
            },
            ["hourly_billing_rate"],
            order_by="valid_from desc",
        )

        if len(employee_project_billing) == 0:
            return frappe.throw(
                "Invalid information for project billing. Please contact the Project Manager for assistance."
            )

        employee_project_billing = employee_project_billing[0]

        employee = frappe.get_doc(
            "Employee",
            self.employee,
            ["ctc", "custom_hourly_billing_rate", "salary_currency"],
        )

        costing_rate = get_employee_costing_rate(
            employee.salary_currency, employee.ctc, currency
        )

        billing_rate = get_employee_billing_rate(
            employee_project_billing.hourly_billing_rate,
            employee.custom_hourly_billing_rate,
            employee.salary_currency,
            frappe.db.get_value("Project", self.parent_project, "custom_currency"),
            currency,
        )

        return {"costing_rate": costing_rate, "billing_rate": billing_rate}


def get_employee_billing_rate(
    project_hourly_billing_rate: float,
    employee_custom_hourly_billing_rate: float,
    employee_salary_currency: str,
    project_currency: str,
    timesheet_currency: str,
):

    billing_rate = project_hourly_billing_rate
    currency = project_currency

    if not billing_rate:
        billing_rate = employee_custom_hourly_billing_rate
        currency = employee_salary_currency

    if not billing_rate:
        return frappe.throw(
            "Project billing rates are not set. Please contact the Project Manager for assistance."
        )

    if currency != timesheet_currency:
        rate = get_exchange_rate(currency, timesheet_currency)
        return billing_rate * rate

    return billing_rate


def get_employee_costing_rate(salary_currency: float, ctc: float, currency: float):
    if not salary_currency:
        return frappe.throw("Please set salary currency for the employee.")

    salary = calculate_monthly_and_hourly_salary(salary=ctc)
    costing_rate = salary.get("hourly_salary")

    if salary_currency != currency:
        rate = get_exchange_rate(salary_currency, currency)
        costing_rate = costing_rate * rate
    return costing_rate


def calculate_monthly_and_hourly_salary(salary: str = None):
    monthly_salary = salary / 12
    hourly_salary = monthly_salary / 160
    return {"monthly_salary": monthly_salary, "hourly_salary": hourly_salary}
