import { dayjs } from "frappe-ui";
import { dateKeysInRange } from "./overrides";
import { dayHours, isLeaveOwnedOverride, reducingFactor } from "./segments";
import type {
  AllocationOverrideEntry,
  AvailabilityByDate,
  DayAvailability,
} from "./types";

/** One day chip of the Edit schedule strip. */
export interface ScheduleDay {
  date: string;
  dayLabel: string;
  dayNumber: number;
  /** Set on a month's first day in the strip, e.g. `"OCT"`. */
  monthLabel?: string;
  isMonthBoundary: boolean;
  /** Why the day is special, e.g. a holiday's name or "Half day off". */
  dayOffTooltip?: string;
  isLocked?: boolean;
}

/** A row of the Edit schedule summary: a run of days with the same hours. */
export interface SchedulePreviewRow {
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  isSelected: boolean;
  isModified: boolean;
  dayOffLabel?: string;
}

/** Whether the typed value is hours per day or a total spread over the picked days. */
export type ScheduleValueMode = "hoursPerDay" | "totalHours";

export interface ScheduleInput {
  selection: string[];
  value: number;
  mode: ScheduleValueMode;
}

/** Everything the Edit schedule dialog shows, derived from its inputs. */
export interface ScheduleDraft {
  /** Picked days that can be edited, sorted. */
  selection: string[];
  hasSelection: boolean;
  hoursPerDay: number;
  totalHours: number;
  previewRows: SchedulePreviewRow[];
  headerRangeLabel: string;
}

export interface ScheduleContext {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  availability?: AvailabilityByDate;
  lockedDates?: Set<string>;
  includeHolidays?: boolean;
  includeWeekends?: boolean;
}

/** Hours with at most two decimals and no trailing zeros, e.g. `"7.5"`. */
export function toDisplayHours(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** The range with its ends in order. */
export function normalizeRange(startDate: string, endDate: string) {
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

function isWeekendDate(date: string): boolean {
  const weekday = dayjs(date).day();
  return weekday === 0 || weekday === 6;
}

/** Whether the allocation books this day at all: a weekends-off one skips Saturday and Sunday. */
function booksDate(date: string, includeWeekends: boolean): boolean {
  return includeWeekends || !isWeekendDate(date);
}

/** Days in the range the allocation books, times the hours per day. */
export function rangeHours(
  startDate: string,
  endDate: string,
  hoursPerDay: number,
  includeWeekends = true,
): number {
  const range = normalizeRange(startDate, endDate);
  return (
    dateKeysInRange(range.startDate, range.endDate).filter((date) =>
      booksDate(date, includeWeekends),
    ).length * hoursPerDay
  );
}

/** A day off in the timeline's words. */
function dayOffLabel(day: DayAvailability): string {
  if (day.isHoliday) return day.holidayName || "Holiday";
  return day.availabilityFactor > 0 ? "Half day off" : "Day off";
}

/**
 * The hours to put in the input for the picked days: their common value, or the clicked
 * day's when they differ.
 */
export function seedHoursPerDay(options: {
  dates: string[];
  anchorDate: string;
  defaultHoursPerDay: number;
  override?: AllocationOverrideEntry[];
  lockedDates?: Set<string>;
}): number {
  const overrides = new Map(
    (options.override ?? []).map((entry) => [entry.date, entry]),
  );
  const hoursByDate = new Map<string, number>();
  for (const date of options.dates) {
    if (options.lockedDates?.has(date)) continue;
    hoursByDate.set(
      date,
      dayHours(overrides.get(date), options.defaultHoursPerDay),
    );
  }
  const hours = [...hoursByDate.values()];
  if (!hours.length) return options.defaultHoursPerDay;
  return hours.every((value) => value === hours[0])
    ? hours[0]
    : (hoursByDate.get(options.anchorDate) ?? hours[0]);
}

/**
 * The picked days counted in whole days: a half day off counts as half, so a typed total
 * and the total the allocation saves agree.
 */
function effectiveDayCount(
  dates: string[],
  availability: AvailabilityByDate,
  includeHolidays: boolean,
  includeWeekends: boolean,
): number {
  return dates.reduce(
    (total, date) =>
      booksDate(date, includeWeekends)
        ? total + reducingFactor(availability[date], includeHolidays)
        : total,
    0,
  );
}

/** A range as "Oct 19", "Oct 19 - 23" or "Oct 30 - Nov 2"; with `day`, "Mon - Fri". */
export function formatScheduleRange(
  startDate: string,
  endDate?: string | null,
  variant: "date" | "day" = "date",
): string {
  const range = normalizeRange(startDate, endDate ?? startDate);
  const start = dayjs(range.startDate);
  const end = dayjs(range.endDate);
  if (variant === "day") {
    return range.startDate === range.endDate
      ? start.format("ddd")
      : `${start.format("ddd")} - ${end.format("ddd")}`;
  }
  if (range.startDate === range.endDate) return start.format("MMM D");
  return start.isSame(end, "month")
    ? `${start.format("MMM D")} - ${end.format("D")}`
    : `${start.format("MMM D")} - ${end.format("MMM D")}`;
}

/** Picked days as ranges of consecutive days, e.g. "Oct 19 - 21, Oct 23". */
export function formatSelectedDates(dates: string[]): string {
  const groups: string[][] = [];
  for (const date of [...dates].sort()) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    if (group && previous && dayjs(date).diff(previous, "day") === 1) {
      group.push(date);
    } else {
      groups.push([date]);
    }
  }
  return groups
    .map((group) => formatScheduleRange(group[0], group.at(-1)))
    .join(", ");
}

/**
 * The days the strip won't let you pick, because the allocation books nothing on them:
 * full days off (unless the allocation books holidays and leave anyway) and, for a
 * weekends-off allocation, Saturdays and Sundays. A half day off stays pickable.
 */
export function lockedScheduleDates(
  availability: AvailabilityByDate,
  includeHolidays = false,
  range?: { startDate: string; endDate: string; includeWeekends: boolean },
): Set<string> {
  const locked = new Set<string>();
  if (!includeHolidays) {
    for (const [date, day] of Object.entries(availability)) {
      if (day.availabilityFactor === 0) locked.add(date);
    }
  }
  if (range && !range.includeWeekends) {
    for (const date of dateKeysInRange(range.startDate, range.endDate)) {
      if (!booksDate(date, false)) locked.add(date);
    }
  }
  return locked;
}

/** The strip's day chips for a range. */
export function buildScheduleDays(
  rangeStart: string,
  rangeEnd: string,
  availability: AvailabilityByDate = {},
  lockedDates: Set<string> = new Set(),
): ScheduleDay[] {
  const range = normalizeRange(rangeStart, rangeEnd);
  return dateKeysInRange(range.startDate, range.endDate).map(
    (date, index, dates) => {
      const day = dayjs(date);
      const isMonthBoundary =
        index === 0 || !day.isSame(dates[index - 1], "month");
      const dayOff = availability[date];
      return {
        date,
        dayLabel: day.format("ddd"),
        dayNumber: day.date(),
        monthLabel: isMonthBoundary
          ? day.format("MMM").toUpperCase()
          : undefined,
        isMonthBoundary,
        ...(dayOff ? { dayOffTooltip: dayOffLabel(dayOff) } : {}),
        ...(lockedDates.has(date) ? { isLocked: true } : {}),
      };
    },
  );
}

/** Whether the picked days cover every day the strip lets you pick. */
function coversEverySelectableDay(
  rangeStart: string,
  rangeEnd: string,
  selected: Set<string>,
  lockedDates: Set<string>,
): boolean {
  return (
    selected.size > 0 &&
    dateKeysInRange(rangeStart, rangeEnd).every(
      (date) => selected.has(date) || lockedDates.has(date),
    )
  );
}

/**
 * The summary rows: the allocation's current hours with overrides applied, and the picked
 * days at the typed hours on top. A day the leave sync still owns shows its reduced share
 * of the hours; a manual override outranks the leave.
 */
export function buildSchedulePreviewRows(
  context: ScheduleContext & {
    selection: { dates: string[]; hoursPerDay: number } | null;
    isBaseHoursEdit: boolean;
  },
): SchedulePreviewRow[] {
  const {
    rangeStart,
    rangeEnd,
    defaultHoursPerDay,
    availability = {},
    lockedDates = new Set<string>(),
    includeHolidays = false,
    includeWeekends = true,
    selection,
    isBaseHoursEdit,
  } = context;
  const overrides = new Map(
    (context.override ?? []).map((entry) => [entry.date, entry]),
  );
  const selected = new Set(selection?.dates ?? []);
  const rows: SchedulePreviewRow[] = [];
  let row: SchedulePreviewRow | null = null;

  for (const date of dateKeysInRange(rangeStart, rangeEnd)) {
    const override = overrides.get(date);
    const dayOff = availability[date];
    const label = dayOff ? dayOffLabel(dayOff) : undefined;
    const inSelection = !lockedDates.has(date) && selected.has(date);
    const baseHours =
      isBaseHoursEdit && selection ? selection.hoursPerDay : defaultHoursPerDay;
    const currentHours = !booksDate(date, includeWeekends)
      ? 0
      : dayOff && (!override || isLeaveOwnedOverride(override))
        ? baseHours * reducingFactor(dayOff, includeHolidays)
        : dayHours(override, defaultHoursPerDay);
    const hoursPerDay =
      inSelection && selection ? selection.hoursPerDay : currentHours;
    const isModified = inSelection && hoursPerDay !== currentHours;

    if (
      row &&
      row.hoursPerDay === hoursPerDay &&
      row.isSelected === inSelection &&
      row.dayOffLabel === label
    ) {
      row.endDate = date;
      row.isModified ||= isModified;
      continue;
    }
    row = {
      startDate: date,
      endDate: date,
      hoursPerDay,
      isSelected: inSelection,
      isModified,
      ...(label ? { dayOffLabel: label } : {}),
    };
    rows.push(row);
  }
  return rows;
}

/** The Edit schedule dialog's state from the allocation and what was picked and typed. */
export function buildScheduleDraft(
  context: ScheduleContext & { input: ScheduleInput },
): ScheduleDraft {
  const {
    rangeStart,
    rangeEnd,
    defaultHoursPerDay,
    availability = {},
    lockedDates = new Set<string>(),
    includeHolidays = false,
    includeWeekends = true,
    input,
  } = context;
  const selection = input.selection
    .filter((date) => !lockedDates.has(date))
    .sort();
  const hasSelection = selection.length > 0;
  const isBaseHoursEdit = coversEverySelectableDay(
    rangeStart,
    rangeEnd,
    new Set(selection),
    lockedDates,
  );
  const dayCount = isBaseHoursEdit
    ? effectiveDayCount(
        dateKeysInRange(rangeStart, rangeEnd),
        availability,
        includeHolidays,
        includeWeekends,
      )
    : selection.length;
  const hoursPerDay = !hasSelection
    ? defaultHoursPerDay
    : input.mode === "totalHours"
      ? dayCount > 0
        ? input.value / dayCount
        : 0
      : input.value;
  const totalHours = !hasSelection
    ? rangeHours(rangeStart, rangeEnd, defaultHoursPerDay, includeWeekends)
    : input.mode === "totalHours"
      ? input.value
      : dayCount * input.value;

  return {
    selection,
    hasSelection,
    hoursPerDay,
    totalHours,
    previewRows: buildSchedulePreviewRows({
      ...context,
      selection: hasSelection ? { dates: selection, hoursPerDay } : null,
      isBaseHoursEdit,
    }),
    headerRangeLabel: hasSelection
      ? formatSelectedDates(selection)
      : formatScheduleRange(rangeStart, rangeEnd),
  };
}
