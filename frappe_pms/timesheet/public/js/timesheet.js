frappe.ui.form.on("Timesheet", {
  refresh: function (frm) {
    frm._setting_hours = true;
  },
});
frappe.ui.form.on("Timesheet Detail", {
  hours: function (frm, cdt, cdn) {
    update_time(frm, cdt, cdn, "from_time");
  },
  from_time: function (frm, cdt, cdn) {
    update_time(frm, cdt, cdn, "to_time");
  },
});

const update_time = function (frm, cdt, cdn, key) {
  if (frm.__islocal) {
    frappe.model.set_value(cdt, cdn, key, frappe.datetime.get_today());
    return;
  }
  var child = locals[cdt][cdn];
  frappe.model.set_value(cdt, cdn, key, get_datetime_str(child[key]));
  return;
};

const get_datetime_str = function (datetime) {
  let date = new Date(datetime);
  let offsetMilliseconds = date.getTimezoneOffset() * 60000;
  // Set the time components to zero
  date.setTime(date.getTime() - offsetMilliseconds);
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  // Format the date to 'YYYY-MM-DD HH:MM:SS' format
  let formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
  return formattedDate;
};
