import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { getBarDateRange, getBarDaySpan, getBarTimelineBounds } from "../utils";
import { GanttAllocationPopover } from "./allocationPopover";
import { GanttBar, type GanttBarGeometry } from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";
import { withPendingDeleteEntry } from "./utils/withPendingDeleteEntry";

interface GanttProjectBarProps {
  allocation: ProjectAllocationBar;
  resizable: boolean;
}

export function GanttProjectBar({
  allocation,
  resizable,
}: GanttProjectBarProps) {
  const projectBarRef = useRef<HTMLDivElement>(null);
  const {
    headerWidth,
    columnWidth,
    columnCount,
    weekStart,
    showWeekend,
    hasRoleAccess,
    onEditAllocation,
    onDeleteAllocation,
    setPendingDeleteEntry,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    columnCount: s.columnCount,
    weekStart: s.weekStart,
    showWeekend: s.showWeekend,
    hasRoleAccess: s.hasRoleAccess,
    onEditAllocation: s.onEditAllocation,
    onDeleteAllocation: s.onDeleteAllocation,
    setPendingDeleteEntry: s.setPendingDeleteEntry,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width, fullNumDays } = allocation;
  const [previewGeometry, setPreviewGeometry] = useState({ left, width });
  const isModified =
    previewGeometry.left !== left || previewGeometry.width !== width;

  useEffect(() => {
    setPreviewGeometry({ left, width });
  }, [left, width]);

  const currentDates = useMemo(
    () =>
      getBarDateRange({
        left: previewGeometry.left,
        width: previewGeometry.width,
        headerWidth,
        columnWidth,
        columnCount,
        weekStart,
        showWeekend,
      }),
    [
      previewGeometry.left,
      previewGeometry.width,
      headerWidth,
      columnWidth,
      columnCount,
      weekStart,
      showWeekend,
    ],
  );

  const currentDayCount = getBarDaySpan(previewGeometry.width, columnWidth);

  const bounds = useMemo(
    () =>
      getBarTimelineBounds({
        headerWidth,
        columnWidth,
        columnCount,
      }),
    [columnCount, columnWidth, headerWidth],
  );

  const label = `${allocation.hours}h/day for ${fullNumDays} day${fullNumDays !== 1 ? "s" : ""}`;

  const renderLabel = useCallback(
    ({ liveWidth }: { liveWidth: number }) => {
      const dayCount = getBarDaySpan(liveWidth, columnWidth);
      return `${allocation.hours}h/day for ${dayCount} day${dayCount !== 1 ? "s" : ""}`;
    },
    [allocation.hours, columnWidth],
  );

  const entry = withPendingDeleteEntry(
    allocationBarToEntry(
      {
        ...allocation,
        startDate: currentDates.startDate,
        endDate: currentDates.endDate,
        fullNumDays: currentDayCount,
      },
      onEditAllocation,
      onDeleteAllocation,
    ),
    setPendingDeleteEntry,
  );

  const openEditAllocation = useCallback(
    (nextLeft: number, nextWidth: number) => {
      if (!onEditAllocation) {
        return;
      }

      const { startDate, endDate } = getBarDateRange({
        left: nextLeft,
        width: nextWidth,
        headerWidth,
        columnWidth,
        columnCount,
        weekStart,
        showWeekend,
      });

      onEditAllocation({
        allocationId: allocation.id,
        employeeId: allocation.employeeId,
        projectId: allocation.projectId,
        projectName: allocation.projectName,
        startDate,
        endDate,
        hoursPerDay: allocation.hours,
        billable: allocation.billable,
        tentative: allocation.tentative,
        note: allocation.note,
      });
    },
    [
      allocation,
      columnCount,
      columnWidth,
      headerWidth,
      weekStart,
      showWeekend,
      onEditAllocation,
    ],
  );

  const handleResizeEnd = useCallback((geometry: GanttBarGeometry) => {
    setPreviewGeometry(geometry);
    projectBarRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPreviewGeometry({ left, width });
    },
    [left, width],
  );

  const handleClick = useCallback(() => {
    if (!isModified) {
      return;
    }

    openEditAllocation(previewGeometry.left, previewGeometry.width);
    setPreviewGeometry({ left, width });
  }, [
    isModified,
    left,
    openEditAllocation,
    previewGeometry.left,
    previewGeometry.width,
    width,
  ]);

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={400}
        closeDelay={150}
        render={
          <GanttBar
            ref={projectBarRef}
            variant="project"
            theme={allocation.tentative ? "crosshatch" : "default"}
            label={label}
            renderLabel={renderLabel}
            left={previewGeometry.left}
            width={previewGeometry.width}
            className="outline-none"
            billable={allocation.billable}
            resizable={resizable}
            snapUnitPx={columnWidth}
            tabIndex={0}
            minLeft={bounds.minLeft}
            maxRight={bounds.maxRight}
            onClick={isModified ? handleClick : undefined}
            onKeyDown={handleKeyDown}
            onResizeEnd={handleResizeEnd}
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
