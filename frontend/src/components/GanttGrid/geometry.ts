import { dayjs } from "frappe-ui";
import { getWeekStart } from "@/utils/date";
import {
  CELL_WIDTH,
  MAX_STRETCH_WEEKS,
  RIGHT_TRIM_WIDTH_REDUCTION,
} from "./constants";

export interface BarGeometry {
  left: number;
  width: number;
}

/** A bar's offset from the first day column and its width, in px. */
export interface BarMetrics {
  barOffset: number;
  width: number;
}

export interface TimelineDay {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  /** First day of a weekend run in the header, for its rounded corner. */
  isWeekendStart: boolean;
  isWeekendEnd: boolean;
}

export interface TimelineWeek {
  /** e.g. "Oct 19 - 25", or "Sep 28 - Oct 4" across months. */
  label: string;
  days: TimelineDay[];
}

export interface Timeline {
  /** Monday of the first week. */
  weekStart: Date;
  daysPerWeek: number;
  columnCount: number;
  weeks: TimelineWeek[];
  /** Indexes of the Saturday and Sunday columns, when they are shown. */
  weekendColumns: number[];
}

/** The visible range a bar's geometry is measured in. */
export interface TimelineRange {
  weekStart: Date;
  showWeekend: boolean;
  columnCount: number;
  columnWidth: number;
  /** Width of the row header column, where the day columns begin. */
  headerWidth: number;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Local midnight of `date`, as milliseconds; the key used for days. */
export function dayKey(date: Date): number {
  return dayjs(date).startOf("day").valueOf();
}

/** Every day from `start` to `end`, both included, at local midnight. */
export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const last = dayjs(end).startOf("day");
  for (
    let day = dayjs(start).startOf("day");
    !day.isAfter(last);
    day = day.add(1, "day")
  ) {
    days.push(day.toDate());
  }
  return days;
}

export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, "day").toDate();
}

export function isNextDay(previous: Date, date: Date): boolean {
  return dayjs(previous).add(1, "day").isSame(date, "day");
}

/**
 * Column of `date` counted from `weekStart`; negative before it. Without weekend
 * columns, a Saturday or Sunday falls between two columns: as a bar's start it takes
 * the next Monday's column (`edge: "start"`), as its end the Friday's (`edge: "end"`).
 */
export function columnIndex(
  date: Date,
  weekStart: Date,
  showWeekend: boolean,
  edge: "start" | "end" = "start",
): number {
  const days = dayjs(date)
    .startOf("day")
    .diff(dayjs(weekStart).startOf("day"), "day");
  if (showWeekend) return days;
  const weeks = Math.floor(days / 7);
  const weekday = days - weeks * 7;
  if (weekday < 5) return weeks * 5 + weekday;
  return weeks * 5 + (edge === "start" ? 5 : 4);
}

/** Number of shown days from `start` to `end`, both included. */
export function countDays(
  start: Date,
  end: Date,
  showWeekend: boolean,
): number {
  const monday = getWeekStart(start);
  return Math.max(
    columnIndex(end, monday, showWeekend, "end") -
      columnIndex(start, monday, showWeekend, "start") +
      1,
    0,
  );
}

/** The date of a column; columns skip weekends when they aren't shown. */
export function dateAtColumn(
  index: number,
  weekStart: Date,
  showWeekend: boolean,
): Date {
  if (showWeekend) return addDays(weekStart, index);
  return addDays(weekStart, Math.floor(index / 5) * 7 + (index % 5));
}

/**
 * Where a span of columns sits in the visible range: clipped to it, and a little
 * shorter when its end is cut off. `null` when no part of it is visible.
 */
export function barMetrics(
  startCol: number,
  endCol: number,
  columnCount: number,
  columnWidth: number,
): BarMetrics | null {
  const lastCol = columnCount - 1;
  if (endCol < 0 || startCol > lastCol || endCol < startCol) return null;
  const first = Math.max(startCol, 0);
  const last = Math.min(endCol, lastCol);
  const trim = endCol > lastCol ? RIGHT_TRIM_WIDTH_REDUCTION : 0;
  return {
    barOffset: first * columnWidth,
    width: Math.max((last - first + 1) * columnWidth - trim, 0),
  };
}

/** Where a date range's bar sits in the visible range, or `null` when it is outside. */
export function rangeMetrics(
  startDate: Date,
  endDate: Date,
  range: Pick<
    TimelineRange,
    "weekStart" | "showWeekend" | "columnCount" | "columnWidth"
  >,
): BarMetrics | null {
  return barMetrics(
    columnIndex(startDate, range.weekStart, range.showWeekend, "start"),
    columnIndex(endDate, range.weekStart, range.showWeekend, "end"),
    range.columnCount,
    range.columnWidth,
  );
}

/** Number of days a bar of `width` covers; at least one. */
export function barDaySpan(width: number, columnWidth: number): number {
  return Math.max(1, Math.round(width / columnWidth));
}

/** The first and last day a bar covers, from its geometry in the row. */
export function barDateRange(
  { left, width }: BarGeometry,
  range: TimelineRange,
): { startDate: Date; endDate: Date } {
  const startIndex = Math.max(
    0,
    Math.round((left - range.headerWidth) / range.columnWidth),
  );
  const endIndex = Math.min(
    range.columnCount - 1,
    startIndex + barDaySpan(width, range.columnWidth) - 1,
  );
  return {
    startDate: dateAtColumn(startIndex, range.weekStart, range.showWeekend),
    endDate: dateAtColumn(endIndex, range.weekStart, range.showWeekend),
  };
}

/** The left and right limits of a bar in its row: the day columns. */
export function timelineBounds(range: TimelineRange): {
  minLeft: number;
  maxRight: number;
} {
  return {
    minLeft: range.headerWidth,
    maxRight: range.headerWidth + range.columnWidth * range.columnCount,
  };
}

/** Whether any bar covers part of column `index`. */
export function isColumnOccupied(
  bars: BarMetrics[],
  index: number,
  columnWidth: number,
): boolean {
  const start = index * columnWidth;
  const end = start + columnWidth;
  return bars.some(
    (bar) => bar.barOffset < end && bar.barOffset + bar.width > start,
  );
}

/** `value` kept within `min` and `max`; `min` wins when they cross. */
export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** `value` rounded to the nearest step of `unit` counted from `origin`. */
export function snapValue(value: number, unit: number, origin = 0): number {
  const step = unit > 0 ? unit : 1;
  return origin + Math.round((value - origin) / step) * step;
}

/**
 * Width of a day column: fixed for long ranges, stretched to fill the scroll area
 * (never below the fixed width) for ranges of four weeks or fewer.
 */
export function columnWidthFor(
  weekCount: number,
  daysPerWeek: number,
  headerWidth: number,
  containerWidth: number,
): number {
  if (weekCount > MAX_STRETCH_WEEKS) return CELL_WIDTH;
  const columnCount = weekCount * daysPerWeek;
  const available = Math.max(containerWidth - headerWidth, 0);
  return Math.max(
    CELL_WIDTH,
    columnCount > 0 ? Math.floor(available / columnCount) : 0,
  );
}

function weekLabel(start: Date, end: Date): string {
  const from = dayjs(start);
  const to = dayjs(end);
  return `${from.format("MMM D")} - ${to.format(from.month() === to.month() ? "D" : "MMM D")}`;
}

/** The day columns and week header of the grid. */
export function buildTimeline(options: {
  startDate: Date;
  weekCount: number;
  showWeekend: boolean;
  today?: Date;
}): Timeline {
  const { weekCount, showWeekend } = options;
  const today = options.today ?? new Date();
  const weekStart = getWeekStart(options.startDate);
  const daysPerWeek = showWeekend ? 7 : 5;
  const columnCount = weekCount * daysPerWeek;

  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
    const first = addDays(weekStart, weekIndex * 7);
    const days = Array.from({ length: daysPerWeek }, (_, dayIndex) => {
      const date = addDays(first, dayIndex);
      const weekend = isWeekend(date);
      return {
        date,
        isToday: dayjs(date).isSame(today, "day"),
        isWeekend: weekend,
        isWeekendStart: weekend && !isWeekend(addDays(date, -1)),
        isWeekendEnd: weekend && !isWeekend(addDays(date, 1)),
      };
    });
    return { label: weekLabel(first, days[days.length - 1].date), days };
  });

  return {
    weekStart,
    daysPerWeek,
    columnCount,
    weeks,
    weekendColumns: weeks.flatMap((week, weekIndex) =>
      week.days.flatMap((day, dayIndex) =>
        day.isWeekend ? [weekIndex * daysPerWeek + dayIndex] : [],
      ),
    ),
  };
}

export type ResizeEdge = "start" | "end";

/**
 * A bar's geometry while one of its edges is dragged `deltaX` px: the other edge stays
 * put, the bar stays within `minLeft` / `maxRight` and at least one `unit` wide. With
 * `snap`, the moved edge lands on a day boundary, as it does on release.
 */
export function resizeGeometry(options: {
  edge: ResizeEdge;
  origin: BarGeometry;
  deltaX: number;
  unit: number;
  minLeft: number;
  maxRight: number;
  snap?: boolean;
}): BarGeometry {
  const {
    edge,
    origin,
    deltaX,
    unit,
    minLeft,
    maxRight,
    snap = false,
  } = options;
  const minWidth = unit > 0 ? unit : 1;

  if (edge === "start") {
    const right = origin.left + origin.width;
    const raw = origin.left + deltaX;
    const left = clamp(
      snap ? snapValue(raw, unit, minLeft) : raw,
      minLeft,
      right - minWidth,
    );
    return { left, width: clamp(right - left, minWidth, maxRight - left) };
  }

  const raw = origin.width + deltaX;
  return {
    left: origin.left,
    width: clamp(
      snap ? snapValue(raw, unit) : raw,
      minWidth,
      maxRight - origin.left,
    ),
  };
}
