import frappe
from erpnext import get_company_currency
from erpnext.projects.doctype.timesheet.timesheet import Timesheet
from erpnext.setup.utils import get_exchange_rate
from frappe.utils.data import flt, nowdate

from next_pms.utils.employee import get_employee_salary


class TimesheetOverwrite(Timesheet):
    ignore_backdated_validation = False

    def calculate_hours(self):
        return

    def update_billing_hours(self, args):
        if args.is_billable:
            if flt(args.billing_hours) > flt(args.hours):
                frappe.msgprint(
                    frappe._("Warning - Row {0}: Billing Hours are more than Actual Hours").format(args.idx),
                    indicator="orange",
                    alert=True,
                )
            args.billing_hours = args.hours
        else:
            args.billing_hours = 0

    def validate_time_logs(self):
        if not self.get("time_logs"):
            return
        for data in self.get("time_logs"):
            self.update_billing_hours(data)
            self.validate_overlap(data)
            self.set_project(data)
            self.validate_project(data)

    def validate_mandatory_fields(self):
        for data in self.time_logs:
            if not data.from_time and not data.to_time:
                frappe.throw(frappe._("Row {0}: From Time and To Time is mandatory.").format(data.idx))

            if flt(data.hours) == 0.0:
                frappe.throw(frappe._("Row {0}: Hours value must be greater than zero.").format(data.idx))

    def update_cost(self):
        if not self.parent_project:
            return frappe.throw(frappe._("The timesheet does not include the project. Project is mandatory."))

        self.customer = frappe.db.get_value("Project", self.parent_project, "customer")

        self.company = frappe.db.get_value("Project", self.parent_project, "company")

        # if not self.company:
        #     self.company = frappe.db.get_value("Employee", self.employee, "company")

        if self.customer:
            self.currency = frappe.db.get_value("Customer", self.customer, "default_currency")
            self.exchange_rate = get_exchange_rate(
                self.currency,
                frappe.defaults.get_global_default("currency"),
                self.start_date,
            )
        elif self.company:
            self.currency = get_company_currency(self.company)
            self.exchange_rate = get_exchange_rate(
                self.currency,
                frappe.defaults.get_global_default("currency"),
                self.start_date,
            )

        custom_billing_type = frappe.db.get_value("Project", self.parent_project, "custom_billing_type")

        for data in self.time_logs:
            costing_rate = self.get_activity_costing_rate(currency=self.currency)
            base_costing_rate = self.get_activity_costing_rate(currency=frappe.defaults.get_global_default("currency"))
            costing_hours = data.billing_hours or data.hours or 0

            if costing_rate:
                data.costing_rate = costing_rate
                data.costing_amount = data.costing_rate * costing_hours

            if base_costing_rate:
                data.base_costing_rate = base_costing_rate
                data.base_costing_amount = data.base_costing_rate * costing_hours

            if data.activity_type or data.is_billable:
                hours = data.billing_hours or 0

                billing_rate = self.get_activity_billing_rate(
                    currency=self.currency, custom_billing_type=custom_billing_type
                )

                base_billing_rate = self.get_activity_billing_rate(
                    currency=frappe.defaults.get_global_default("currency"),
                    custom_billing_type=custom_billing_type,
                )

                if billing_rate == "Take Costing Rate":
                    billing_rate = 3 * costing_rate
                    base_billing_rate = 3 * base_costing_rate

                if billing_rate or custom_billing_type == "Time and Material":
                    data.billing_rate = billing_rate
                    data.billing_amount = data.billing_rate * hours
                if base_billing_rate or custom_billing_type == "Time and Material":
                    data.base_billing_rate = base_billing_rate
                    data.base_billing_amount = data.base_billing_rate * hours

            if not data.is_billable:
                data.billing_rate = 0
                data.billing_amount = 0
                data.base_billing_rate = 0
                data.base_billing_amount = 0

    def get_activity_costing_rate(self, currency=None):
        if not self.parent_project:
            return frappe.throw(frappe._("Project is not defined in Timesheet."))

        employee_salary, employee_currency = 0, ""
        #  DO NOT REMOVE
        #  Below code is used to fetch the employee's salary based on the timesheet's date,
        #  this is to ensure that costing is calculated based on the employee's salary at the time of the timesheet creation important for historical accuracy.
        employee_promotion = frappe.db.get_all(
            "Employee Promotion",
            {
                "employee": self.employee,
                "docstatus": 1,
                "promotion_date": ["<=", self.start_date],
                "revised_ctc": ["is", "set"],
            },
            ["salary_currency", "revised_ctc"],
            order_by="promotion_date desc",
        )

        if len(employee_promotion) == 0:
            employee = frappe.get_doc(
                "Employee",
                self.employee,
                ["ctc", "salary_currency"],
            )
            employee_salary = employee.ctc
            employee_currency = employee.salary_currency
        else:
            employee_promotion = employee_promotion[0]
            employee_salary = employee_promotion.revised_ctc
            employee_currency = employee_promotion.salary_currency

        return get_employee_costing_rate(self.employee, employee_currency, employee_salary, currency, self.start_date)

    def get_activity_billing_rate(self, currency=None, valid_from_date=None, custom_billing_type=None):
        if not self.parent_project:
            return frappe.throw(frappe._("Project is not defined in Timesheet."))

        if custom_billing_type != "Time and Material":
            custom_default_hourly_billing_rate = frappe.db.get_value(
                "Project", self.parent_project, "custom_default_hourly_billing_rate"
            )

            if not custom_default_hourly_billing_rate:
                return "Take Costing Rate"

            employee_project_billing_hourly_billing_rate = custom_default_hourly_billing_rate

            return get_employee_billing_rate(
                employee_project_billing_hourly_billing_rate,
                frappe.db.get_value("Project", self.parent_project, "custom_currency"),
                currency,
                self.start_date,
            )

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

        employee_project_billing_hourly_billing_rate = 0

        if len(employee_project_billing) == 0:
            custom_default_hourly_billing_rate = frappe.db.get_value(
                "Project", self.parent_project, "custom_default_hourly_billing_rate"
            )

            if not custom_default_hourly_billing_rate:
                return "Take Costing Rate"
            else:
                employee_project_billing_hourly_billing_rate = custom_default_hourly_billing_rate
        else:
            employee_project_billing = employee_project_billing[0]
            employee_project_billing_hourly_billing_rate = employee_project_billing.hourly_billing_rate

        return get_employee_billing_rate(
            employee_project_billing_hourly_billing_rate,
            frappe.db.get_value("Project", self.parent_project, "custom_currency"),
            currency,
            self.start_date,
            check_validation=len(employee_project_billing) == 0,
        )


def get_employee_billing_rate(
    project_hourly_billing_rate: float,
    project_currency: str,
    timesheet_currency: str,
    start_date: str = None,
    check_validation: bool = True,
):
    billing_rate = project_hourly_billing_rate
    currency = project_currency

    if not billing_rate and check_validation:
        return frappe.throw(
            frappe._("Project billing rates are not set. Please contact the Project Manager for assistance.")
        )

    if currency != timesheet_currency:
        rate = get_exchange_rate(currency, timesheet_currency, start_date)
        return billing_rate * (rate or 1)

    return billing_rate


def get_employee_costing_rate(employee: str, salary_currency: float, ctc: float, currency: str, start_date: any):
    if not salary_currency:
        return frappe.throw(frappe._("Please set salary currency for the employee."))
    salary = get_employee_salary(
        employee=employee,
        to_currency=currency,
        salary_currency=salary_currency,
        ctc=ctc,
        date=start_date,
    )
    costing_rate = salary.get("hourly_salary")

    if not costing_rate:
        return frappe.throw(
            frappe._("Project costing rates are not set. Please contact the Project Manager for assistance.")
        )

    return costing_rate
