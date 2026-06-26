/**
 * External dependencies.
 */
import { getTodayDate, getUTCDateTime } from "@next-pms/design-system/date";
import {
  format,
  isSameMonth,
  isSameYear,
  startOfWeek,
  subWeeks,
} from "date-fns";

/**
 * Formats the label for a timesheet week based on the start and end dates.
 * @param startDate - The start date of the week in string format.
 * @param endDate - The end date of the week in string format.
 * @param referenceDate - An optional reference date to determine "This Week" or "Last Week" labels.
 */
export const formatTimesheetWeekLabel = (
  startDate: string,
  endDate: string,
  referenceDate: string = getTodayDate(),
): string => {
  const start = getUTCDateTime(startDate);
  const end = getUTCDateTime(endDate);
  const currentWeekStart = startOfWeek(getUTCDateTime(referenceDate), {
    weekStartsOn: 0,
  });
  const previousWeekStart = startOfWeek(subWeeks(currentWeekStart, 1), {
    weekStartsOn: 0,
  });

  if (start.getTime() === currentWeekStart.getTime()) {
    return "This week";
  }

  if (start.getTime() === previousWeekStart.getTime()) {
    return "Last week";
  }

  if (isSameYear(start, end) && isSameMonth(start, end)) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }

  if (isSameYear(start, end)) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
};
