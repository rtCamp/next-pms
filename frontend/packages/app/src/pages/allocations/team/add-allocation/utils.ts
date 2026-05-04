import { getDayDiff, getUTCDateTime } from "@next-pms/design-system/date";

/**
 * Returns inclusive day count for a YYYY-MM-DD range.
 * When includeWeekends is false, only Mon–Fri days are counted.
 */
export const getRangeDayCount = (
  fromDate: string,
  toDate: string,
  includeWeekends = true,
): number => {
  if (!fromDate || !toDate || fromDate > toDate) {
    return 0;
  }

  if (includeWeekends) {
    return Math.floor(getDayDiff(fromDate, toDate)) + 1;
  }

  let count = 0;
  const end = getUTCDateTime(toDate);

  for (let d = getUTCDateTime(fromDate); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
};

/**
 * Computes total allocated hours for both one-time and recurring modes and respects the includeWeekends flag.
 */
export const computeTotalHours = ({
  hoursPerDay,
  recurrence,
  fromDate,
  toDate,
  repeatFor = 0,
  includeWeekends = true,
}: {
  hoursPerDay?: number;
  recurrence: "one-time" | "recurring";
  fromDate?: string;
  toDate?: string;
  repeatFor?: number;
  includeWeekends?: boolean;
}): number => {
  const safeHoursPerDay = Number.isFinite(hoursPerDay)
    ? Number(hoursPerDay)
    : 0;
  const safeRepeatFor = Number.isFinite(repeatFor) ? Number(repeatFor) : 0;
  const safeFromDate = fromDate ?? "";
  const safeToDate = toDate ?? "";

  const dayCount =
    recurrence === "recurring"
      ? Math.max(1, safeRepeatFor) *
        getRangeDayCount(safeFromDate, safeToDate, includeWeekends)
      : includeWeekends
        ? Math.max(1, getRangeDayCount(safeFromDate, safeToDate, true))
        : getRangeDayCount(safeFromDate, safeToDate, false);

  return Number((safeHoursPerDay * dayCount).toFixed(2));
};
