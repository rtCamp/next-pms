frappe.ui.form.on("Employee", {
  refresh: function (frm) {
    frm.trigger("render_own_salary_summary");
  },
  before_save: function (frm) {
    if (frm.doc.custom_work_schedule && frm.doc.custom_working_hours < 1) {
      frappe.throw(__("Custom Working Hours must be greater than 0"));
    }
  },
  render_own_salary_summary: function (frm) {
    const wrapper = frm.get_field("custom_ctc_summary")?.$wrapper;
    if (!wrapper) return;
    wrapper.empty();
    if (
      frm.is_new() ||
      frm.perm[1]?.read ||
      frm.doc.user_id !== frappe.session.user
    ) {
      return;
    }

    frappe
      .xcall(
        "next_pms.api.employee.get_own_salary_summary",
        { employee: frm.doc.name },
        "GET",
      )
      .then((summary) => wrapper.html(getSalarySummaryHtml(summary)));
  },
});

function getSalarySummaryHtml(summary) {
  const salary = [
    [
      __("Annual Salary"),
      format_currency(summary.ctc, summary.salary_currency),
    ],
    [__("Salary Currency"), summary.salary_currency],
    [
      __("Monthly Salary"),
      format_currency(summary.monthly_salary, summary.salary_currency),
    ],
    [__("Income Tax Slab"), summary.income_tax_slab],
  ];
  const bank = [
    [__("Bank Name"), summary.bank_name],
    [__("Bank Account No"), summary.bank_ac_no],
    [__("IFSC Code"), summary.ifsc_code],
    [__("Bank Branch"), summary.custom_bank_branch],
  ];

  const column = (rows) =>
    `<div class="col-sm-6">${rows
      .filter(([, value]) => value)
      .map(
        ([label, value]) =>
          `<div class="flex"><p class="pr-2">${label}:</p><p class="bold">${frappe.utils.escape_html(value)}</p></div>`,
      )
      .join("")}</div>`;

  return `<div class="row">${summary.ctc ? column(salary) : ""}${
    summary.bank_name ? column(bank) : ""
  }</div>`;
}
