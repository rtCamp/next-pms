// Copyright (c) 2025, rtCamp and contributors
// For license information, please see license.txt

frappe.query_reports["Spare Capacity Report"] = {
  filters: [],
  tree: true,
  name_field: "name",
  parent_field: "reports_to",
  initial_depth: 2,
  formatter: function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);

    if (
      data.has_value &&
      [
        "name",
        "designation",
        "available_capacity",
        "monthly_salary",
        "actual_unbilled_cost",
        "percentage_capacity_available",
      ].includes(column.id)
    ) {
      var $value = $(value).css("font-weight", "bold");
      value = $value.wrap("<p></p>").parent().html();
    }
    if (column.id === "employee_name" && data.has_value) {
      value = `<span style="font-weight: bold;">${value}</span>`;
    }
    return value;
  },
  onload: function (report) {
    let status_filter = report.get_filter("business_unit");
    if (!status_filter) return;
    if (!status_filter.get_value() || status_filter.get_value().length === 0) {
      frappe.db.get_list("Business Unit", { limit: 0 }).then((res) => {
        if (!res || res.length === 0) return;
        const values = res.map((item) => item.name);
        status_filter.set_value(values);
        status_filter.refresh();
      });
    }
  },
};

const setup_filters = () => {
  frappe.query_reports["Spare Capacity Report"].filters.push({
    fieldname: "from",
    label: __("From Date"),
    fieldtype: "Date",
    default: frappe.datetime.get_today(),
    reqd: 1,
  });
  frappe.query_reports["Spare Capacity Report"].filters.push({
    fieldname: "to",
    label: __("To Date"),
    fieldtype: "Date",
    default: frappe.datetime.add_months(frappe.datetime.get_today(), 1),
    reqd: 1,
  });

  const employeeDoctype = "Employee";
  const buDoctype = "Business Unit";

  frappe.model.with_doctype(employeeDoctype, () => {
    let meta = frappe.get_meta(employeeDoctype);
    const fields = meta.fields;

    const statusField = fields.find((field) => field.fieldtype === "Select" && field.fieldname === "status");
    if (statusField) {
      frappe.query_reports["Spare Capacity Report"].filters.push({
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
      frappe.query_reports["Spare Capacity Report"].filters.push({
        fieldname: "business_unit",
        label: __("Business Unit"),
        fieldtype: "MultiSelectList",
        options: buDoctype,
        reqd: 0,
        get_data: function (txt) {
          return frappe.db.get_link_options(buDoctype, txt);
        },
      });
      frappe.query_reports["Spare Capacity Report"].filters.push({
        fieldname: "group_by",
        label: __("Group By"),
        fieldtype: "Select",
        options: [
          { value: "employee", label: __("Employee") },
          { value: "business_unit", label: __("Business Unit") },
        ],
        default: "business_unit",
      });
    }
    frappe.query_reports["Spare Capacity Report"].filters.push({
      fieldname: "designation",
      label: __("Designation"),
      fieldtype: "MultiSelectList",
      options: "Designation",
      reqd: 0,
      get_data: function (txt) {
        return frappe.db.get_link_options("Designation", txt);
      },
    });
    frappe.query_reports["Spare Capacity Report"].filters.push({
      fieldname: "currency",
      label: __("Currency"),
      fieldtype: "Select",
      options: ["INR", "USD"],
      reqd: 0,
      default: "USD",
    });
    frappe.query_reports["Spare Capacity Report"].filters.push({
      fieldname: "is_group",
      label: __("Aggregate by Manager"),
      fieldtype: "Check",
      default: 0,
    });

    frappe.query_reports["Spare Capacity Report"].filters.push({
      fieldname: "show_no_capacity",
      label: __("Show employe with no capacity"),
      fieldtype: "Check",
      default: 1,
    });
  });
};

// This function sets up the filters for the Spare Capacity Report report based on the Employee and Business Unit doctypes dynamically.
setup_filters();
