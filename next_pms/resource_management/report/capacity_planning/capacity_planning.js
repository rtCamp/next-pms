// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Capacity Planning"] = {
  filters: [
    {
      fieldname: "status",
      label: __("Employee Status"),
      fieldtype: "Select",
      options: [
        { value: "Active", description: "" },
        { value: "Inactive", description: "" },
        { value: "Left", description: "" },
        { value: "Suspended", description: "" },
      ],
      default: "Active",
    },
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
};
