# Copyright (c) 2025, rtCamp and contributors
# For license information, please see license.txt

from datetime import date

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe import _, get_all
from frappe.query_builder import DocType
from frappe.query_builder.functions import Sum
from frappe.utils import getdate
from pypika import Case

CURRENCY = "USD"


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters=filters)
    return columns, data


def get_data(filters=None):
    res = []
    start_date = getdate(filters.get("from"))
    end_date = getdate(filters.get("to"))

    # Create dynamic filters for project type and customer
    project_type_filter = {"name": filters.get("project_type")} if filters.get("project_type") else {}
    customer_filter = {"customer": filters.get("customer")} if filters.get("customer") else {}

    customers = list(set(get_all("Project", pluck="customer", filters={"customer": ["is", "set"], **customer_filter})))
    project_types = get_all("Project Type", pluck="name", filters=project_type_filter)

    projects = get_all(
        "Project",
        fields=["name", "project_name", "customer", "project_type"],
        filters={"customer": ["in", customers], "project_type": ["in", project_types]},
    )

    for customer in customers:
        for ptype in project_types:
            filter_projects = [p for p in projects if p.customer == customer and p.project_type == ptype]
            if not filter_projects:
                continue
            project_names = [p.name for p in filter_projects]
            total_hours = get_total_hours_from_timesheet(start_date, end_date, project_names)
            revenue, unpaid_revenue, paid_revenue = get_total_revenue(start_date, end_date, project_names, customer)
            labor_cost = get_labor_cost(start_date, end_date, project_names)
            profit = revenue - labor_cost
            profit_percentage = (profit / revenue) * 100 if revenue != 0 else 0
            data = {
                "client": customer,
                "project_type": ptype,
                "revenue": revenue,
                "unpaid_revenue": unpaid_revenue,
                "paid_revenue": paid_revenue,
                "labour_cost": labor_cost,
                "total_hours": total_hours,
                "avg_cost_rate": labor_cost / total_hours if total_hours else 0,
                "profit": profit,
                "profit_percentage": profit_percentage if profit_percentage > 0 else 0,
                "currency": CURRENCY,
            }
            res.append(data)
    res.sort(key=lambda x: x["revenue"], reverse=True)
    return res


def get_total_revenue(start_date: date | str, end_date: date | str, projects: list[str], customer: str):
    revenue = 0.0
    unpaid_revenue = 0.0
    paid_revenue = 0.0
    sales_invoices = DocType("Sales Invoice")

    query = (
        frappe.qb.from_(sales_invoices)
        .select(
            Sum(Case().when(sales_invoices.outstanding_amount == 0, sales_invoices.grand_total).else_(0)).as_(
                "paid_revenue"
            ),
            Sum(Case().when(sales_invoices.outstanding_amount > 0, sales_invoices.grand_total).else_(0)).as_(
                "unpaid_revenue"
            ),
            sales_invoices.currency,
        )
        .where(sales_invoices.posting_date[start_date:end_date])
        .where(sales_invoices.customer == customer)
        .where(sales_invoices.project.isin(projects))
        .where(sales_invoices.docstatus == 1)
        .groupby(sales_invoices.currency)
    )

    result = query.run(as_dict=True)
    if not result:
        return revenue, unpaid_revenue, paid_revenue

    for row in result:
        if row.currency == CURRENCY:
            revenue += row.unpaid_revenue + row.paid_revenue
            unpaid_revenue += row.unpaid_revenue
            paid_revenue += row.paid_revenue
        else:
            unpaid_revenue += (get_exchange_rate(row.currency, CURRENCY) or 1) * row.unpaid_revenue
            paid_revenue += (get_exchange_rate(row.currency, CURRENCY) or 1) * row.paid_revenue
            revenue += unpaid_revenue + paid_revenue

    return revenue, unpaid_revenue, paid_revenue


def get_total_hours_from_timesheet(start_date: date | str, end_date: date | str, projects: list[str]):
    start_date = getdate(start_date)
    end_date = getdate(end_date)
    timesheets = DocType("Timesheet")

    result = (
        frappe.qb.from_(timesheets)
        .select(Sum(timesheets.total_hours).as_("hours"))
        .where(timesheets.start_date >= start_date)
        .where(timesheets.end_date <= end_date)
        .where(timesheets.parent_project.isin(projects))
        .where(timesheets.docstatus.isin([0, 1]))
    ).run(as_dict=True)
    return result[0].get("hours", 0.0) or 0.0 if result else 0.0


def get_labor_cost(start_date: date | str, end_date: date | str, projects: list[str]):
    cost_in_usd = 0.0
    start_date = getdate(start_date)
    end_date = getdate(end_date)
    timesheets = DocType("Timesheet")
    result = (
        frappe.qb.from_(timesheets)
        .select(Sum(timesheets.total_costing_amount).as_("cost"), timesheets.currency)
        .where(timesheets.start_date >= start_date)
        .where(timesheets.end_date <= end_date)
        .where(timesheets.parent_project.isin(projects))
        .where(timesheets.docstatus.isin([0, 1]))
        .groupby(timesheets.currency)
    ).run(as_dict=True)

    if not result:
        return cost_in_usd
    if not result:
        return cost_in_usd
    for row in result:
        if row.currency == CURRENCY:
            cost_in_usd += row.cost
        else:
            cost_in_usd += (get_exchange_rate(row.currency, CURRENCY) or 1) * row.cost
    return cost_in_usd


def get_columns():
    return [
        {
            "fieldname": "client",
            "label": _("Client Name"),
            "fieldtype": "Link",
            "options": "Customer",
            "width": 200,
        },
        {
            "fieldname": "project_type",
            "label": _("Project Type"),
            "fieldtype": "Link",
            "options": "Project Type",
        },
        {
            "fieldname": "revenue",
            "label": _("Revenue $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "unpaid_revenue",
            "label": _("UnPaid Invoices $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "paid_revenue",
            "label": _("Paid Invoices $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "labour_cost",
            "label": _("Labour Cost $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "total_hours",
            "label": _("Total Hours"),
            "fieldtype": "Float",
        },
        {
            "fieldname": "avg_cost_rate",
            "label": _("Average Cost Rate $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "profit",
            "label": _("Profit $"),
            "fieldtype": "Currency",
            "options": "currency",
        },
        {
            "fieldname": "profit_percentage",
            "label": _("Profit %"),
            "fieldtype": "Percent",
        },
    ]
