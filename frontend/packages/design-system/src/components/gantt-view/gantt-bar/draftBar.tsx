/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { Close } from "@rtcamp/frappe-ui-react/icons";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import type { AllocationCallbackData } from "../types";
import { getBarDateRange, getBarDaySpan, getBarTimelineBounds } from "../utils";
import {
  GanttBar,
  type GanttBarGeometry,
  type GanttBarRenderState,
} from "./ganttBar";

interface DraftBarProps {
  rowKey: string;
  left: number;
  width: number;
  employeeId?: string;
  employeeName?: string;
  projectId?: string;
  projectName?: string;
  customerName?: string;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
  onRemove?: (rowKey: string, seedLeft: number) => void;
}

export function DraftBar({
  rowKey,
  left,
  width,
  employeeId,
  employeeName,
  projectId,
  projectName,
  customerName,
  onOpenAllocation,
  onRemove,
}: DraftBarProps) {
  const draftBarRef = useRef<HTMLDivElement>(null);
  const {
    headerWidth,
    columnWidth,
    columnCount,
    weekStart,
    showWeekend,
    setActiveEdit,
    clearActiveEdit,
  } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    columnCount: s.columnCount,
    weekStart: s.weekStart,
    showWeekend: s.showWeekend,
    setActiveEdit: s.setActiveEdit,
    clearActiveEdit: s.clearActiveEdit,
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
    ({ liveWidth }: GanttBarRenderState) => {
      const hours = Math.max(
        getBarDaySpan(liveWidth, columnWidth) * FULL_DAY_HOURS,
        1,
      );

      return (
        <span className="flex min-w-0 items-center overflow-hidden">
          <span className="min-w-0 flex-1 truncate">Add allocation</span>
          <span className="shrink-0">{hours}h</span>
        </span>
      );
    },
    [columnWidth],
  );

  const openAllocationModal = useCallback(
    (modalLeft: number, modalWidth: number) => {
      if (!onOpenAllocation) {
        return;
      }

      const { startDate, endDate } = getBarDateRange({
        left: modalLeft,
        width: modalWidth,
        headerWidth,
        columnWidth,
        columnCount,
        weekStart,
        showWeekend,
      });

      onOpenAllocation({
        employeeId,
        employeeName,
        projectId,
        projectName,
        customerName,
        startDate,
        endDate,
        hoursPerDay: FULL_DAY_HOURS,
        onSuccess: () => onRemove?.(rowKey, left),
      });
    },
    [
      columnCount,
      columnWidth,
      customerName,
      employeeId,
      employeeName,
      headerWidth,
      left,
      onOpenAllocation,
      onRemove,
      projectId,
      projectName,
      rowKey,
      showWeekend,
      weekStart,
    ],
  );

  const handleResizeEnd = useCallback(
    (geometry: GanttBarGeometry) => {
      setPreviewGeometry(geometry);
      openAllocationModal(geometry.left, geometry.width);
    },
    [openAllocationModal],
  );

  const handleResetDraft = useCallback(() => {
    onRemove?.(rowKey, left);
  }, [left, onRemove, rowKey]);

  const handleClick = useCallback(() => {
    openAllocationModal(previewGeometry.left, previewGeometry.width);
  }, [openAllocationModal, previewGeometry.left, previewGeometry.width]);

  useEffect(() => {
    const actions = { save: handleClick, discard: handleResetDraft };
    setActiveEdit(actions);

    return () => {
      clearActiveEdit(actions);
    };
  }, [handleClick, handleResetDraft, setActiveEdit, clearActiveEdit]);

  const renderFloatingLabel = useCallback(
    ({ liveLeft, liveWidth }: GanttBarRenderState) => (
      <span className="pointer-events-none absolute inset-x-0 top-full mt-1 flex cursor-default">
        <span
          className="pointer-events-auto ml-auto flex w-max items-center gap-2 whitespace-nowrap pr-2 text-[13px] font-medium text-ink-gray-6"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="flex items-center gap-1">
            <Button
              onClick={handleResetDraft}
              variant="ghost"
              icon={() => <Close className="size-4" />}
            />
            <span>
              {format(
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
              )}
            </span>
          </span>
        </span>
      </span>
    ),
    [
      columnCount,
      columnWidth,
      handleResetDraft,
      headerWidth,
      showWeekend,
      weekStart,
    ],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleResetDraft();
    },
    [handleResetDraft],
  );

  return (
    <Tooltip text="Click to add allocation" disabled={!onOpenAllocation}>
      <GanttBar
        ref={draftBarRef}
        variant="draft"
        label={`${FULL_DAY_HOURS}h`}
        renderLabel={renderLabel}
        renderFloatingLabel={renderFloatingLabel}
        left={previewGeometry.left}
        width={previewGeometry.width}
        className="outline-none z-20"
        minLeft={bounds.minLeft}
        maxRight={bounds.maxRight}
        resizable={Boolean(onOpenAllocation)}
        snapUnitPx={columnWidth}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onResizeEnd={handleResizeEnd}
      />
    </Tooltip>
  );
}

DraftBar.displayName = "DraftBar";
