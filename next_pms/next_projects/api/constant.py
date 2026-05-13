# Permission helpers
ALLOWED_ROLES = ["Projects Manager", "Projects User", "Timesheet Manager"]

# project timeline item fields to fetch in list view and API
TIMELINE_ITEM_FIELDS = [
    "name",
    "title",
    "project",
    "item_owner",
    "type",
    "is_complete",
    "start_date",
    "planned_end_date",
    "actual_end_date",
]

# Fields to fetch from Project doctype
LIST_VIEW_FIELDS = [
    "name",
    "project_name",
    "customer",
    "customer_name",
    "status",
    "project_type",
    "expected_start_date",
    "expected_end_date",
    "actual_end_date",
    "total_sales_amount",
    "estimated_costing",
    "total_costing_amount",
    "total_billable_amount",
    "custom_project_rag_status",
    "custom_project_phase",
    "custom_billing_type",
    "custom_currency",
    "custom_target_cost",
    "custom_default_hourly_billing_rate",
    "custom_next_milestone",
    "custom_project_manager",
    "custom_project_manager_name",
    "custom_engineering_manager",
    "custom_engineering_manager_name",
]

KANBAN_VIEW_FIELDS = [
    "name",
    "project_name",
    "status",
    "expected_start_date",
    "expected_end_date",
    "actual_end_date",
    "custom_project_rag_status",
    "custom_project_phase",
    "custom_billing_type",
    "custom_project_manager",
    "custom_project_manager_name",
    "custom_engineering_manager",
    "custom_engineering_manager_name",
]
