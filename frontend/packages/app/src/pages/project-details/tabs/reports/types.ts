export type ReportColumnKey =
  | "index"
  | "reportLink"
  | "dateRange"
  | "generatedOn";

export interface ReportColumn {
  key: ReportColumnKey;
  label: string;
  width: string;
  align?: "left" | "right";
}

export interface PMReportEvent {
  project: string;
  doc_link?: string;
  error?: string;
}
