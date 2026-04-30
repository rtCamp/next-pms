import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { GanttBar } from "./ganttBar";

interface GanttProjectBarProps {
  allocation: ProjectAllocationBar;
  resizable: boolean;
}

export function GanttProjectBar({
  allocation,
  resizable,
}: GanttProjectBarProps) {
  const { headerWidth, columnWidth } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width, fullNumDays } = allocation;

  const label = `${allocation.hours}h/day for ${fullNumDays} day${fullNumDays !== 1 ? "s" : ""}`;

  return (
    <GanttBar
      variant="project"
      theme={allocation.tentative ? "crosshatch" : "default"}
      label={label}
      left={left}
      width={width}
      billable={allocation.billable}
      resizable={resizable}
      snapUnitPx={columnWidth}
    />
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
