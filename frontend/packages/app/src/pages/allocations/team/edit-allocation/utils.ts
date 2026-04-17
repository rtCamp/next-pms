import {
  addDays,
  eachDayOfInterval,
  format,
  isAfter,
  isValid,
  parseISO,
} from "date-fns";
import type {
  EditScheduleDayCellData,
  ScheduleSummarySegment,
  SelectionRange,
} from "./types";

/**
 * Builds day cells from a date range string pair (YYYY-MM-DD expected).
 */
export const buildScheduleDaysFromRange = (
  fromDate?: string,
  toDate?: string,
): EditScheduleDayCellData[] => {
  if (!fromDate || !toDate) {
    return [];
  }

  const start = parseISO(fromDate);
  const end = parseISO(toDate);

  if (!isValid(start) || !isValid(end) || isAfter(start, end)) {
    return [];
  }

  const days = eachDayOfInterval({ start, end });

  return days.map((day, index) => {
    const previous = index > 0 ? days[index - 1] : null;
    const isNewMonth = !previous || previous.getMonth() !== day.getMonth();

    return {
      id: format(day, "yyyy-MM-dd"),
      dayName: format(day, "EEE"),
      dayNumber: format(day, "d"),
      monthShort: format(day, "MMM"),
      monthLabel: isNewMonth ? format(day, "MMM").toUpperCase() : undefined,
      isNewMonth,
      interaction: "default",
    };
  });
};

/**
 * Builds an initial per-day hours map for the provided day list.
 */
export const getInitialPerDayHours = (
  days: EditScheduleDayCellData[],
  defaultHours: number,
) => {
  return days.reduce<Record<string, number>>((acc, day) => {
    acc[day.id] = defaultHours;
    return acc;
  }, {});
};

/**
 * Formats a date range label using day indexes from the provided day list.
 * Example: "Dec 25 - Jan 7"
 */
export const toRangeLabel = (
  days: EditScheduleDayCellData[],
  startIndex: number,
  endIndex: number,
) => {
  const start = days[startIndex];
  const end = days[endIndex];
  return `${start.monthShort} ${start.dayNumber} - ${end.monthShort} ${end.dayNumber}`;
};

/**
 * Returns the inclusive slice between two indexes, regardless of order.
 */
const getDaysBetween = (
  days: EditScheduleDayCellData[],
  startIndex: number,
  endIndex: number,
) => {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);
  return days.slice(start, end + 1);
};

/**
 * Expands a selected range into day IDs.
 */
export const getRangeDayIds = (
  days: EditScheduleDayCellData[],
  range: SelectionRange | null,
) => {
  if (!range) return [];
  return getDaysBetween(days, range.startIndex, range.endIndex).map(
    (day) => day.id,
  );
};

/**
 * Compresses day-by-day hours into contiguous summary segments.
 * Adjacent days with same hours become one summary row unless the boundary
 * crosses the currently selected range.
 */
export const getSummarySegments = (
  days: EditScheduleDayCellData[],
  perDayHours: Record<string, number>,
  defaultHours: number,
  selectedRange?: SelectionRange | null,
) => {
  const segments: ScheduleSummarySegment[] = [];

  const selectedStart = selectedRange
    ? Math.min(selectedRange.startIndex, selectedRange.endIndex)
    : -1;
  const selectedEnd = selectedRange
    ? Math.max(selectedRange.startIndex, selectedRange.endIndex)
    : -1;

  const isSelectionBoundary = (leftIndex: number, rightIndex: number) => {
    if (!selectedRange) return false;
    return (
      (leftIndex === selectedStart - 1 && rightIndex === selectedStart) ||
      (leftIndex === selectedEnd && rightIndex === selectedEnd + 1)
    );
  };

  days.forEach((day, i) => {
    const rawHours = perDayHours[day.id];
    const currentHours = Number.isFinite(rawHours) ? rawHours : defaultHours;
    const last = segments[segments.length - 1];

    if (
      !last ||
      last.hoursPerDay !== currentHours ||
      isSelectionBoundary(last.endIndex, i)
    ) {
      segments.push({
        startIndex: i,
        endIndex: i,
        daysCount: 1,
        hoursPerDay: currentHours,
      });
      return;
    }

    last.endIndex = i;
    last.daysCount += 1;
  });

  // Only exact zero-hour segments are treated as deleted from summary.
  return segments.filter((segment) => segment.hoursPerDay !== 0);
};

/**
 * Calculates total hours for either full schedule or selected range.
 * If selectedRangeHours is provided for an active range, that value is used
 * as the current editable hours source for the range total.
 */
export const getScopedTotalHours = (
  days: EditScheduleDayCellData[],
  perDayHours: Record<string, number>,
  range: SelectionRange | null,
  defaultHours: number,
) => {
  const targetDays = range
    ? getDaysBetween(days, range.startIndex, range.endIndex)
    : days;

  return Math.round(
    targetDays.reduce((sum, day) => {
      const rawHours = perDayHours[day.id];
      const hours = Number.isFinite(rawHours) ? rawHours : defaultHours;
      return sum + hours;
    }, 0),
  );
};

/**
 * Checks if two ranges represent the same start/end indexes.
 */
export const isSameRange = (
  a: SelectionRange | null,
  b: SelectionRange | null,
) => {
  if (!a || !b) return false;
  return a.startIndex === b.startIndex && a.endIndex === b.endIndex;
};

/**
 * Builds recurring info label from repeat-for days and start date.
 */
export const getRecurringInfoLabel = (
  fromDate?: string,
  repeatFor?: number,
) => {
  if (!fromDate || !repeatFor || repeatFor <= 0) {
    return "";
  }

  const start = parseISO(fromDate);
  if (!isValid(start)) {
    return "";
  }

  const weeks = Math.max(1, Math.ceil(repeatFor / 7));
  const untilDate = addDays(start, Math.max(0, repeatFor - 1));

  return `Repeats for ${weeks} week${weeks > 1 ? "s" : ""} till ${format(untilDate, "MMM d")}`;
};

/**
 * Adds recurring suffix to the last summary row.
 */
export const toRecurringSummaryLabel = (
  baseLabel: string,
  rowIndex: number,
  totalRows: number,
  repeatFor?: number,
) => {
  if (!repeatFor || repeatFor <= 0) {
    return baseLabel;
  }

  const weeks = Math.max(1, Math.ceil(repeatFor / 7));
  if (rowIndex !== totalRows - 1 || weeks <= 2) {
    return baseLabel;
  }

  return `${baseLabel} (+${weeks - 2} weeks)`;
};
