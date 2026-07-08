export type ReportColumnKey =
  | "index"
  | "reportLink"
  | "dateRange"
  | "generatedOn"
  | "status";

export interface ReportColumn {
  key: ReportColumnKey;
  label: string;
  width: string;
  align?: "left" | "right";
}

export interface DurationPreset {
  label: string;
  range: [string, string];
}
