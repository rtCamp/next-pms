import { dayjs } from "frappe-ui";
import type { TimesheetLeave } from "@/components/Timesheet";
import type { TimesheetData } from "./types";

const DATE_FORMAT = "YYYY-MM-DD";

/**
 * `existing` leaves with those overlapping `weeks` replaced by `incoming`, so leaves
 * cancelled or deleted on the server drop out when their weeks reload.
 */
export function replaceLeavesForWeeks(
  existing: TimesheetLeave[],
  incoming: TimesheetLeave[],
  weeks: { start_date: string; end_date: string }[],
): TimesheetLeave[] {
  const overlapsWeek = (leave: TimesheetLeave) =>
    weeks.some(
      (week) =>
        leave.from_date <= week.end_date && leave.to_date >= week.start_date,
    );
  const kept = existing.filter((leave) => !overlapsWeek(leave));
  const keptIds = new Set(kept.map((leave) => leave.name));
  return [...kept, ...incoming.filter((leave) => !keptIds.has(leave.name))];
}

/**
 * A week's label: "This week", "Last week", else its range, e.g. `"Oct 5 - 11, 2026"`,
 * `"Sep 28 - Oct 4, 2026"` or `"Dec 29, 2025 - Jan 4, 2026"`.
 */
export function formatTimesheetWeekLabel(
  startDate: string,
  endDate: string,
  referenceDate: string = dayjs().format(DATE_FORMAT),
): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const reference = dayjs(referenceDate);
  const previousReference = reference.subtract(1, "week");
  const contains = (date: typeof reference) =>
    !date.isBefore(start) && !date.isAfter(end);

  if (contains(reference)) return "This week";
  if (contains(previousReference)) return "Last week";
  if (start.year() === end.year() && start.month() === end.month()) {
    return `${start.format("MMM D")} - ${end.format("D, YYYY")}`;
  }
  if (start.year() === end.year()) {
    return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
  }
  return `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`;
}

/** `payload` with a label on each week; the week keys stay as they are. */
export function addWeekLabels(
  payload: TimesheetData,
  referenceDate?: string,
): TimesheetData {
  return {
    ...payload,
    data: Object.fromEntries(
      Object.entries(payload.data).map(([key, week]) => [
        key,
        {
          ...week,
          label: formatTimesheetWeekLabel(
            week.start_date,
            week.end_date,
            referenceDate,
          ),
        },
      ]),
    ),
  };
}

/**
 * `existing` with the weeks of `payload` added or replaced. Holidays are appended, as
 * the React page does; `payload` decides the leaves of the weeks it covers.
 */
export function mergeTimesheetData(
  existing: TimesheetData,
  payload: TimesheetData,
): TimesheetData {
  return {
    ...existing,
    data: { ...existing.data, ...payload.data },
    holidays: [...existing.holidays, ...payload.holidays],
    leaves: replaceLeavesForWeeks(
      existing.leaves,
      payload.leaves,
      Object.values(payload.data),
    ),
  };
}

/**
 * Where the page after `payload` starts: the day before its oldest week. A filtered page
 * can come back empty while older matches exist (`has_more`), so then it skips one full
 * window back from the date the page was requested for. `null` when nothing is left.
 */
export function nextPageStartDate(
  payload: TimesheetData | undefined,
  requestedStartDate: string | undefined,
  weeksPerPage: number,
): string | null {
  const lastWeek = Object.values(payload?.data ?? {}).at(-1);
  if (lastWeek) {
    return dayjs(lastWeek.start_date).subtract(1, "day").format(DATE_FORMAT);
  }
  if (payload?.has_more && requestedStartDate) {
    return dayjs(requestedStartDate)
      .subtract(weeksPerPage * 7, "day")
      .format(DATE_FORMAT);
  }
  return null;
}
