import { getDayDiff } from "@next-pms/design-system/date";

/**
 * Returns inclusive day count for a YYYY-MM-DD range.
 */
export const getRangeDayCount = (fromDate: string, toDate: string) => {
  if (!fromDate || !toDate || fromDate > toDate) {
    return 0;
  }

  return Math.floor(getDayDiff(fromDate, toDate)) + 1;
};

/**
 * Computes total allocated hours with a minimum day/week count of 1.
 */
export const getComputedTotalHours = (hours: number, count: number) => {
  return Number((hours * Math.max(1, count)).toFixed(2));
};
