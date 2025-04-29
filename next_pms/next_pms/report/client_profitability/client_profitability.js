// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

const columnNames = ["revenue", "labour_cost", "avg_cost_rate", "profit", "profit_percentage"];
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
  formatter: function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);
    if (columnNames.includes(column.id)) {
      if (column.id === "profit_percentage") {
        value = `<span style="display:flex;justify-content: flex-end;">${value}%</span>`;
      } else {
        value = `<span style="display:flex;justify-content: flex-end;">$${value}</span>`;
      }
    }
    return value;
  },
};
