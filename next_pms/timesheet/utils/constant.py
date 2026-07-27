from frappe.model import DEFAULT_FIELDS

# Cache Keys

EMP_WOKING_DETAILS = "emp_working_details"
EMP_TIMESHEET = "emp_timesheet"

# Last resort when neither the Employee nor HR Settings define working hours.
DEFAULT_DAILY_WORKING_HOURS = 8

# Assumed when an Employee has no custom_work_schedule set.
DEFAULT_WORKING_FREQUENCY = "Per Day"

TASK_FILTER_OPERATORS = {
    "=",
    "!=",
    "like",
    "not like",
    "in",
    "not in",
    ">=",
    "<=",
    ">",
    "<",
    "between",
    "is",
}

# Frappe's default columns minus the virtual "doctype", which has no physical column on the table.
# These sit alongside the doctype's own fields as valid targets for filtering and sorting.
TASK_META_FIELDS = DEFAULT_FIELDS - {"doctype"}

ALLOWED_FILTER_FIELDS = {
    "Timesheet": {
        "parent_project",
        "docstatus",
        "custom_approval_status",
        "custom_weekly_approval_status",
        "employee",
        "employee_name",
        "department",
        "start_date",
        "end_date",
    },
    "Timesheet Detail": {"project", "project_name", "task", "is_billable", "hours"},
    "Task": {"project", "status", "subject", "custom_is_billable", "expected_time", "actual_time"},
    "Employee": {"status", "custom_business_unit"},
}

FILTER_LOOKBACK_WEEKS = 12

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
