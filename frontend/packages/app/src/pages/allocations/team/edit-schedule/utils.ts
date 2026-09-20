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
import { EDIT_SCHEDULE_APPLY_MODES } from "@/pages/allocations/constants";
import type {
  AvailabilityByDate,
  DayAvailability,
} from "@/pages/allocations/types";
import {
  getReducingFactor,
  isLeaveOwnedOverride,
  type AllocationOverrideEntry,
} from "@/pages/allocations/utils";
import type {
  DayItem,
  EditScheduleApplyMode,
  EditScheduleDraft,
  EditScheduleValueMode,
  PreviewRow,
} from "./types";

/**
 * Formats a number to a string with up to 2 decimal places, removing trailing zeros.
 */
export const toDisplayHours = (value: number): string =>
  String(Number(value.toFixed(2)));

/**
 * Normalizes a TanStack field error into a displayable message string.
 */
export const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return undefined;
};

/**
 * Type guard for the recurring edit-schedule apply mode.
 */
export const isEditScheduleApplyMode = (
  value: string,
): value is EditScheduleApplyMode =>
  EDIT_SCHEDULE_APPLY_MODES.has(value as EditScheduleApplyMode);

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
const getDayCount = (startDate: string, endDate: string): number => {
  const safe = normalizeRange(startDate, endDate);
  return (
    differenceInCalendarDays(parseISO(safe.endDate), parseISO(safe.startDate)) +
    1
  );
};

/**
 * Lists every calendar date in an inclusive range as `yyyy-MM-dd` strings.
 */
const getDateKeysInRange = (startDate: string, endDate: string): string[] =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, "yyyy-MM-dd"));

/**
 * Calculates the total hours for a given date range and hours per day.
 */
export const getRangeHours = (
  startDate: string,
  endDate: string,
  hoursPerDay: number,
): number => getDayCount(startDate, endDate) * hoursPerDay;

/**
 * Names what a day is, wording it the way the timeline does.
 */
const getDayOffLabel = (day: DayAvailability): string => {
  if (day.isHoliday) {
    return day.holidayName || "Holiday";
  }

  return day.availabilityFactor > 0 ? "Half day off" : "Day off";
};

/**
 * The hours a single day books today, reading its override before the allocation default.
 */
const resolveDayHours = (
  dayOverride: AllocationOverrideEntry | undefined,
  defaultHoursPerDay: number,
): number =>
  dayOverride?.cancelled === 1 ? 0 : (dayOverride?.hours ?? defaultHoursPerDay);

/**
 * Returns the hours per day to seed the input with, preferring the anchor date's value
 * if the selected dates are not uniform.
 */
export const getSeedHoursPerDay = ({
  dates,
  anchorDate,
  defaultHoursPerDay,
  override = [],
  lockedDates = new Set(),
}: {
  dates: string[];
  anchorDate: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  lockedDates?: Set<string>;
}): number => {
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));
  const hoursByDate = new Map<string, number>();

  for (const date of dates) {
    if (lockedDates.has(date)) {
      continue;
    }

    hoursByDate.set(
      date,
      resolveDayHours(overrideByDate.get(date), defaultHoursPerDay),
    );
  }

  const hours = [...hoursByDate.values()];

  if (hours.length === 0) {
    return defaultHoursPerDay;
  }

  return hours.every((value) => value === hours[0])
    ? hours[0]
    : (hoursByDate.get(anchorDate) ?? hours[0]);
};

/**
 * Sums the given dates in whole-day terms. A day the employee is partly away books its
 * share of the hours-per-day, so it weighs its availability factor rather than a full day,
 * which keeps a total the user types and the total the allocation saves in step.
 */
const getEffectiveDayCount = (
  dates: string[],
  availability: AvailabilityByDate = {},
  includeHolidays = false,
): number =>
  dates.reduce(
    (total, date) =>
      total + getReducingFactor(availability[date], includeHolidays),
    0,
  );

/**
 * Calculates hours per day from a total hours value spread over the days it covers.
 */
const getHoursPerDayFromTotalHours = (
  totalHours: number,
  effectiveDayCount: number,
): number => (effectiveDayCount > 0 ? totalHours / effectiveDayCount : 0);

/**
 * Formats a date range into a human-readable string.
 */
export const formatRange = (
  startDate: string,
  endDate?: string | null,
  variant: "date" | "day" = "date",
): string => {
  const safe = normalizeRange(startDate, endDate ?? startDate);

  if (variant === "day") {
    const start = format(parseISO(safe.startDate), "EEE");

    if (safe.startDate === safe.endDate) {
      return start;
    }

    return `${start} - ${format(parseISO(safe.endDate), "EEE")}`;
  }

  if (safe.startDate === safe.endDate) {
    return format(parseISO(safe.startDate), "MMM d");
  }

  const start = parseISO(safe.startDate);
  const end = parseISO(safe.endDate);

  return isSameMonth(start, end)
    ? `${format(start, "MMM d")} - ${format(end, "d")}`
    : `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
};

/**
 * Formats a set of individually picked dates, collapsing consecutive dates into a range
 * so a week-long pick still reads as "Sep 15 - 19".
 */
export const formatSelectedDates = (dates: string[]): string => {
  const sorted = [...dates].sort();
  const groups: string[][] = [];

  for (const date of sorted) {
    const currentGroup = groups[groups.length - 1];
    const previous = currentGroup?.[currentGroup.length - 1];

    if (
      currentGroup &&
      previous &&
      differenceInCalendarDays(parseISO(date), parseISO(previous)) === 1
    ) {
      currentGroup.push(date);
      continue;
    }

    groups.push([date]);
  }

  return groups
    .map((group) => formatRange(group[0], group[group.length - 1]))
    .join(", ");
};

/**
 * Determines which dates are locked based on availability and the includeHolidays flag.
 */
export const getLockedDates = (
  availability: AvailabilityByDate,
  includeHolidays = false,
): Set<string> =>
  new Set(
    Object.entries(availability)
      .filter(([, day]) =>
        day.isHoliday ? !includeHolidays : day.availabilityFactor === 0,
      )
      .map(([date]) => date),
  );

/**
 * Generates an array of DayItem objects representing each day in a given date range,
 * including labels for the day of the week and month boundaries.
 */
export const buildDays = (
  rangeStart: string,
  rangeEnd: string,
  availability: AvailabilityByDate = {},
  lockedDates: Set<string> = new Set(),
): DayItem[] => {
  const safe = normalizeRange(rangeStart, rangeEnd);
  const start = parseISO(safe.startDate);
  const dayCount = getDayCount(safe.startDate, safe.endDate);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(start, index);
    const prev = index > 0 ? addDays(start, index - 1) : null;
    const isMonthBoundary = !prev || !isSameMonth(prev, date);
    const dateKey = format(date, "yyyy-MM-dd");
    const dayOff = availability[dateKey];

    return {
      date: dateKey,
      dayLabel: format(date, "EEE"),
      dayNumber: Number(format(date, "d")),
      monthLabel: isMonthBoundary
        ? format(date, "MMM").toUpperCase()
        : undefined,
      isMonthBoundary,
      ...(dayOff ? { dayOffTooltip: getDayOffLabel(dayOff) } : {}),
      ...(lockedDates.has(dateKey) ? { isLocked: true } : {}),
    };
  });
};

/**
 * Whether the picked dates cover every day the strip lets the user pick, which makes the edit
 * a change of the allocation's base hours. A locked day cannot be picked and the backend
 * re-derives it from the base, so it counts as covered.
 */
const coversEverySelectableDay = (
  rangeStart: string,
  rangeEnd: string,
  selectedDates: Set<string>,
  lockedDates: Set<string>,
): boolean =>
  selectedDates.size > 0 &&
  getDateKeysInRange(rangeStart, rangeEnd).every(
    (date) => selectedDates.has(date) || lockedDates.has(date),
  );

/**
 * Builds preview rows for the schedule summary, applying stored overrides first and
 * then layering the current in-modal selection on top.
 *
 * A leave day can be selected like any other: the backend stores the typed value as a manual
 * override and stops re-deriving it from the leave. Until one is typed the day reports its
 * share of the base hours, which is what the allocation books for it today.
 */
export const buildPreviewRows = ({
  rangeStart,
  rangeEnd,
  defaultHoursPerDay,
  override = [],
  availability = {},
  lockedDates = new Set(),
  includeHolidays = false,
  selection,
  isBaseHoursEdit,
}: {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
  lockedDates?: Set<string>;
  includeHolidays?: boolean;
  selection?: {
    dates: string[];
    hoursPerDay: number;
  } | null;
  isBaseHoursEdit: boolean;
}): PreviewRow[] => {
  const rows: PreviewRow[] = [];
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));
  const selectedDates = new Set(selection?.dates ?? []);

  let currentRow: PreviewRow | null = null;

  for (const dateKey of getDateKeysInRange(rangeStart, rangeEnd)) {
    const dayOverride = overrideByDate.get(dateKey);
    const dayOff = availability[dateKey];
    const dayOffLabel = dayOff ? getDayOffLabel(dayOff) : undefined;
    const inSelection = !lockedDates.has(dateKey) && selectedDates.has(dateKey);
    // The hours-per-day the allocation books for this day, ignoring the selection.
    const baseHoursPerDay =
      isBaseHoursEdit && selection ? selection.hoursPerDay : defaultHoursPerDay;
    // A manual override outranks the leave, so only a day still owned by it is reported at its reduced share of the base hours.
    const currentHoursPerDay =
      dayOff && (!dayOverride || isLeaveOwnedOverride(dayOverride))
        ? baseHoursPerDay * getReducingFactor(dayOff, includeHolidays)
        : resolveDayHours(dayOverride, defaultHoursPerDay);
    const hoursPerDay =
      inSelection && selection ? selection.hoursPerDay : currentHoursPerDay;
    const isModified = inSelection && hoursPerDay !== currentHoursPerDay;

    if (
      currentRow &&
      currentRow.hoursPerDay === hoursPerDay &&
      currentRow.isSelected === inSelection &&
      currentRow.dayOffLabel === dayOffLabel
    ) {
      currentRow.endDate = dateKey;
      currentRow.isModified = currentRow.isModified || isModified;
      continue;
    }

    currentRow = {
      startDate: dateKey,
      endDate: dateKey,
      hoursPerDay,
      isSelected: inSelection,
      isModified,
      ...(dayOffLabel ? { dayOffLabel } : {}),
    };
    rows.push(currentRow);
  }

  return rows;
};

/**
 * Builds the full derived schedule state for the edit modal from the current selection
 * and hours/total input.
 */
export const buildScheduleDraft = ({
  rangeStart,
  rangeEnd,
  defaultHoursPerDay,
  override = [],
  availability = {},
  lockedDates = new Set(),
  includeHolidays = false,
  schedule,
}: {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
  lockedDates?: Set<string>;
  includeHolidays?: boolean;
  schedule: {
    selection: string[];
    input: {
      value: number;
      mode: EditScheduleValueMode;
    };
  };
}): EditScheduleDraft => {
  const selection = [...schedule.selection]
    .filter((date) => !lockedDates.has(date))
    .sort();
  const hasSelection = selection.length > 0;
  const isBaseHoursEdit = coversEverySelectableDay(
    rangeStart,
    rangeEnd,
    new Set(selection),
    lockedDates,
  );
  const effectiveDayCount = isBaseHoursEdit
    ? getEffectiveDayCount(
        getDateKeysInRange(rangeStart, rangeEnd),
        availability,
        includeHolidays,
      )
    : selection.length;
  const hoursPerDay = hasSelection
    ? schedule.input.mode === "totalHours"
      ? getHoursPerDayFromTotalHours(schedule.input.value, effectiveDayCount)
      : schedule.input.value
    : defaultHoursPerDay;
  const totalHours = hasSelection
    ? schedule.input.mode === "totalHours"
      ? schedule.input.value
      : effectiveDayCount * schedule.input.value
    : getRangeHours(rangeStart, rangeEnd, defaultHoursPerDay);
  const previewRows = buildPreviewRows({
    rangeStart,
    rangeEnd,
    defaultHoursPerDay,
    override,
    availability,
    lockedDates,
    includeHolidays,
    selection: hasSelection ? { dates: selection, hoursPerDay } : null,
    isBaseHoursEdit,
  });

  return {
    selection,
    hasSelection,
    hoursPerDay,
    totalHours,
    previewRows,
    headerRangeLabel: hasSelection
      ? formatSelectedDates(selection)
      : formatRange(rangeStart, rangeEnd),
  };
};
