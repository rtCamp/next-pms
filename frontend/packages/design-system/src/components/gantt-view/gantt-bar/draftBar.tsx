/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import type { AllocationCallbackData } from "../types";
import { getBarDateRange, getBarDaySpan, getBarTimelineBounds } from "../utils";
import { GanttBar } from "./ganttBar";

interface DraftBarProps {
  rowKey: string;
  /** Absolute left position including headerWidth offset */
  left: number;
  /** Width in px for the draft span */
  width: number;
  employeeId?: string;
  projectId?: string;
  projectName?: string;
  customerName?: string;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
  onRemove?: (rowKey: string) => void;
}

/**
 * A newly placed allocation bar that the user can immediately resize before committing.
 */
export function DraftBar({
  rowKey,
  left,
  width,
  employeeId,
  projectId,
  projectName,
  customerName,
  onOpenAllocation,
  onRemove,
}: DraftBarProps) {
  const draftBarRef = useRef<HTMLDivElement>(null);
  const { headerWidth, columnWidth, columnCount, weekStart, showWeekend } =
    useGanttStore((s) => ({
      headerWidth: s.headerWidth,
      columnWidth: s.columnWidth,
      columnCount: s.columnCount,
      weekStart: s.weekStart,
      showWeekend: s.showWeekend,
    }));

  const [previewGeometry, setPreviewGeometry] = useState({ left, width });

  useEffect(() => {
    setPreviewGeometry({ left, width });
  }, [left, width]);

  useEffect(() => {
    draftBarRef.current?.focus();
  }, [rowKey]);

  const bounds = useMemo(
    () =>
      getBarTimelineBounds({
        headerWidth,
        columnWidth,
        columnCount,
      }),
    [columnCount, columnWidth, headerWidth],
  );

  /**
   * Label function that calculates hours based on the live width of the bar as it's being resized.
   */
  const renderLabel = useCallback(
    ({ liveWidth }: { liveWidth: number }) => {
      const hours = Math.max(
        getBarDaySpan(liveWidth, columnWidth) * FULL_DAY_HOURS,
        1,
      );
      return `${hours}h`;
    },
    [columnWidth],
  );

  const handleMoveEnd = useCallback((nextLeft: number) => {
    setPreviewGeometry((prev) => ({ ...prev, left: nextLeft }));
  }, []);

  const handleResizeEnd = useCallback((nextWidth: number) => {
    setPreviewGeometry((prev) => ({ ...prev, width: nextWidth }));
  }, []);

  const handleClick = useCallback(() => {
    if (!onOpenAllocation) {
      return;
    }

    const { startDate, endDate } = getBarDateRange({
      left: previewGeometry.left,
      width: previewGeometry.width,
      headerWidth,
      columnWidth,
      columnCount,
      weekStart,
      showWeekend,
    });

    onRemove?.(rowKey);
    onOpenAllocation({
      employeeId,
      projectId,
      projectName,
      customerName,
      startDate,
      endDate,
      hoursPerDay: FULL_DAY_HOURS,
    });
  }, [
    columnCount,
    columnWidth,
    customerName,
    employeeId,
    headerWidth,
    onOpenAllocation,
    onRemove,
    previewGeometry.left,
    previewGeometry.width,
    projectId,
    projectName,
    rowKey,
    showWeekend,
    weekStart,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onRemove?.(rowKey);
    },
    [onRemove, rowKey],
  );

  /**
   * Floating label that shows the end date based on the live width of the bar as it's being resized.
   */
  const renderFloatingLabel = useCallback(
    ({ liveLeft, liveWidth }: { liveLeft: number; liveWidth: number }) =>
      format(
        getBarDateRange({
          left: liveLeft,
          width: liveWidth,
          headerWidth,
          columnWidth,
          columnCount,
          weekStart,
          showWeekend,
        }).endDate,
        "MMM d",
      ),
    [headerWidth, columnWidth, columnCount, weekStart, showWeekend],
  );

  return (
    <GanttBar
      ref={draftBarRef}
      variant="draft"
      label={`${FULL_DAY_HOURS}h`}
      renderLabel={renderLabel}
      renderFloatingLabel={renderFloatingLabel}
      left={previewGeometry.left}
      width={previewGeometry.width}
      className="outline-none"
      minLeft={bounds.minLeft}
      maxRight={bounds.maxRight}
      movable={Boolean(onOpenAllocation)}
      resizable={Boolean(onOpenAllocation)}
      snapUnitPx={columnWidth}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMoveEnd={handleMoveEnd}
      onResizeEnd={handleResizeEnd}
    />
  );
}

DraftBar.displayName = "DraftBar";
