// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Client Profitability"] = {
  filters: [
    {
      fieldname: "from",
      label: __("From Date"),
      fieldtype: "Date",
      reqd: 1,
      default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
    },
    {
      fieldname: "to",
      label: __("To Date"),
      fieldtype: "Date",
      reqd: 1,
      default: frappe.datetime.get_today(),
    },
    {
      fieldname: "customer",
      label: __("Customer"),
      fieldtype: "Link",
      reqd: 0,
      options: "Customer",
    },
    {
      fieldname: "project_type",
      label: __("Project Type"),
      fieldtype: "Link",
      reqd: 0,
      options: "Project Type",
    },
  ],
};
