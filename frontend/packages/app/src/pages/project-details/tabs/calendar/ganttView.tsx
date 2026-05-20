/**
 * External dependencies.
 */
import {
  format,
  getDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
} from "date-fns";
/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import {
  COLUMN_WIDTH,
  DAY_HEADER_HEIGHT,
  ROW_HEIGHT,
  WEEK_LABEL_HEIGHT,
} from "./constants";
import { GanttBar } from "./ganttBar";
import type { ProjectTimelineItem } from "./types";
import {
  buildColIndexMap,
  buildDayColumns,
  groupIntoWeeks,
  resolvePosition,
} from "./utils";

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
              style={{ left: x - 1 }}
            />
          ))}

          {/* Item rows */}
          {visibleItems.map((item) => {
            const pos = resolvePosition(item, dayColumns, colIndexMap);
            if (!pos) return null;
            return (
              <div
                key={item.id}
                className="relative"
                style={{ height: ROW_HEIGHT }}
              >
                <GanttBar item={item} pos={pos} totalWidth={totalWidth} />
              </div>
            );
          })}

          {visibleItems.length === 0 && (
            <div className="py-10 text-center text-sm text-ink-gray-4 relative z-10">
              No items for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
