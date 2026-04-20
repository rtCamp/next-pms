export interface ProjectBillingTeam {
  employee: string;
  user_name?: string;
  hourly_billing_rate?: number;
  valid_from: string;
}

export interface ProjectBudget {
  start_date: string;
  end_date: string;
  hours_purchased: number;
  consumed_hours?: number;
  remaining_hours?: number;
  sales_order?: string;
  sales_invoice?: string;
}

export interface ProjectUser {
  user: string;
  email?: string;
  image?: string;
  full_name?: string;
  welcome_email_sent?: boolean;
  view_attachments?: boolean;
  hide_timesheets?: boolean;
  project_status?: string;
}

export interface Project {
  naming_series: "PROJ-.####";
  project_name: string;
  status?: "Open" | "Completed" | "Cancelled";
  custom_key_account?: "" | "Yes" | "No";
  project_type?: string;
  percent_complete_method?: "Manual" | "Task Completion" | "Task Progress" | "Task Weight";
  project_template?: string;
  priority?: "Medium" | "Low" | "High";
  custom_host?: string;
  department?: string;
  is_active?: "Yes" | "No";
  percent_complete?: number;
  expected_start_date?: string;
  actual_start_date?: string;
  actual_time?: number;
  custom_total_hours_remaining?: number;
  custom_total_hours_purchased?: number;
  expected_end_date?: string;
  actual_end_date?: string;
  custom_complexity?: "" | "C1" | "C2" | "C3";
  custom_billing_type?: "Non-Billable" | "Fixed Cost" | "Retainer" | "Time and Material";
  estimated_costing?: number;
  custom_estimated_profit?: number;
  custom_default_hourly_billing_rate?: number;
  total_costing_amount?: number;
  total_expense_claim?: number;
  total_purchase_cost?: number;
  company: string;
  custom_currency?: string;
  total_sales_amount?: number;
  total_billable_amount?: number;
  total_billed_amount?: number;
  total_consumed_material_cost?: number;
  cost_center?: string;
  gross_margin?: number;
  per_gross_margin?: number;
  collect_progress?: boolean;
  holiday_list?: string;
  frequency?: "Hourly" | "Twice Daily" | "Daily" | "Weekly";
  from_time?: string;
  to_time?: string;
  first_email?: string;
  second_email?: string;
  daily_time_to_send?: string;
  day_to_send?: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  weekly_time_to_send?: string;
  subject?: string;
  message?: string;
  custom_project_billing_team?: ProjectBillingTeam[];
  custom_project_budget_hours?: ProjectBudget[];
  custom_send_reminder_when_approaching_project_threshold_limit?: boolean;
  custom_reminder_threshold_percentage?: number;
  custom_email_template?: string;
  customer?: string;
  sales_order?: string;
  users?: ProjectUser[];
  copied_from?: string;
  notes?: string;
  custom_percentage_estimated_profit?: number;
  custom_engineering_manager_name?: string;
  custom_project_manager_name?: string;
  custom_next_milestone_details?: string;
  custom_project_detail?: string;
  custom_3rd_parties?: string;
  custom_next_milestone?: string;
  custom_project_manager?: string;
  custom_project_rag_status?: "" | "Red" | "Amber" | "Green";
  custom_engineering_manager?: string;
  custom_client_point_of_contact?: string;
  custom_percentage_estimated_cost?: number;
}


// Problemns
// - Phase - Add a new field
// - Burn rate - Ask product people
// - Cost burn - Ask product people
// - Total budget - Estimated costing, confirm from product people
// - Margin - custom_percentage_estimated_profit , Confirm from product people
// - start date - Expected or actual - ask product people
// - next milestone date - custom_next_milestone_details has a dated field 
// - end date - Expected or actual - ask product people
// - project manager avatar - make a get call with custom_project_manager
// - lead engineer avatar - make a get call with custom_engineering_manager
// - project type - custom billing or project type - Ask product people
// - client name - customer link field, make api call to get name
// - contract end-date - Expected or actual - ask product people


