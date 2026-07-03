import type { ReportColumn } from "./types";

export const DURATION_CUSTOM = "Custom";

export const DURATION_OPTIONS = [
  { label: "Last Week", value: "Last Week" },
  { label: "Last 15 Days", value: "Last 15 Days" },
  { label: "Last Month", value: "Last Month" },
  { label: DURATION_CUSTOM, value: DURATION_CUSTOM },
];

export const DURATION_DAYS: Record<string, number> = {
  "Last Week": 7,
  "Last 15 Days": 15,
  "Last Month": 30,
};

export const GENERATE_TIMEOUT_MS = 600000;

export const REPORT_COLUMNS: ReportColumn[] = [
  { key: "index", label: "#", width: "48px" },
  { key: "reportLink", label: "Report Link", width: "1fr" },
  { key: "dateRange", label: "Date Range", width: "1fr" },
  { key: "generatedOn", label: "Generated On", width: "1fr" },
];
