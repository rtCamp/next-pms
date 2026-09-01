from frappe.model import DEFAULT_FIELDS

# Cache Keys

EMP_WOKING_DETAILS = "emp_working_details"
EMP_TIMESHEET = "emp_timesheet"

# Last resort when neither the Employee nor HR Settings define working hours.
DEFAULT_DAILY_WORKING_HOURS = 8

# Assumed when an Employee has no custom_work_schedule set.
DEFAULT_WORKING_FREQUENCY = "Per Day"

# The one approval status that is an absence of data rather than a stored value: a week
# with no Timesheet, or a Timesheet whose weekly status was never set.
NOT_SUBMITTED_STATUS = "Not Submitted"

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

# Filter doctypes that describe logged work rather than who the employee is. Work filters
# qualify a week, so they are re-checked per week; Employee conditions narrow the pool once.
WORK_FILTER_DOCTYPES = ("Timesheet", "Timesheet Detail", "Task")

FILTER_LOOKBACK_WEEKS = 12

# Default members per page, matching TEAM_MEMBER_PAGE_LENGTH in the frontend.
TEAM_TIMESHEET_PAGE_LENGTH = 20

# Server-side ceiling on a caller-supplied page_length. A safety net rather than the
# pagination mechanism, since has_more_members is authoritative.
MAX_TEAM_TIMESHEET_PAGE_LENGTH = 100

# Default projects per page on the project timesheet, matching PROJECT_PAGE_LENGTH in
# the frontend.
PROJECT_TIMESHEET_PAGE_LENGTH = 4

# Server-side ceiling on a caller-supplied page_length, mirroring the team endpoint's cap.
MAX_PROJECT_TIMESHEET_PAGE_LENGTH = 100

ALLOWED_TIMESHET_DETAIL_FIELDS = [
    "name",
    "from_time",
    "to_time",
    "description",
    "custom_rejection_reason",
    "project",
    "task",
    "project_name",
    "is_billable",
    "hours",
    "parent",
    "docstatus",
]
