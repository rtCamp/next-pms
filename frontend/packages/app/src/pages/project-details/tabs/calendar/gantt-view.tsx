/**
 * External dependencies.
 */
import {
  eachDayOfInterval,
  endOfISOWeek,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";
import { Diamond, Zap } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import type { ProjectTimelineItem } from "./types";

// Layout constants
const COLUMN_WIDTH = 38; // px per day column
const WEEK_LABEL_HEIGHT = 30; // px – week range row
const DAY_HEADER_HEIGHT = 30; // px – day numbers row
const ROW_HEIGHT = 60; // px – each item row
const MIN_CARD_DAYS = 2; // minimum card width in days

/**
 * Build the visible day column list:
 * - Extends to full ISO weeks (Mon–Sun) at both ends of the month.
 * - Filters out Sat/Sun when showWeekend is false.
 */
function buildDayColumns(
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
function groupIntoWeeks(days: Date[]): Date[][] {
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
function buildColIndexMap(days: Date[]): Map<string, number> {
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
function nearestColIndex(
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

type ItemPosition = { left: number; width: number };

function resolvePosition(
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

export type GanttViewProps = {
  year: number;
  month: number;
  items: ProjectTimelineItem[];
  showWeekend?: boolean;
};

export function GanttView({
  year,
  month,
  items,
  showWeekend = true,
}: GanttViewProps) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const dayColumns = buildDayColumns(year, month, showWeekend);
  const colIndexMap = buildColIndexMap(dayColumns);
  const weekGroups = groupIntoWeeks(dayColumns);
  const totalWidth = dayColumns.length * COLUMN_WIDTH;

  const viewEnd = dayColumns[dayColumns.length - 1];
  const visibleItems = items.filter((item) => {
    const plannedEnd = parseISO(item.plannedEndDate);
    return (
      plannedEnd >= dayColumns[0] &&
      (item.startDate
        ? parseISO(item.startDate) <= viewEnd
        : plannedEnd <= viewEnd)
    );
  });

  // Week separator line positions (right edge of each week except last)
  const separatorXs: number[] = [];
  {
    let x = 0;
    for (let i = 0; i < weekGroups.length - 1; i++) {
      x += weekGroups[i].length * COLUMN_WIDTH;
      separatorXs.push(x);
    }
  }

  return (
    <div className="overflow-auto no-scrollbar max-h-112.5">
      <div style={{ minWidth: totalWidth }}>
        {/* Week range labels */}
        <div
          className="sticky z-20 flex bg-surface-white border-t border-outline-gray-1"
          style={{ top: 0, height: WEEK_LABEL_HEIGHT }}
        >
          {weekGroups.map((group, i) => {
            const start = group[0];
            const end = group[group.length - 1];
            const endFmt = end.getMonth() !== start.getMonth() ? "MMM d" : "d";
            const label = `${format(start, "MMM d")} - ${format(end, endFmt)}`;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center px-2 text-xs text-ink-gray-4",
                  i < weekGroups.length - 1 && "border-r border-outline-gray-1",
                )}
                style={{ width: group.length * COLUMN_WIDTH }}
              >
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Day numbers */}
        <div
          className="sticky z-20 flex bg-surface-white border-b border-outline-gray-1"
          style={{ top: WEEK_LABEL_HEIGHT, height: DAY_HEADER_HEIGHT }}
        >
          {dayColumns.map((day, i) => {
            const todayDay = isToday(day);
            const dow = getDay(day); // 0 Sun … 6 Sat
            const isWeekend = dow === 0 || dow === 6;
            // Mark last column of each week (Sun when showing weekends, Fri when not)
            const isLastInWeek = showWeekend ? dow === 0 : dow === 5;
            const isOutsideMonth = !isSameMonth(day, monthStart);
            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-center justify-center shrink-0",
                  isWeekend && showWeekend && "bg-surface-gray-1/50",
                  isLastInWeek && "border-r border-outline-gray-1",
                )}
                style={{ width: COLUMN_WIDTH, height: DAY_HEADER_HEIGHT }}
              >
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5",
                    isOutsideMonth ? "text-ink-gray-3" : "text-ink-gray-4",
                    todayDay &&
                      "bg-surface-gray-7 text-ink-white rounded-[6px]",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline body */}
        <div className="relative">
          {/* Weekend column backgrounds */}
          {showWeekend &&
            dayColumns.map((day, i) => {
              const dow = getDay(day);
              const isWeekend = dow === 0 || dow === 6;
              return isWeekend ? (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 bg-surface-gray-1/50 pointer-events-none"
                  style={{ left: i * COLUMN_WIDTH, width: COLUMN_WIDTH }}
                />
              ) : null;
            })}

          {/* Week separator lines */}
          {separatorXs.map((x) => (
            <div
              key={x}
              className="absolute top-0 bottom-0 w-px bg-outline-gray-1 pointer-events-none"
              style={{ left: x }}
            />
          ))}

          {/* Item rows */}
          {visibleItems.map((item) => {
            const pos = resolvePosition(item, dayColumns, colIndexMap);
            if (!pos) return null;
            const isMilestone = item.type === "Milestone";
            return (
              <div
                key={item.id}
                className="relative"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-1",
                    "flex items-center gap-1.5 px-2.5 rounded-md overflow-hidden mx-0.5",
                    isMilestone
                      ? "bg-surface-blue-2 text-blue-700"
                      : "bg-surface-violet-1 text-violet-700",
                  )}
                  style={{ left: pos.left, width: pos.width, height: 32 }}
                  title={item.title}
                >
                  {isMilestone ? (
                    <Diamond className="size-3.5 shrink-0" />
                  ) : (
                    <Zap className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate text-sm">{item.title}</span>
                </div>
              </div>
            );
          })}

          {visibleItems.length === 0 && (
            <div className="py-10 text-center text-sm text-ink-gray-4">
              No items for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
