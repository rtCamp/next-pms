/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useGanttStore } from "../ganttStore";
import type { ProjectAllocationBar } from "../ganttStore";
import { getBarDateRange, getBarDaySpan, getBarTimelineBounds } from "../utils";
import { GanttAllocationPopover } from "./allocationPopover";
import {
  GanttBar,
  type GanttBarGeometry,
  type GanttBarRenderState,
} from "./ganttBar";
import { allocationBarToEntry } from "./utils/allocationBarToEntry";
import { getCapacityStatus } from "./utils/getCapacityStatus";
import { withPendingDeleteEntry } from "./utils/withPendingDeleteEntry";
import { mergeClassNames as cn } from "../../../utils";

interface GanttAllocationBarProps {
  allocation: ProjectAllocationBar;
  resizable: boolean;
  capacityHoursPerDay?: number;
  showCapacityStatus?: boolean;
}

export function GanttAllocationBar({
  allocation,
  resizable,
  capacityHoursPerDay,
  showCapacityStatus = false,
}: GanttAllocationBarProps) {
  const allocationBarRef = useRef<HTMLDivElement>(null);
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
  const resolvedDayCount = isModified ? currentDayCount : fullNumDays;
  const resolvedDates = isModified
    ? currentDates
    : {
        startDate: allocation.startDate,
        endDate: allocation.endDate,
      };

  const bounds = useMemo(
    () =>
      getBarTimelineBounds({
        headerWidth,
        columnWidth,
        columnCount,
      }),
    [columnCount, columnWidth, headerWidth],
  );

  const formatDayCountLabel = useCallback(
    (dayCount: number) =>
      `${allocation.hours}h/day for ${dayCount} day${dayCount !== 1 ? "s" : ""}`,
    [allocation.hours],
  );

  const dayCountLabel = formatDayCountLabel(resolvedDayCount);
  const capacityStatus = getCapacityStatus(
    allocation.hours,
    capacityHoursPerDay,
  );

  const renderLabel = useCallback(
    ({ isInteracting, liveWidth }: GanttBarRenderState) => {
      const dayCount = isInteracting
        ? getBarDaySpan(liveWidth, columnWidth)
        : resolvedDayCount;

      return formatDayCountLabel(dayCount);
    },
    [columnWidth, formatDayCountLabel, resolvedDayCount],
  );

  const entry = withPendingDeleteEntry(
    allocationBarToEntry(
      {
        ...allocation,
        startDate: resolvedDates.startDate,
        endDate: resolvedDates.endDate,
        fullNumDays: resolvedDayCount,
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
        customerName: allocation.customerName,
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
    allocationBarRef.current?.focus();
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
  }, [
    isModified,
    openEditAllocation,
    previewGeometry.left,
    previewGeometry.width,
  ]);

  return (
    <PreviewCard.Root>
      <Tooltip text="Click to save the allocation" disabled={!isModified}>
        <PreviewCard.Trigger
          delay={400}
          closeDelay={150}
          render={
            <GanttBar
              ref={allocationBarRef}
              variant="allocation"
              theme={allocation.tentative ? "crosshatch" : "default"}
              label={dayCountLabel}
              renderLabel={renderLabel}
              trailingLabel={
                showCapacityStatus ? capacityStatus.trailingLabel : undefined
              }
              trailingLabelVariant={
                showCapacityStatus
                  ? capacityStatus.trailingLabelVariant
                  : undefined
              }
              left={previewGeometry.left}
              width={previewGeometry.width}
              className={cn(
                "outline-none",
                isModified && "ring-1 ring-inset ring-surface-amber-3",
              )}
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
      </Tooltip>
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

GanttAllocationBar.displayName = "GanttAllocationBar";
