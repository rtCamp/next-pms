# Cache Keys

EMP_WOKING_DETAILS = "emp_working_details"
EMP_TIMESHEET = "emp_timesheet"

ALLOWED_FILTER_FIELDS = {
    "Timesheet": {"parent_project", "docstatus", "custom_approval_status", "custom_weekly_approval_status"},
    "Timesheet Detail": {"project", "task", "is_billable", "hours"},
    "Task": {"project", "status", "subject", "custom_is_billable", "expected_time", "actual_time"},
}

ALLOWED_TIMESHET_DETAIL_FIELDS = [
    "name",
    "from_time",
    "to_time",
    "description",
    "project",
    "task",
    "project_name",
    "is_billable",
    "hours",
    "parent",
    "docstatus",
]
