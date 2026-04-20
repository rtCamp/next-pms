import { useGanttStore } from "../ganttStore";
import type { Allocation } from "../types";
import { GanttBar } from "./ganttBar";
import { getClampedBarLayout } from "./utilities/getClampedBarLayout";
import { getNumDays } from "./utilities/getNumDays";

interface GanttProjectBarProps {
  allocation: Allocation;
}

export function GanttProjectBar({ allocation }: GanttProjectBarProps) {
  const { weekStart, showWeekend, headerWidth, columnCount } = useGanttStore(
    (s) => ({
      weekStart: s.weekStart,
      headerWidth: s.headerWidth,
      showWeekend: s.showWeekend,
      columnCount: s.columnCount,
    }),
  );

  const fullNumDays =
    getNumDays(allocation.endDate, allocation.startDate, showWeekend) + 1;
  const allocationStartCol = getNumDays(
    allocation.startDate,
    weekStart,
    showWeekend,
  );
  const allocationEndCol = getNumDays(
    allocation.endDate,
    weekStart,
    showWeekend,
  );
  const layout = getClampedBarLayout({
    allocationStartCol,
    allocationEndCol,
    columnCount,
    headerWidth,
  });

  if (!layout) {
    return null;
  }
  const label = `${allocation.hours}h/day for ${fullNumDays} day${fullNumDays !== 1 ? "s" : ""}`;

  return (
    <GanttBar
      variant="project"
      theme={allocation.tentative ? "crosshatch" : "default"}
      label={label}
      left={layout.left}
      width={layout.width}
      billable={allocation.billable}
    />
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
