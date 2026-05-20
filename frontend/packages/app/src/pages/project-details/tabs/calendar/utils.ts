/**
 * External dependencies.
 */
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfISOWeek,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parseISO,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
/**
 * Internal dependencies.
 */
import { COLUMN_WIDTH, MIN_CARD_DAYS } from "./constants";
import type { ProjectTimelineItem } from "./types";

// Gantt utils

/**
 * Build the visible day column list:
 * - Extends to full ISO weeks (Mon–Sun) at both ends of the month.
 * - Filters out Sat/Sun when showWeekend is false.
 */
export function buildDayColumns(
  year: number,
  month: number,
  showWeekend: boolean,
): Date[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const viewStart = startOfISOWeek(monthStart); // Monday ≤ monthStart
  const viewEnd = endOfISOWeek(monthEnd); // Sunday ≥ monthEnd
  const all = eachDayOfInterval({ start: viewStart, end: viewEnd });
  if (showWeekend) return all;
  return all.filter((d) => {
    const dow = getDay(d);
    return dow !== 0 && dow !== 6;
  });
}

/** Split a flat day array into Monday-anchored week groups. */
export function groupIntoWeeks(days: Date[]): Date[][] {
  const groups: Date[][] = [];
  let current: Date[] = [];
  for (const day of days) {
    if (current.length > 0 && getDay(day) === 1) {
      groups.push(current);
      current = [];
    }
    current.push(day);
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

/** Build a date-string → column-index lookup map. */
export function buildColIndexMap(days: Date[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < days.length; i++) {
    map.set(format(days[i], "yyyy-MM-dd"), i);
  }
  return map;
}

/**
 * Find the column index for a date, snapping to the nearest visible column
 * when the exact date is hidden (e.g. a weekend when showWeekend is false).
 */
export function nearestColIndex(
  date: Date,
  colIndexMap: Map<string, number>,
  dayColumns: Date[],
  snapForward: boolean,
): number {
  const key = format(date, "yyyy-MM-dd");
  const exact = colIndexMap.get(key);
  if (exact !== undefined) return exact;
  // Snap to nearest visible day
  if (snapForward) {
    for (let i = 0; i < dayColumns.length; i++) {
      if (dayColumns[i] > date) return i;
    }
    return dayColumns.length - 1;
  } else {
    for (let i = dayColumns.length - 1; i >= 0; i--) {
      if (dayColumns[i] < date) return i;
    }
    return 0;
  }
}

export type ItemPosition = { left: number; width: number };

export function resolvePosition(
  item: ProjectTimelineItem,
  dayColumns: Date[],
  colIndexMap: Map<string, number>,
): ItemPosition | null {
  const plannedEnd = parseISO(item.plannedEndDate);
  const viewStart = dayColumns[0];
  const viewEnd = dayColumns[dayColumns.length - 1];

  const isInView =
    plannedEnd >= viewStart &&
    (item.startDate
      ? parseISO(item.startDate) <= viewEnd
      : plannedEnd <= viewEnd);
  if (!isInView) return null;

  const lastIdx = dayColumns.length - 1;

  if (item.startDate) {
    const rawStart = parseISO(item.startDate);
    const startIdx = Math.max(
      0,
      nearestColIndex(rawStart, colIndexMap, dayColumns, true),
    );
    const endIdx = Math.min(
      lastIdx,
      nearestColIndex(plannedEnd, colIndexMap, dayColumns, false),
    );
    if (startIdx > endIdx) return null;
    const spanCols = Math.max(MIN_CARD_DAYS, endIdx - startIdx + 1);
    return { left: startIdx * COLUMN_WIDTH, width: spanCols * COLUMN_WIDTH };
  }

  // Touchpoint or milestone without startDate: fixed-width card at plannedEndDate
  const endIdx = Math.min(
    lastIdx,
    nearestColIndex(plannedEnd, colIndexMap, dayColumns, false),
  );
  const startIdx = Math.max(0, endIdx - MIN_CARD_DAYS + 1);
  return { left: startIdx * COLUMN_WIDTH, width: MIN_CARD_DAYS * COLUMN_WIDTH };
}

// Calendar grid utils

export function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = startOfMonth(new Date(year, month, 1));
  const lastDay = endOfMonth(firstDay);

  const weekStarts = eachWeekOfInterval(
    { start: firstDay, end: lastDay },
    { weekStartsOn: 1 },
  );

  return weekStarts.map((weekStart) =>
    eachDayOfInterval({
      start: startOfWeek(weekStart, { weekStartsOn: 1 }),
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    }),
  );
}

export function getItemDateKey(item: ProjectTimelineItem): string {
  if (item.type === "Milestone") {
    return item.startDate ?? item.plannedEndDate;
  }
  return item.plannedEndDate;
}

export function groupByDate(
  items: ProjectTimelineItem[],
): Map<string, ProjectTimelineItem[]> {
  const map = new Map<string, ProjectTimelineItem[]>();
  for (const item of items) {
    const key = getItemDateKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}
