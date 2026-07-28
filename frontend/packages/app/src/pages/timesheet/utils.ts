/**
 * External dependencies.
 */
import { getTodayDate, getUTCDateTime } from "@next-pms/design-system/date";
import { format, isSameMonth, isSameYear, subWeeks } from "date-fns";

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
  const reference = getUTCDateTime(referenceDate);
  const previousReference = subWeeks(reference, 1);

  if (start <= reference && reference <= end) {
    return "This week";
  }

  if (start <= previousReference && previousReference <= end) {
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
