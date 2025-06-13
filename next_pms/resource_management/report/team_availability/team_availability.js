// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Team Availability"] = {
  filters: [],
  tree: true,
  name_field: "name",
  parent_field: "reports_to",
  initial_depth: 2,
  formatter: function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);

    if (data.has_value && ["name", "designation", "available_capacity", "monthly_salary"].includes(column.id)) {
      var $value = $(value).css("font-weight", "bold");
      value = $value.wrap("<p></p>").parent().html();
    }
    if (column.id === "employee_name" && data.has_value) {
      value = `<span style="font-weight: bold;">${value}</span>`;
    }
    return value;
  },
};

const setup_filters = () => {
  frappe.query_reports["Team Availability"].filters.push({
    fieldname: "from",
    label: __("From Date"),
    fieldtype: "Date",
    default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
    reqd: 1,
  });
  frappe.query_reports["Team Availability"].filters.push({
    fieldname: "to",
    label: __("To Date"),
    fieldtype: "Date",
    default: frappe.datetime.get_today(),
    reqd: 1,
  });

  const employeeDoctype = "Employee";
  const buDoctype = "Business Unit";

  frappe.model.with_doctype(employeeDoctype, () => {
    let meta = frappe.get_meta(employeeDoctype);
    const fields = meta.fields;

    const statusField = fields.find((field) => field.fieldtype === "Select" && field.fieldname === "status");
    if (statusField) {
      frappe.query_reports["Team Availability"].filters.push({
        fieldname: "status",
        label: __("Status"),
        fieldtype: "Select",
        options: "\n" + statusField.options,
        default: "Active",
        reqd: 0,
      });
    }

    const buField = fields.find((field) => field.fieldtype === "Link" && field.options === buDoctype);
    if (buField) {
      frappe.query_reports["Team Availability"].filters.push({
        fieldname: "business_unit",
        label: __("Business Unit"),
        fieldtype: "MultiSelectList",
        options: buDoctype,
        reqd: 0,
        get_data: function (txt) {
          return frappe.db.get_link_options(buDoctype, txt);
        },
      });
    }
    frappe.query_reports["Team Availability"].filters.push({
      fieldname: "designation",
      label: __("Designation"),
      fieldtype: "MultiSelectList",
      options: "Designation",
      reqd: 0,
      get_data: function (txt) {
        return frappe.db.get_link_options("Designation", txt);
      },
    });
    frappe.query_reports["Team Availability"].filters.push({
      fieldname: "currency",
      label: __("Currency"),
      fieldtype: "Select",
      options: ["INR", "USD"],
      reqd: 0,
      default: "USD",
    });
    frappe.query_reports["Team Availability"].filters.push({
      fieldname: "is_group",
      label: __("Aggregate by Manager"),
      fieldtype: "Check",
      default: 0,
    });
  });
};

// This function sets up the filters for the Team Availability report based on the Employee and Business Unit doctypes dynamically.
setup_filters();
