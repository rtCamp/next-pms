// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.views.calendar["Resource Allocation"] = {
  field_map: {
    start: "allocation_start_date",
    end: "allocation_end_date",
    id: "name",
    title: "employee_name",
    allDay: "allDay",
    progress: "progress",
  },
  gantt: true,
  get_events_method: "frappe.desk.calendar.get_events",
};
