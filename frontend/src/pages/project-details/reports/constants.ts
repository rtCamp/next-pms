export const REPORT_API = "/api/v2/method/next_pms.api.generate_pm_report";

/** How often the reports refresh while one is generating. */
export const REPORT_POLL_MS = 30_000;

export interface ReportColumn {
  key: "index" | "dateRange" | "generatedOn" | "status" | "reportLink";
  label: string;
  /** A CSS grid track size. */
  width: string;
  align?: "right";
}

export const REPORT_COLUMNS: ReportColumn[] = [
  { key: "index", label: "#", width: "48px" },
  { key: "dateRange", label: "Date Range", width: "190px" },
  { key: "generatedOn", label: "Generated On", width: "160px" },
  { key: "status", label: "Status", width: "minmax(0,1fr)" },
  { key: "reportLink", label: "Report", width: "80px", align: "right" },
];
