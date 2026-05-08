import type { RiskLevel } from "./cells/dot";

export type ListViewColumn = { key: string; label: string; width?: string };

export type ResponseProject = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  project_name: string;
  status: string;
  custom_key_account: string;
  project_type: string | null;
  percent_complete_method: string;
  project_template: string | null;
  priority: string;
  custom_host: string | null;
  department: string | null;
  is_active: string;
  percent_complete: number;
  expected_start_date: string | null;
  actual_start_date: string | null;
  actual_time: number;
  custom_total_hours_remaining: number;
  custom_total_hours_purchased: number;
  expected_end_date: string | null;
  actual_end_date: string | null;
  custom_complexity: string;
  custom_billing_type: string;
  estimated_costing: number;
  custom_estimated_profit: number;
  custom_default_hourly_billing_rate: number;
  total_costing_amount: number;
  total_expense_claim: number;
  total_purchase_cost: number;
  company: string;
  custom_currency: string;
  total_sales_amount: number;
  total_billable_amount: number;
  total_billed_amount: number;
  total_consumed_material_cost: number;
  cost_center: string | null;
  gross_margin: number;
  per_gross_margin: number;
  collect_progress: number;
  holiday_list: string | null;
  frequency: string;
  from_time: string | null;
  to_time: string | null;
  first_email: string | null;
  second_email: string | null;
  daily_time_to_send: string | null;
  day_to_send: string;
  weekly_time_to_send: string | null;
  subject: string | null;
  message: string | null;
  custom_send_reminder_when_approaching_project_threshold_limit: number;
  custom_reminder_threshold_percentage: number;
  custom_email_template: string | null;
  customer: string | null;
  sales_order: string | null;
  copied_from: string | null;
  notes: string | null;
  custom_percentage_estimated_profit: number;
  custom_engineering_manager_name: string | null;
  custom_project_manager_name: string | null;
  custom_next_milestone_details: string | null;
  custom_project_detail: string | null;
  custom_3rd_parties: string | null;
  custom_next_milestone: string | null;
  custom_project_manager: string | null;
  custom_project_rag_status: string;
  custom_engineering_manager: string | null;
  custom_client_point_of_contact: string | null;
  custom_percentage_estimated_cost: number;
};

export type Phase =
  | "delivery-prep"
  | "kick-off"
  | "discovery"
  | "development"
  | "launch"
  | "close-out";

export type ProjectType = "Fixed cost" | "Retainer" | "External";

export type EmployeeRef = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export type Project = {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  phase: Phase;
  burnRatePerWeek: number;
  costBurnPercent: number;
  secondaryCostBurnPercentage: number;
  totalBudget: number;
  profitMargin: number;
  startDate: string;
  nextMilestone: string;
  endDate: string;
  projectManager: EmployeeRef;
  leadEngineer: EmployeeRef;
  type: ProjectType;
  clientName: string;
  contractEndDate: string;
};
