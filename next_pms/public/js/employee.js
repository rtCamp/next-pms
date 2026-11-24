frappe.ui.form.on("Employee", {
  before_save: function (frm) {
    if (frm.doc.custom_work_schedule && frm.doc.custom_working_hours < 1) {
      frappe.throw(__("Custom Working Hours must be greater than 0"));
    }
  },
});
