/**
 * Internal dependencies.
 */
import { useGanttStore } from "../ganttStore";
import type { ProjectSummaryBar } from "../ganttStore";
import { formatHours } from "../utils";
import { GanttBar } from "./ganttBar";

interface GanttProjectSummaryBarProps {
  summary: ProjectSummaryBar;
}

export function GanttProjectSummaryBar({
  summary,
}: GanttProjectSummaryBarProps) {
  const headerWidth = useGanttStore((state) => state.headerWidth);

  return (
    <GanttBar
      variant="projectSummary"
      theme={summary.tentative ? "crosshatch" : "default"}
      label={`${formatHours(summary.hours)}h / week`}
      left={summary.barOffset + headerWidth}
      width={summary.width}
    />
  );
}

GanttProjectSummaryBar.displayName = "GanttProjectSummaryBar";
