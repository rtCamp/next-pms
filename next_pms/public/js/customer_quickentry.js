class CustomerQuickEntryForm extends frappe.ui.form.CustomerQuickEntryForm {
  render_dialog() {
    super.render_dialog();
    console.log(this.dialog);

    // Hook AFTER dialog exists
    this.dialog.fields_dict.customer_name.df.onchange = () => {
      this.set_abbr();
    };
  }

  set_abbr() {
    const name = this.dialog.doc.customer_name || "";

    const abbr = name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    this.dialog.set_value("custom_abbr", abbr);
  }
}
frappe.ui.form.CustomerQuickEntryForm = CustomerQuickEntryForm;
