export type ProjectReportStatus =
  "Generating" | "Completed" | "Failed" | "Done" | "";

/** A row of the Project's `custom_project_reports`. */
export interface ProjectReportRow {
  name?: string;
  run_id: string;
  report_link?: string;
  date_range: string;
  generated_on?: string;
  status: ProjectReportStatus;
  failure_reason?: string;
}

/** A row of the Project's `custom_project_repository_connections`. */
export interface ProjectRepositoryConnection {
  /** Absent on a row about to be added. */
  name?: string;
  /** When the row was added; a datetime, e.g. `"2026-10-21 09:30:00.000000"`. */
  creation?: string;
  /** A `GitHub Repository` name, e.g. `"rtCamp/next-pms"`. */
  github_repository?: string | null;
}

/** A row of the Project's `custom_project_budget_hours`: a contract. */
export interface ProjectBudget {
  name?: string;
  start_date: string;
  end_date: string;
  hours_purchased: number;
  consumed_hours?: number;
  remaining_hours?: number;
  sales_order?: string;
  sales_invoice?: string;
}

/** A row of the Project's `custom_project_billing_team`: a member's rate. */
export interface ProjectBillingTeam {
  name?: string;
  employee: string;
  user_name?: string;
  hourly_billing_rate?: number;
  valid_from: string;
}

/** A row of the Project's `custom_customer_contacts`. */
export interface ProjectCustomerContact {
  name?: string;
  contact: string;
}

/** The fields of a `Project` this page reads. */
export interface ProjectDoc {
  name: string;
  project_name: string;
  modified: string;
  custom_enable_project_report_generation?: 0 | 1;
  custom_project_reports?: ProjectReportRow[];
  custom_project_repository_connections?: ProjectRepositoryConnection[];
  custom_project_drive_link?: string;
  custom_slack_channel_slug?: string;
  customer?: string;
  custom_currency?: string;
  custom_project_budget_hours?: ProjectBudget[];
  custom_project_billing_team?: ProjectBillingTeam[];
  custom_billing_type?: string;
  custom_project_rag_status?: string;
  /** User ID of the project manager. */
  custom_project_manager?: string | null;
  /** Full name of the project manager. */
  custom_project_manager_name?: string | null;
  /** User ID of the lead engineer. */
  custom_engineering_manager?: string | null;
  custom_customer_contacts?: ProjectCustomerContact[];
  /** HTML, or plain text when typed in Desk (a Small Text field). */
  custom_executive_summary?: string | null;
  /** HTML. */
  custom_key_goals?: string | null;
  priority?: "Low" | "Medium" | "High" | null;
  custom_complexity?: "" | "C1" | "C2" | "C3" | null;
  custom_key_account?: "" | "Yes" | "No" | null;
  /** A `Host` name. */
  custom_host?: string | null;
  /** `Technology` names. */
  tech_stack?: { technology: string }[];
  /** A `UTM Source` name. Optional field, see `hasProjectField`. */
  custom_source?: string | null;
  /** A `Territory` name. Optional field. */
  custom_territory?: string | null;
  /** Optional field. */
  custom_previous_cms?: string | null;
  /** A `Contact` name. */
  custom_client_point_of_contact?: string | null;
  /** A `Project Time Report Frequency` name. */
  custom_time_report_frequency?: string | null;
  /** Optional field. */
  custom_restricted_under_nda?: 0 | 1 | null;
  /** Optional field. */
  custom_permission_for_case_study?: 0 | 1 | null;
  /** Optional field. */
  custom_permission_for_testimonial?: 0 | 1 | null;
  /** A `Contact` name. */
  custom_testimonial_contact?: string | null;
}
