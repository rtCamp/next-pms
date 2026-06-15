export interface ProjectContact {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: 0 | 1 | 2;
  idx: number;
  contact: string;
  parent: string;
  parentfield: string;
  parenttype: string;
  doctype: "Project Contact";
}

export interface ProjectRepositoryConnection {
  name: string;
  creation: string;
  github_repository?: string;
  parent: string;
  parentfield: string;
  parenttype: string;
  doctype: string;
}

export interface ProjectUser {
  user: string;
  email?: string;
  image?: string;
  full_name?: string;
  welcome_email_sent?: 0 | 1;
  view_attachments?: 0 | 1;
  hide_timesheets?: 0 | 1;
  project_status?: string;
}

export interface ProjectBillingTeam {
  name: string;
  employee: string;
  user_name?: string;
  hourly_billing_rate?: number;
  valid_from: string;
}

export interface ProjectBudget {
  name: string;
  start_date: string;
  end_date: string;
  hours_purchased: number;
  consumed_hours?: number;
  remaining_hours?: number;
  sales_order?: string;
  sales_invoice?: string;
}

export interface ProjectDoc {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: 0 | 1 | 2;
  idx: number;
  doctype: "Project";
  naming_series: "PROJ-.####";
  project_name: string;
  project_type?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  priority?: "Medium" | "Low" | "High";
  custom_host?: string;
  is_active?: "Yes" | "No";
  status?: "Open" | "Completed" | "Cancelled";
  custom_project_phase: string;
  custom_territory?: string | null;
  custom_key_account?: "" | "Yes" | "No";
  actual_start_date?: string;
  actual_end_date?: string;
  custom_complexity?: "" | "C1" | "C2" | "C3";
  project_template?: string;
  department?: string;
  customer?: string;
  custom_customer_contacts?: ProjectContact[];
  custom_client_point_of_contact?: string;
  sales_order?: string;
  custom_restricted_under_nda?: 0 | 1;
  custom_source?: string;
  custom_previous_cms?: string;
  custom_permission_for_testimonial?: 0 | 1;
  custom_permission_for_case_study?: 0 | 1;
  custom_testimonial_contact?: string;
  custom_project_rag_status?: "" | "Red" | "Amber" | "Green";
  custom_next_milestone?: string;
  custom_next_milestone_details?: string;
  custom_3rd_parties?: string;
  custom_project_detail?: string;
  custom_project_manager?: string;
  custom_project_manager_name?: string;
  custom_engineering_manager?: string;
  custom_engineering_manager_name?: string;
  users?: ProjectUser[];
  copied_from?: string;
  notes?: string;
  collect_progress?: 0 | 1;
  holiday_list?: string;
  frequency?: "Hourly" | "Twice Daily" | "Daily" | "Weekly";
  from_time?: string;
  to_time?: string;
  first_email?: string;
  second_email?: string;
  daily_time_to_send?: string;
  day_to_send?:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  weekly_time_to_send?: string;
  subject?: string;
  message?: string;
  custom_billing_type?:
    | "Non-Billable"
    | "Fixed Cost"
    | "Retainer"
    | "Time and Material";
  company: string;
  custom_currency?: string;
  total_consumed_material_cost?: number;
  custom_percentage_estimated_cost?: number;
  custom_percentage_estimated_profit?: number;
  total_purchase_cost?: number;
  total_costing_amount?: number;
  total_expense_claim?: number;
  gross_margin?: number;
  estimated_costing?: number;
  custom_target_cost?: number;
  custom_estimated_profit?: number;
  custom_default_hourly_billing_rate?: number;
  total_sales_amount?: number;
  total_billable_amount?: number;
  total_billed_amount?: number;
  per_gross_margin?: number;
  custom_project_billing_team?: ProjectBillingTeam[];
  custom_project_budget_hours?: ProjectBudget[];
  custom_send_reminder_when_approaching_project_threshold_limit?: 0 | 1;
  custom_reminder_threshold_percentage?: number;
  custom_email_template?: string;
  cost_center?: string;
  actual_time?: number;
  custom_total_hours_remaining?: number;
  custom_total_hours_purchased?: number;
  percent_complete?: number;
  percent_complete_method?:
    | "Manual"
    | "Task Completion"
    | "Task Progress"
    | "Task Weight";
  custom_short_summary?: string;
  custom_executive_summary?: string;
  custom_key_goals?: string;
  custom_internal_slack_channel?: string;
  custom_google_drive_folder?: string;
  custom_website?: string;
  custom_project_repository_connections?: ProjectRepositoryConnection[];
}
