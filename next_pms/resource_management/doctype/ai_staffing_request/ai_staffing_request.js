frappe.ui.form.on("AI Staffing Request", {
  refresh(frm) {
    const summary = frm.doc.summary || "";
    const $wrapper = frm.get_field("summary_html").$wrapper;
    $wrapper.html(
      summary ? frappe.markdown(frappe.utils.escape_html(summary)) : "",
    );
    $wrapper.css("overflow-x", "auto");
    $wrapper.find("table").addClass("table table-bordered table-sm");
  },
});
