// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Profit Report"] = {
  filters: [
    {
      fieldname: "status",
      label: __("Employee Status"),
      fieldtype: "Select",
      options: [
        { value: "", description: "" },
        { value: "Active", description: "" },
        { value: "Inactive", description: "" },
        { value: "Left", description: "" },
        { value: "Suspended", description: "" },
      ],
    },
    {
      fieldname: "from_date",
      label: __("From Date"),
      fieldtype: "Date",
      reqd: 1,
      default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
    },
    {
      fieldname: "to_date",
      label: __("To Date"),
      fieldtype: "Date",
      reqd: 1,
      default: frappe.datetime.get_today(),
    },
    {
      fieldname: "department",
      label: __("Department"),
      fieldtype: "MultiSelectList",
      reqd: 0,
      get_data: function (txt) {
        return frappe.db.get_link_options("Department", txt);
      },
    },
  ],
  formatter: function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);
    if (
      ["revenue", "cost", "hourly_rate", "profit"].includes(column.id) &&
      data &&
      column.id &&
      data[column.id] < 0
    ) {
      var $value = $(value).css("color", "red");
      value = $value.wrap("<p></p>").parent().html();
    }
    return value;
  },
};
