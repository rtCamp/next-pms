// Copyright (c) 2024, rtCamp and contributors
// For license information, please see license.txt

frappe.ui.form.on("Customer Feedback Schedule", {
  setup(frm) {
    frm.set_query("feedback_by", function () {
      return {
        filters: [
          ["Dynamic Link", "link_name", "=", frm.doc.customer],
          ["Dynamic Link", "link_doctype", "=", "Customer"],
        ],
      };
    });
  },

  refresh(frm) {
    if (frm.is_new()) {
      frm.trigger("populate_projects");
    }
    if (frm.doc.docstatus === 1) {
      // Check if the document is submitted
      frm.add_custom_button(__("Send Feedback Request"), function () {
        frappe.confirm(
          __("Are you sure you want to send feedback email to {0}?", [
            frm.doc.feedback_by,
          ]),
          function () {
            // Action to perform if the user clicks "Yes"
            frm.call({
              method: "send_feedback_request",
              args: {
                doc_name: frm.doc.name,
              },
              callback: (r) => {
                if (r.exc) {
                  frappe.msgprint(__("Error sending email"));
                } else {
                  frappe.msgprint(__("Email sent successfully"));
                }
              },
            });
          },
          function () {
            // Action to perform if the user clicks "No"
            frappe.msgprint(__("Email sending cancelled."));
          },
        );
      });
    }
  },

  customer(frm) {
    frm.trigger("populate_team");
    frm.trigger("populate_projects");
  },

  feedback_type(frm) {
    frm.trigger("populate_team");
    frm.trigger("populate_projects");
  },

  populate_team(frm) {
    const tableField = "resources";
    // Clean up entries if customer or feedback type is changed
    frm.clear_table(tableField);
    frm.refresh_field(tableField);

    if (!frm.doc.customer || frm.doc.feedback_type !== "Resource") return;

    frm.call({
      method: "get_customer_employees",
      args: {
        customer: frm.doc.customer,
      },
      callback: (r) => {
        if (r.message) {
          r.message.forEach((employee) => {
            frm.add_child(tableField, {
              employee: employee.employee_id,
              employee_name: employee.employee_name,
              designation: employee.designation,
            });
          });
          frm.refresh_field(tableField);
        }
      },
    });
  },

  populate_projects(frm) {
    const tableField = "projects";
    // Clean up entries if customer or feedback type is changed
    frm.clear_table(tableField);
    frm.refresh_field(tableField);

    if (!frm.doc.customer || frm.doc.feedback_type !== "Project") return;

    frm.call({
      method: "get_customer_projects",
      args: {
        customer: frm.doc.customer,
      },
      callback: (r) => {
        if (r.message) {
          r.message.forEach((project) => {
            frm.add_child(tableField, {
              project: project.name,
              project_name: project.project_name,
            });
          });
          frm.refresh_field(tableField);
        }
      },
    });
  },
});
