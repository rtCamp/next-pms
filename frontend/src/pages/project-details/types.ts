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

export interface ProjectRepositoryConnection {
  name: string;
  github_repository?: string;
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
}
