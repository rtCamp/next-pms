// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txtxe
frappe.ui.form.on("Project Billing Team", {
  custom_project_billing_team_add: function (frm, cdt, cdn) {
    if (frm.doc.custom_is_flat_rate_applicable && frm.doc.custom_flat_rate) {
      // Find the current row object.
      const custom_project_billing_team = frm.doc.custom_project_billing_team.find(
        (custom_project_billing_team) => custom_project_billing_team.name == cdn,
      );

      // Update the values as well as html of child table.
      custom_project_billing_team.hourly_billing_rate = frm.doc.custom_flat_rate;
      frm.refresh_field("custom_project_billing_team");
    }
  },
});
