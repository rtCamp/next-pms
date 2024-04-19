frappe.pages["time-entry"].on_page_load = function (wrapper) {
  frappe.ui.make_app_page({
    parent: wrapper,
    title: "Time Entry",
    single_column: true,
  });
};
