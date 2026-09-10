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
import type { AllocationOverrideEntry } from "@/pages/allocations/utils";
import type {
  AvailabilityByDate,
  DayAvailability,
  DayItem,
  EditScheduleApplyMode,
  EditScheduleDraft,
  EditScheduleValueMode,
  EmployeeAvailabilityResponse,
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
 * Reshapes the availability payload into the camelCase map the modal works with.
 */
export const mapEmployeeAvailability = (
  response?: EmployeeAvailabilityResponse,
): AvailabilityByDate =>
  Object.fromEntries(
    Object.entries(response?.dates ?? {}).map(([date, day]) => [
      date,
      {
        availabilityFactor: day.availability_factor,
        isHoliday: day.is_holiday,
        ...(day.holiday_name ? { holidayName: day.holiday_name } : {}),
      },
    ]),
  );

/**
 * Names why a day cannot be scheduled, wording it the way the timeline does.
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
 * if the range is not uniform.
 *
 * If the range is fully unavailable, returns the allocation default.
 */
export const getSeedHoursPerDay = ({
  startDate,
  endDate,
  anchorDate,
  defaultHoursPerDay,
  override = [],
  availability = {},
}: {
  startDate: string;
  endDate: string;
  anchorDate: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
}): number => {
  const safe = normalizeRange(startDate, endDate);
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));
  const hoursByDate = new Map<string, number>();

  for (const date of eachDayOfInterval({
    start: parseISO(safe.startDate),
    end: parseISO(safe.endDate),
  })) {
    const dateKey = format(date, "yyyy-MM-dd");

    if (availability[dateKey]) {
      continue;
    }

    hoursByDate.set(
      dateKey,
      resolveDayHours(overrideByDate.get(dateKey), defaultHoursPerDay),
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
 * Counts the number of days in a range that are not marked as unavailable in the availability map.
 */
const getEditableDayCount = (
  startDate: string,
  endDate: string,
  availability: AvailabilityByDate = {},
): number => {
  const safe = normalizeRange(startDate, endDate);

  return eachDayOfInterval({
    start: parseISO(safe.startDate),
    end: parseISO(safe.endDate),
  }).filter((date) => !availability[format(date, "yyyy-MM-dd")]).length;
};

/**
 * Calculates hours per day from a total hours value for a date range.
 */
export const getHoursPerDayFromTotalHours = (
  startDate: string,
  endDate: string,
  totalHours: number,
  availability: AvailabilityByDate = {},
): number => {
  const editableDayCount = getEditableDayCount(
    startDate,
    endDate,
    availability,
  );

  return editableDayCount > 0 ? totalHours / editableDayCount : 0;
};

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
 * Generates an array of DayItem objects representing each day in a given date range,
 * including labels for the day of the week and month boundaries.
 */
export const buildDays = (
  rangeStart: string,
  rangeEnd: string,
  availability: AvailabilityByDate = {},
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
    };
  });
};

/**
 * Builds preview rows for the schedule summary, applying stored overrides first and
 * then layering the current in-modal selection on top.
 *
 * A day the employee is away is reported at its share of the base hours, which is what the
 * allocation actually books for it, and never takes the selection's value: the backend
 * re-derives those hours from the leave on every save.
 */
export const buildPreviewRows = ({
  rangeStart,
  rangeEnd,
  defaultHoursPerDay,
  override = [],
  availability = {},
  selection,
}: {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
  selection?: {
    startDate: string;
    endDate: string;
    hoursPerDay: number;
  } | null;
}): PreviewRow[] => {
  const rows: PreviewRow[] = [];
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));
  const isBaseHoursEdit = Boolean(
    selection &&
    selection.startDate <= rangeStart &&
    selection.endDate >= rangeEnd,
  );

  let currentRow: PreviewRow | null = null;

  for (const currentDate of eachDayOfInterval({
    start: parseISO(rangeStart),
    end: parseISO(rangeEnd),
  })) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayOverride = overrideByDate.get(dateKey);
    const dayOff = availability[dateKey];
    const dayOffLabel = dayOff ? getDayOffLabel(dayOff) : undefined;
    const inSelection =
      !dayOff &&
      selection !== null &&
      selection !== undefined &&
      dateKey >= selection.startDate &&
      dateKey <= selection.endDate;
    // The hours-per-day the allocation books for this day, ignoring the selection.
    const baseHoursPerDay =
      isBaseHoursEdit && selection ? selection.hoursPerDay : defaultHoursPerDay;
    const currentHoursPerDay = dayOff
      ? baseHoursPerDay * dayOff.availabilityFactor
      : resolveDayHours(dayOverride, defaultHoursPerDay);
    const hoursPerDay = inSelection
      ? selection.hoursPerDay
      : currentHoursPerDay;
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
  schedule,
}: {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
  schedule: {
    selection: {
      startDate: string;
      endDate: string;
    };
    input: {
      value: number;
      mode: EditScheduleValueMode;
    };
  };
}): EditScheduleDraft => {
  const hasSelection = Boolean(
    schedule.selection.startDate && schedule.selection.endDate,
  );
  const selection = hasSelection
    ? normalizeRange(schedule.selection.startDate, schedule.selection.endDate)
    : null;
  const hoursPerDay = selection
    ? schedule.input.mode === "totalHours"
      ? getHoursPerDayFromTotalHours(
          selection.startDate,
          selection.endDate,
          schedule.input.value,
          availability,
        )
      : schedule.input.value
    : defaultHoursPerDay;
  const totalHours = selection
    ? schedule.input.mode === "totalHours"
      ? schedule.input.value
      : getEditableDayCount(
          selection.startDate,
          selection.endDate,
          availability,
        ) * schedule.input.value
    : getRangeHours(rangeStart, rangeEnd, defaultHoursPerDay);
  const previewRows = buildPreviewRows({
    rangeStart,
    rangeEnd,
    defaultHoursPerDay,
    override,
    availability,
    selection: selection
      ? {
          startDate: selection.startDate,
          endDate: selection.endDate,
          hoursPerDay,
        }
      : null,
  });

  return {
    selection,
    hasSelection,
    hoursPerDay,
    totalHours,
    previewRows,
    headerRangeLabel: selection
      ? formatRange(selection.startDate, selection.endDate)
      : formatRange(rangeStart, rangeEnd),
    hasMeaningfulChange: previewRows.some((row) => row.isModified),
  };
};
