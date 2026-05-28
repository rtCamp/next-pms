/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Button } from "@rtcamp/frappe-ui-react";

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
    setActiveEdit,
    clearActiveEdit,
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
    setActiveEdit: s.setActiveEdit,
    clearActiveEdit: s.clearActiveEdit,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width, fullNumDays } = allocation;
  const [previewGeometry, setPreviewGeometry] = useState({ left, width });
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const handleResetPreview = useCallback(() => {
    setPreviewGeometry({ left, width });
    setPreviewOpen(false);
    allocationBarRef.current?.focus();
  }, [left, width]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleResetPreview();
    },
    [handleResetPreview],
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

  useEffect(() => {
    if (!isModified) {
      return;
    }

    const actions = { save: handleClick, discard: handleResetPreview };
    setActiveEdit(actions);

    return () => {
      clearActiveEdit(actions);
    };
  }, [
    isModified,
    handleClick,
    handleResetPreview,
    setActiveEdit,
    clearActiveEdit,
  ]);

  const renderFloatingLabel = useCallback(() => {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-full mt-1 flex cursor-default">
        <div
          className="pointer-events-auto ml-auto flex w-max gap-1 items-center whitespace-nowrap text-[13px] font-medium text-ink-gray-6"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <Button onClick={handleResetPreview} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleClick} variant="solid">
            Save
          </Button>
        </div>
      </div>
    );
  }, [handleClick, handleResetPreview]);

  return (
    <PreviewCard.Root
      open={isModified ? false : previewOpen}
      onOpenChange={setPreviewOpen}
    >
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
            className={cn("outline-none", isModified && "z-20")}
            billable={allocation.billable}
            showOutline={isModified}
            renderFloatingLabel={isModified ? renderFloatingLabel : undefined}
            resizable={resizable}
            snapUnitPx={columnWidth}
            tabIndex={0}
            minLeft={bounds.minLeft}
            maxRight={bounds.maxRight}
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

GanttAllocationBar.displayName = "GanttAllocationBar";
