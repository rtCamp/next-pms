// Copyright (c) 2024, rtCamp and contributors
// For license information, please see license.txt

frappe.ui.form.on("Customer Feedback", {
  refresh(frm) {
    frm.trigger("setup_project_list");
  },
  async setup_project_list(frm) {
    if (frm.is_new()) {
      return;
    }
    if (frm.doc.evaluation_type != "Project") {
      return;
    }
    if (!frm.doc.customer_feedback_schedule) {
      return;
    }

    frm.call({
      method:
        "next_pms.customer_feedback.doctype.customer_feedback_schedule.customer_feedback_schedule.get_schedule_projects_html",
      args: {
        schedule_name: frm.doc.customer_feedback_schedule,
      },
      callback: (r) => {
        if (r.exc) {
          frappe.throw(__("Error getting projects"));
          return;
        }
        frm.set_df_property("projects", "options", r.message);
      },
    });
  },
});
