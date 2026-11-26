import { dayjs } from "frappe-ui";
import type {
  AllocationEventData,
  AllocationSummaryText,
  DeleteAllocationMode,
} from "@/components/GanttGrid";
import { formatISODate } from "./dateWindow";
import { rangeHours, toDisplayHours } from "./schedule";

/** The modes offered for a recurring allocation, as React labelled them. */
export const DELETE_MODE_OPTIONS: {
  label: string;
  value: DeleteAllocationMode;
}[] = [
  { label: "This allocation", value: "only_this" },
  { label: "This and future allocations", value: "this_and_future" },
  { label: "Whole series", value: "all_in_series" },
];

/**
 * The segment being deleted as its card describes it, but with a total that counts only
 * the days the allocation books: a weekends-off allocation spanning a weekend skips it.
 */
export function deleteSummary(
  data: AllocationEventData,
  summary?: AllocationSummaryText,
): AllocationSummaryText {
  const start = data.segmentStartDate ?? data.startDate;
  const end = data.segmentEndDate ?? data.endDate;
  const hours = data.segmentHoursPerDay ?? data.hoursPerDay ?? 0;
  const format = (date: Date) => dayjs(date).format("MMM D, YYYY");
  const total =
    start && end
      ? rangeHours(
          formatISODate(start),
          formatISODate(end),
          hours,
          Boolean(data.includeWeekends),
        )
      : 0;
  return {
    projectName: summary?.projectName ?? data.projectName ?? "",
    dateRange:
      summary?.dateRange ??
      (start && end ? `${format(start)} – ${format(end)}` : ""),
    hoursPerDay: summary?.hoursPerDay ?? `${toDisplayHours(hours)}h/day`,
    totalHours: `${toDisplayHours(total)} hours`,
  };
}

/** The confirmation's question. */
export function deleteMessage(summary: AllocationSummaryText): string {
  return `Are you sure you want to delete "${summary.projectName}" (${summary.dateRange}, ${summary.hoursPerDay}, ${summary.totalHours})? This cannot be undone.`;
}
