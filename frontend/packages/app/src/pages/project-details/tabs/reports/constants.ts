import { getFormatedDate } from "@next-pms/design-system/date";

import type { DurationPreset, ReportColumn } from "./types";

const daysAgo = (days: number): string =>
  getFormatedDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

export const getDurationPresets = (): DurationPreset[] => {
  const today = getFormatedDate(new Date());
  return [
    { label: "Last Week", range: [daysAgo(6), today] },
    { label: "Last 15 Days", range: [daysAgo(14), today] },
    { label: "Last Month", range: [daysAgo(29), today] },
  ];
};

export const REPORT_COLUMNS: ReportColumn[] = [
  { key: "index", label: "#", width: "48px" },
  { key: "dateRange", label: "Date Range", width: "1fr" },
  { key: "generatedOn", label: "Generated On", width: "1fr" },
  { key: "status", label: "Status", width: "80px" },
  { key: "reportLink", label: "Report", width: "80px", align: "right" },
];
