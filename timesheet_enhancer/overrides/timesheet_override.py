from erpnext.projects.doctype.timesheet.timesheet import Timesheet


class TimesheetOverride(Timesheet):
    def calculate_hours(self):
        return

    def validate_time_logs(self):
        for data in self.get("time_logs"):
            self.validate_overlap(data)
            self.set_project(data)
            self.validate_project(data)
