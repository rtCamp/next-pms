// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txtxe
frappe.ui.form.on("Project", {
  setup: function (frm) {
    frm.trigger("setup_poc_info");
  },
  setup_poc_info: async function (frm) {
    if (!frm.doc.custom_client_point_of_contact || frm.is_new()) {
      return;
    }
    const poc_info = await frappe.db.get_doc(
      "Contact",
      frm.doc.custom_client_point_of_contact,
    );
    const email = poc_info.email_id
      ? `<a href="mailto:${poc_info.email_id}">${poc_info.email_id}</a> `
      : "";
    const phone = poc_info.phone
      ? `<a href="tel:${poc_info.phone}">${poc_info.phone}</a>`
      : "";
    const full_name = poc_info.full_name ? poc_info.full_name : "";
    const wrapper = $(
      frm.fields_dict["custom_client_poc_information"].wrapper,
    ).html("");

    wrapper.html(`
      <div class="address-box">
    <label>Client Point of Contact</label>
        <p><span class="text-muted">Full Name</span> : <span class="text-muted">${full_name}</span> </p>
        <p><span class="text-muted">Email</span> : <span class="text-muted">${email}</span> </p>
        <p><span class="text-muted">Phone</span> : <span class="text-muted">${phone}</span> </p>

</div>`);
  },
  refresh: function (frm) {
    if (!frm.is_new()) {
      frm.add_custom_button(__("Recalculate Timesheet Billing"), () => {
        frm.events.recalculate_timesheet_billing(frm);
      });
    }

    frm.events.update_custom_table_project();
    frm.events.custom_send_reminder_when_approaching_project_threshold_limit(
      frm,
    );

    document
      .querySelector('[data-fieldname="project_details"]')
      .removeEventListener("click", frm.events.update_custom_table_project);
    document
      .querySelector('[data-fieldname="project_details"]')
      .addEventListener("click", frm.events.update_custom_table_project);
  },
  update_custom_table_project: function () {
    const section = document.querySelector(
      '[data-fieldname="project_details"] .section-head',
    );
    const table_section = document.querySelector(
      '[data-fieldname="custom_section_break_ca8jh"]',
    );
    if (section.classList.contains("collapsed")) {
      table_section.classList.add("hidden");
    } else {
      table_section.classList.remove("hidden");
    }
  },
  custom_billing_type: function (frm) {
    frm.events.custom_send_reminder_when_approaching_project_threshold_limit(
      frm,
    );
  },
  custom_send_reminder_when_approaching_project_threshold_limit: function (
    frm,
  ) {
    if (frm.doc.custom_billing_type == "Retainer") {
      frm.set_df_property(
        "custom_send_reminder_when_approaching_project_threshold_limit",
        "description",
        "For retainer project, reminder is sent based on Latest Consumed Hours vs Latest Hours Purchased.",
      );
    } else if (frm.doc.custom_billing_type == "Time and Material") {
      frm.set_df_property(
        "custom_send_reminder_when_approaching_project_threshold_limit",
        "description",
        "For time and material project, reminder is sent based on Total Billable Amount (via Timesheet) vs Estimated Cost.",
      );
    }
  },
  recalculate_timesheet_billing: function (frm) {
    const base_fields = [
      {
        label: "Vaild From",
        fieldname: "valid_from_date",
        fieldtype: "Date",
        reqd: 1,
      },
    ];

    let recalculate_dialog = new frappe.ui.Dialog({
      title: "Recalculate timesheet billing for project",
      fields: base_fields,
      size: "small",
      description:
        "This will recalculate the billing for all the timesheets of the project from the given date.",
      primary_action_label: "Submit",
      primary_action(values) {
        frappe.call({
          method:
            "next_pms.project_currency.api.project_timesheet_billing_recalculation.calculate",
          args: {
            project_id: frm.doc.name,
            valid_from_date: values.valid_from_date,
          },
          callback: function (r) {
            if (r && !r.exc) {
              frm.refresh();
            }
          },
        });
        recalculate_dialog.hide();
      },
    });

    recalculate_dialog.$body.append(
      `<p class="frappe-confirm-message">Please ensure all billing information is accurate before initiating the recalculation.</p>`,
    );
    recalculate_dialog.show();
  },
});

frappe.ui.form.on("Project Billing Team", {
  custom_project_billing_team_add: function (frm, cdt, cdn) {
    if (frm.doc.custom_is_flat_rate_applicable && frm.doc.custom_flat_rate) {
      // Find the current row object.
      const custom_project_billing_team =
        frm.doc.custom_project_billing_team.find(
          (custom_project_billing_team) =>
            custom_project_billing_team.name == cdn,
        );

      // Update the values as well as html of child table.
      custom_project_billing_team.hourly_billing_rate =
        frm.doc.custom_flat_rate;
      custom_project_billing_team.valid_from =
        frm.doc.custom_flat_rate_valid_from;
      frm.refresh_field("custom_project_billing_team");
    }
  },
});
