# Permission helpers
ALLOWED_ROLES = ["Projects Manager", "Projects User", "Timesheet Manager"]

# project timeline item fields to fetch in list view and API
TIMELINE_ITEM_FIELDS = [
    "name",
    "title",
    "project",
    "item_owner",
    "item_owner_name",
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

# evaluation_type -> ordered list of its Rating fieldnames.
RATING_FIELDS = {
    "Project": [
        "p_overall_satisfaction",
        "p_communication_responsiveness",
        "p_delivery_quality",
        "p_confidence_engagement",
    ],
    "Engineer": [
        "e_ability_to_provide_soln",
        "e_ability_to_meet_deadlines",
        "e_responsiveness",
        "e_proactiveness",
    ],
    "Project Manager": [
        "pm_overall_outcome",
        "pm_ability_to_meet_goals",
        "pm_planning_documenting",
        "pm_contribute_ideas",
        "pm_effective_communication",
    ],
    "Project Coordinator": [
        "pc_assigning_and_monitoring",
        "pc_sharing_frequent_updates",
        "pc_able_to_provide_clear",
        "pc_ability_to_foster_collab",
    ],
    "Quality Engineer": [
        "qe_able_to_identify_bugs",
        "qe_follows_coding_standards",
        "qe_clear_and_descriptive_information",
    ],
}

# evaluation_type -> ordered list of free-text answer fieldnames.
TEXT_FIELDS = {
    "Project": ["p_suggestion", "p_reccomendation", "additional_comments__feedback"],
    "Engineer": ["additional_comments__feedback"],
    "Project Manager": ["additional_comments__feedback"],
    "Project Coordinator": ["additional_comments__feedback"],
    "Quality Engineer": ["additional_comments__feedback"],
}

# Every rating column across the resource (non-Project) evaluation types.
RESOURCE_RATING_FIELDS = [
    field for evaluation_type, fields in RATING_FIELDS.items() if evaluation_type != "Project" for field in fields
]

DEFAULT_STAR_MAX = 4
