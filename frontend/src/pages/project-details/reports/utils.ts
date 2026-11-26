import { dayjs } from "frappe-ui";
import type {
  ProjectReportRow,
  ProjectRepositoryConnection,
} from "@/pages/project-details/types";

export interface DurationPreset {
  label: string;
  range: [string, string];
}

/** The report duration shortcuts, each ending today. */
export function durationPresets(now: Date = new Date()): DurationPreset[] {
  const today = dayjs(now);
  const daysAgo = (days: number) =>
    today.subtract(days, "day").format("YYYY-MM-DD");
  const end = today.format("YYYY-MM-DD");
  return [
    { label: "Last Week", range: [daysAgo(6), end] },
    { label: "Last 15 Days", range: [daysAgo(14), end] },
    { label: "Last Month", range: [daysAgo(29), end] },
  ];
}

export interface ReportListRow extends ProjectReportRow {
  id: string;
  /** Numbered from the oldest, so the newest has the highest number. */
  index: number;
}

/** Generating reports first, then the newest generated. */
export function sortReports(reports: ProjectReportRow[]): ReportListRow[] {
  return [...reports]
    .sort((a, b) => {
      if (a.status === "Generating") return -1;
      if (b.status === "Generating") return 1;
      return (b.generated_on ?? "").localeCompare(a.generated_on ?? "");
    })
    .map((report, index) => ({
      ...report,
      id: report.run_id || `report-${index}`,
      index: reports.length - index,
    }));
}

/** The last report in the table that has a link. */
export function previousReportUrl(reports: ProjectReportRow[]): string {
  for (let index = reports.length - 1; index >= 0; index--) {
    const link = reports[index]?.report_link;
    if (link) return link;
  }
  return "";
}

export function repositoryOptions(
  connections: ProjectRepositoryConnection[] | undefined,
) {
  return (connections ?? [])
    .map((connection) => connection.github_repository)
    .filter((url): url is string => Boolean(url))
    .map((url) => ({
      label: url.replace(/\/$/, "").split("/").pop() || url,
      value: url,
    }));
}

export function formatGeneratedOn(value?: string): string {
  return value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "—";
}
