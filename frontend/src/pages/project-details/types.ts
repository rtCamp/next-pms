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
}
