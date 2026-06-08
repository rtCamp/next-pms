/**
 * External dependencies.
 */
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";

/**
 * Internal dependencies.
 */
import type { AllocationOverrideEntry } from "@/pages/allocations/utils";
import type { DayItem, PreviewRow } from "./types";

/**
 * Formats a number to a string with up to 2 decimal places, removing trailing zeros.
 */
export const toDisplayHours = (value: number): string =>
  String(Number(value.toFixed(2)));

/**
 * Normalizes a date range to ensure the start date is less than or equal to the end date.
 */
export const normalizeRange = (startDate: string, endDate: string) =>
  startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };

/**
 * Returns the number of days in a date range, inclusive.
 */
export const getDayCount = (startDate: string, endDate: string): number => {
  const safe = normalizeRange(startDate, endDate);
  return (
    differenceInCalendarDays(parseISO(safe.endDate), parseISO(safe.startDate)) +
    1
  );
};

/**
 * Calculates the total hours for a given date range and hours per day.
 */
export const getRangeHours = (
  startDate: string,
  endDate: string,
  hoursPerDay: number,
): number => getDayCount(startDate, endDate) * hoursPerDay;

/**
 * Formats a date range into a human-readable string.
 */
export const formatRange = (
  startDate: string,
  endDate?: string | null,
): string => {
  if (!endDate) return format(parseISO(startDate), "MMM d");

  const safe = normalizeRange(startDate, endDate);

  if (safe.startDate === safe.endDate) {
    return format(parseISO(safe.startDate), "MMM d");
  }

  return `${format(parseISO(safe.startDate), "MMM d")} - ${format(parseISO(safe.endDate), "MMM d")}`;
};

/**
 * Generates an array of DayItem objects representing each day in a given date range,
 * including labels for the day of the week and month boundaries.
 */
export const buildDays = (rangeStart: string, rangeEnd: string): DayItem[] => {
  const safe = normalizeRange(rangeStart, rangeEnd);
  const start = parseISO(safe.startDate);
  const dayCount = getDayCount(safe.startDate, safe.endDate);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(start, index);
    const prev = index > 0 ? addDays(start, index - 1) : null;
    const isMonthBoundary = !prev || !isSameMonth(prev, date);

    return {
      date: format(date, "yyyy-MM-dd"),
      dayLabel: format(date, "EEE"),
      dayNumber: Number(format(date, "d")),
      monthLabel: isMonthBoundary
        ? format(date, "MMM").toUpperCase()
        : undefined,
      isMonthBoundary,
    };
  });
};

/**
 * Calculates the total hours across an array of PreviewRow objects by summing the hours for each row's date range.
 */
export const getTotalHoursForRows = (rows: PreviewRow[]): number =>
  rows.reduce(
    (sum, row) =>
      sum + getRangeHours(row.startDate, row.endDate, row.hoursPerDay),
    0,
  );

/**
 * Expands a selected range into day-level override payloads.
 */
export const buildDayOverrides = (
  startDate: string,
  endDate: string,
  hoursPerDay: number,
) =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    hours: hoursPerDay,
  }));

/**
 * Builds preview rows for the schedule summary, applying stored overrides first and
 * then layering the current in-modal selection on top.
 */
export const buildPreviewRows = ({
  rangeStart,
  rangeEnd,
  defaultHoursPerDay,
  override = [],
  selection,
}: {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  selection?: {
    startDate: string;
    endDate: string;
    hoursPerDay: number;
  } | null;
}): PreviewRow[] => {
  const rows: PreviewRow[] = [];
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));

  let currentRow: PreviewRow | null = null;

  for (const currentDate of eachDayOfInterval({
    start: parseISO(rangeStart),
    end: parseISO(rangeEnd),
  })) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayOverride = overrideByDate.get(dateKey);
    const inSelection =
      selection !== null &&
      selection !== undefined &&
      dateKey >= selection.startDate &&
      dateKey <= selection.endDate;
    const hoursPerDay = inSelection
      ? selection.hoursPerDay
      : dayOverride?.cancelled === 1
        ? 0
        : (dayOverride?.hours ?? defaultHoursPerDay);

    if (
      currentRow &&
      currentRow.hoursPerDay === hoursPerDay &&
      currentRow.isSelected === inSelection
    ) {
      currentRow.endDate = dateKey;
      currentRow.isModified =
        currentRow.isSelected && currentRow.hoursPerDay !== defaultHoursPerDay;
      continue;
    }

    currentRow = {
      startDate: dateKey,
      endDate: dateKey,
      hoursPerDay,
      isSelected: inSelection,
      isModified: inSelection && hoursPerDay !== defaultHoursPerDay,
    };
    rows.push(currentRow);
  }

  return rows;
};
