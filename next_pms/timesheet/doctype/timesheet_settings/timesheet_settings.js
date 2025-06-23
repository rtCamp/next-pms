// Copyright (c) 2024, rtCamp and contributors
// For license information, please see license.txt

frappe.ui.form.on("Timesheet Settings", {
  refresh(frm) {
    frm.trigger("setup_form_tour");
  },
  setup_form_tour(frm) {
    frm.add_custom_button(__("Start Tour"), async () => {
      const activeTab = frm.get_active_tab().label;
      let tour_name = "";
      if (activeTab === "Timesheet") {
        tour_name = "Timesheet Settings Tour";
      } else {
        tour_name = "Resource Allocation Tour";
      }
      frm.tour.init({ tour_name }).then(() => frm.tour.start());
    });
  },
});
