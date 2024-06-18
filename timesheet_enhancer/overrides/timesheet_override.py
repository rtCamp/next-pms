from erpnext.projects.doctype.timesheet.timesheet import Timesheet
from frappe import _, throw
from frappe.utils.data import flt


class TimesheetOverride(Timesheet):
    def calculate_hours(self):
        return

    def validate_time_logs(self):
        if not self.get("time_logs"):
            return
        for data in self.get("time_logs"):
            self.validate_overlap(data)
            self.set_project(data)
            self.validate_project(data)

    def validate_mandatory_fields(self):
        for data in self.time_logs:
            if not data.from_time and not data.to_time:
                throw(
                    _("Row {0}: From Time and To Time is mandatory.").format(data.idx)
                )

            if flt(data.hours) == 0.0:
                throw(
                    _("Row {0}: Hours value must be greater than zero.").format(
                        data.idx
                    )
                )
