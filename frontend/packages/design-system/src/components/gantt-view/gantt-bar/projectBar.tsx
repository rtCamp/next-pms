import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { GanttBar } from "./ganttBar";

interface GanttProjectBarProps {
  allocation: ProjectAllocationBar;
}

export function GanttProjectBar({ allocation }: GanttProjectBarProps) {
  const { headerWidth } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
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
    />
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
