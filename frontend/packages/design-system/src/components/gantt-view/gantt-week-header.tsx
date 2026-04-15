import { addDays, format, isToday } from "date-fns";
import { CELL_WIDTH } from "./constants";
import { useGanttStore } from "./gantt-store";
import { mergeClassNames as cn } from "../../utils";

interface GanttWeekProps {
  weekIndex: number;
}

export function GanttWeekHeader({ weekIndex }: GanttWeekProps) {
  const { weekStart, daysPerWeek } = useGanttStore((s) => ({
    weekStart: s.weekStart,
    daysPerWeek: s.daysPerWeek,
    showWeekend: s.showWeekend,
  }));

  const weekStartDay = addDays(weekStart, weekIndex * 7);
  const weekEndDay = addDays(weekStartDay, daysPerWeek - 1);
  const endFormat =
    weekEndDay.getMonth() !== weekStartDay.getMonth() ? "MMM d" : "d";
  const label =
    format(weekStartDay, "MMM d") + " - " + format(weekEndDay, endFormat);

  return (
    <th
      colSpan={daysPerWeek}
      className="border border-l-0 border-outline-gray-2 bg-surface-white font-normal p-0"
      style={{
        width: daysPerWeek * CELL_WIDTH,
        maxWidth: daysPerWeek * CELL_WIDTH,
      }}
    >
      {/* Week label row */}
      <div className="border-outline-gray-2 p-0.75">
        <span className="truncate text-xs text-ink-gray-4">{label}</span>
      </div>
      {/* Day numbers row */}
      <div className="flex">
        {Array.from({ length: daysPerWeek }, (_, j) => {
          const i = weekIndex * daysPerWeek + j;
          const day = addDays(weekStart, weekIndex * 7 + j);
          const isTodayDate = isToday(day);
          return (
            <div
              key={i}
              className="relative shrink-0"
              style={{
                width: CELL_WIDTH,
                height: CELL_WIDTH,
              }}
            >
              <span
                className={cn("text-xs text-ink-gray-4 px-1.25 py-0.5", {
                  "text-white bg-surface-gray-7 rounded-[6px]": isTodayDate,
                })}
              >
                {format(day, "d")}
              </span>
              <span className="absolute bottom-0 right-0 w-1 h-1 border-r border-outline-gray-modals" />
            </div>
          );
        })}
      </div>
    </th>
  );
}
