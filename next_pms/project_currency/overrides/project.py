import frappe
from erpnext import get_company_currency
from erpnext.setup.utils import get_exchange_rate
from frappe import _
from frappe.query_builder.functions import Max, Min, Sum
from frappe.utils import flt
from hrms.overrides.employee_project import EmployeeProject


class ProjectOverwrite(EmployeeProject):
    def validate(self):
        super().validate()
        self.update_project_currency()
        self.validate_overlap_project_billing()
        self.validate_overlap_project_budget()

    def update_project_currency(self):
        if self.customer:
            self.custom_currency = frappe.db.get_value("Customer", self.customer, "default_currency")
        elif self.company:
            self.custom_currency = get_company_currency(self.company)

    def validate_overlap_project_billing(self):
        custom_project_billing_team = self.custom_project_billing_team

        for index in range(len(custom_project_billing_team)):
            for index2 in range(index + 1, len(custom_project_billing_team)):
                if custom_project_billing_team[index].employee == custom_project_billing_team[index2].employee:
                    if custom_project_billing_team[index].valid_from == custom_project_billing_team[index2].valid_from:
                        frappe.throw(
                            "Employee {} has overlapping date range in Project Billing Team".format(
                                custom_project_billing_team[index].employee
                            )
                        )

    def validate_overlap_project_budget(self):
        custom_project_budget_hours = self.custom_project_budget_hours

        for index in range(len(custom_project_budget_hours)):
            if custom_project_budget_hours[index].start_date > custom_project_budget_hours[index].end_date:
                frappe.throw(_("End date should be greater than start date in project budget."))

        for index in range(len(custom_project_budget_hours)):
            for index2 in range(index + 1, len(custom_project_budget_hours)):
                if (
                    custom_project_budget_hours[index].start_date
                    <= custom_project_budget_hours[index2].start_date
                    <= custom_project_budget_hours[index].end_date
                ):
                    frappe.throw(_("Budget has an overlapping date range in project budget."))

    def update_costing(self):
        TimesheetDetail = frappe.qb.DocType("Timesheet Detail")
        from_time_sheet = (
            frappe.qb.from_(TimesheetDetail)
            .select(
                Sum(TimesheetDetail.costing_amount).as_("costing_amount"),
                Sum(TimesheetDetail.billing_amount).as_("billing_amount"),
                Min(TimesheetDetail.from_time).as_("start_date"),
                Max(TimesheetDetail.to_time).as_("end_date"),
                Sum(TimesheetDetail.hours).as_("time"),
            )
            .where(TimesheetDetail.project == self.name)
            .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
        ).run(as_dict=True)[0]

        self.actual_start_date = from_time_sheet.start_date
        self.actual_end_date = from_time_sheet.end_date

        self.total_costing_amount = from_time_sheet.costing_amount
        self.total_billable_amount = from_time_sheet.billing_amount
        self.actual_time = from_time_sheet.time

        self.update_purchase_costing()
        self.update_sales_amount()
        self.update_billed_amount()
        self.calculate_gross_margin()
        self.update_expense_claim()

        if self.custom_billing_type == "Fixed Cost":
            self.update_project_cost_rate()

        if self.custom_billing_type == "Retainer" or self.custom_billing_type == "Fixed Cost":
            self.update_retainer_project_budget()

        self.calculate_estimated_profit()

    def update_sales_amount(self):
        # nosemgrep
        total_sales_amount = frappe.db.sql(
            """select sum(net_total)
            from `tabSales Order` where project = %s and docstatus=1""",
            self.name,
        )

        self.total_sales_amount = total_sales_amount and total_sales_amount[0][0] or 0

    def update_billed_amount(self):
        # nosemgrep
        total_billed_amount = frappe.db.sql(
            """select sum(net_total)
            from `tabSales Invoice` where project = %s and docstatus=1""",
            self.name,
        )

        self.total_billed_amount = total_billed_amount and total_billed_amount[0][0] or 0

    def update_purchase_costing(self):
        total_purchase_cost = frappe.db.get_all(
            "Purchase Invoice",
            filters={"project": self.name, "docstatus": 1},
            fields=["net_total", "currency", "posting_date"],
        )

        total_amount = 0

        for purchase_cost in total_purchase_cost:
            rate = get_exchange_rate(
                from_currency=purchase_cost.currency,
                to_currency=self.custom_currency,
                transaction_date=purchase_cost.posting_date,
            )

            total_amount += purchase_cost.net_total * rate

        self.total_purchase_cost = total_amount

    def update_expense_claim(self):
        total_expense_claim = frappe.db.get_all(
            "Expense Claim",
            filters={"project": self.name, "docstatus": 1},
            fields=["total_sanctioned_amount", "company", "posting_date"],
        )

        total_amount = 0

        for expense_claim in total_expense_claim:
            rate = get_exchange_rate(
                from_currency=get_company_currency(company=expense_claim.company),
                to_currency=self.custom_currency,
                transaction_date=expense_claim.posting_date,
            )

            total_amount += expense_claim.total_sanctioned_amount * rate

        self.total_expense_claim = total_amount

    def update_retainer_project_budget(self):
        custom_project_budget_hours = self.custom_project_budget_hours

        self.custom_total_hours_purchased = 0
        self.custom_total_hours_remaining = 0

        for budget in custom_project_budget_hours:
            TimesheetDetail = frappe.qb.DocType("Timesheet Detail")
            from_time_sheet = (
                frappe.qb.from_(TimesheetDetail)
                .select(
                    Sum(TimesheetDetail.billing_hours).as_("time"),
                )
                .where(TimesheetDetail.project == self.name)
                .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
                .where(TimesheetDetail.from_time >= budget.start_date)
                .where(TimesheetDetail.to_time <= budget.end_date)
            ).run(as_dict=True)[0]
            if not from_time_sheet.time:
                from_time_sheet.time = 0
            budget.consumed_hours = from_time_sheet.time
            budget.remaining_hours = budget.hours_purchased - from_time_sheet.time

            self.custom_total_hours_purchased += budget.hours_purchased
            self.custom_total_hours_remaining += budget.remaining_hours

    def update_project_cost_rate(self):
        if self.estimated_costing and self.total_costing_amount:
            self.custom_percentage_estimated_cost = self.total_costing_amount * 100 / self.estimated_costing

    def calculate_estimated_profit(self):
        expense_amount = (
            flt(self.total_costing_amount)
            # add expense claim amount
            + flt(self.total_expense_claim)
            + flt(self.total_purchase_cost)
            + flt(self.get("total_consumed_material_cost", 0))
        )

        total_amount = flt(self.estimated_costing) + flt(self.total_sales_amount)

        self.custom_estimated_profit = total_amount - expense_amount
        if total_amount:
            self.custom_percentage_estimated_profit = (self.custom_estimated_profit / total_amount) * 100


@frappe.whitelist()
def recalculate_project_total_purchase_cost(project: str | None = None):
    if project:
        project = frappe.get_doc("Project", project)
        project.update_purchase_costing()
