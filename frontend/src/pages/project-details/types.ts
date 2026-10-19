/** The fields of a `Project` this page reads. */
export interface ProjectDoc {
  name: string;
  project_name: string;
  modified: string;
  custom_enable_project_report_generation?: 0 | 1;
}
