class CustomerQuickEntryForm extends frappe.ui.form.CustomerQuickEntryForm {
  render_dialog() {
    super.render_dialog();
    console.log(this.dialog);

    // Hook AFTER dialog exists
    this.dialog.fields_dict.customer_name.df.onchange = () => {
      this.set_abbr();
    };
  }

  async set_abbr() {
    const name = this.dialog.doc.customer_name || "";
    if (!name) return;

    const { message } = await frappe.call({
      method: "next_pms.api.customer.generate_unique_abbr",
      args: { customer_name: name },
    });
    if (message) this.dialog.set_value("custom_abbr", message);
  }
}
frappe.ui.form.CustomerQuickEntryForm = CustomerQuickEntryForm;
