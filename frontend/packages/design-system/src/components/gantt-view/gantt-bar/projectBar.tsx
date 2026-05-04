import { useCallback } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { getDateAtColumnIndex } from "../utils";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";

interface GanttProjectBarProps {
  allocation: ProjectAllocationBar;
  resizable: boolean;
}

export function GanttProjectBar({
  allocation,
  resizable,
}: GanttProjectBarProps) {
  const {
    headerWidth,
    columnWidth,
    columnCount,
    weekStart,
    showWeekend,
    hasRoleAccess,
    onEditAllocation,
    onDeleteAllocation,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    columnCount: s.columnCount,
    weekStart: s.weekStart,
    showWeekend: s.showWeekend,
    hasRoleAccess: s.hasRoleAccess,
    onEditAllocation: s.onEditAllocation,
    onDeleteAllocation: s.onDeleteAllocation,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width, fullNumDays } = allocation;

  const label = `${allocation.hours}h/day for ${fullNumDays} day${fullNumDays !== 1 ? "s" : ""}`;

  const entry = allocationBarToEntry(
    allocation,
    onEditAllocation,
    onDeleteAllocation,
  );

  const handleResizeEnd = useCallback(
    (nextWidth: number) => {
      if (!onEditAllocation) {
        return;
      }

      const startIndex = Math.max(
        0,
        Math.round(allocation.barOffset / columnWidth),
      );
      const nextDayCount = Math.max(1, Math.round(nextWidth / columnWidth));
      const endIndex = Math.min(columnCount - 1, startIndex + nextDayCount - 1);

      onEditAllocation({
        allocationId: allocation.id,
        employeeId: allocation.employeeId,
        projectId: allocation.projectId,
        projectName: allocation.projectName,
        startDate: allocation.startDate,
        endDate: getDateAtColumnIndex(endIndex, weekStart, showWeekend),
        hoursPerDay: allocation.hours,
        billable: allocation.billable,
        tentative: allocation.tentative,
        note: allocation.note,
      });
    },
    [
      allocation,
      columnWidth,
      columnCount,
      weekStart,
      showWeekend,
      onEditAllocation,
    ],
  );

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
        render={
          <GanttBar
            variant="project"
            theme={allocation.tentative ? "crosshatch" : "default"}
            label={label}
            left={left}
            width={width}
            billable={allocation.billable}
            resizable={resizable}
            snapUnitPx={columnWidth}
            onResizeEnd={handleResizeEnd}
            resetWidthOnResizeEnd={true}
          />
        }
      />
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="bottom" align="start" sideOffset={4}>
          <PreviewCard.Popup className="z-50 outline-none">
            <GanttAllocationPopover
              entries={[entry]}
              hasRoleAccess={hasRoleAccess}
            />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

GanttProjectBar.displayName = "GanttProjectBar";
