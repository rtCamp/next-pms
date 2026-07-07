frappe.ui.form.on("Customer", {
  customer_name: async function (frm) {
    if (!frm.doc.customer_name) return;
    const { message } = await frappe.call({
      method: "next_pms.api.customer.generate_unique_abbr",
      args: {
        customer_name: frm.doc.customer_name,
        exclude_name: frm.doc.name || null,
      },
    });
    if (message) frm.set_value("custom_abbr", message);
  },
});
