import { CELL_WIDTH } from "../constants";
import { useGanttStore } from "../gantt-store";
import type { Allocation } from "../types";
import { GanttBar } from "./gantt-bar";
import { getNumDays } from "./utilities/getNumDays";

interface GanttProjectBarProps {
  allocation: Allocation;
}

export function GanttProjectBar({ allocation }: GanttProjectBarProps) {
  const { weekStart, showWeekend, headerWidth } = useGanttStore((s) => ({
    weekStart: s.weekStart,
    headerWidth: s.headerWidth,
    showWeekend: s.showWeekend,
    columnCount: s.columnCount,
  }));

  const numDays =
    getNumDays(allocation.endDate, allocation.startDate, showWeekend) + 1;
  const left =
    getNumDays(allocation.startDate, weekStart, showWeekend) * CELL_WIDTH +
    headerWidth;
  const label = `${allocation.hours}h/day for ${numDays} day${numDays !== 1 ? "s" : ""}`;

  return (
    <GanttBar
      variant="project"
      theme={allocation.tentative ? "crosshatch" : "default"}
      label={label}
      left={left}
      width={numDays * CELL_WIDTH}
      billable={allocation.billable}
    />
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
