// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Over Capacity"] = {
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
  ],
  formatter: function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);
    if (column.id == "logged_hours" && data) {
      if (data["logged_hours"] > data["capacity_hours"]) {
        value = `<span style="color:red;">${value}</span>`;
      } else {
        value = `<span style="color:green;">${value}</span>`;
      }
    }
    return value;
  },
};
