/**
 * External dependencies.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
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
  type GanttBarHandle,
  type GanttBarRenderState,
} from "./ganttBar";

interface DraftBarProps {
  rowKey: string;
  left: number;
  width: number;
  ghost?: boolean;
  employeeId?: string;
  projectId?: string;
  projectName?: string;
  customerName?: string;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
  onRemove?: (rowKey: string, seedLeft: number) => void;
}

export const DraftBar = forwardRef<GanttBarHandle, DraftBarProps>(
  function DraftBar(
    {
      rowKey,
      left,
      width,
      ghost = false,
      employeeId,
      projectId,
      projectName,
      customerName,
      onOpenAllocation,
      onRemove,
    }: DraftBarProps,
    ref,
  ) {
    const ganttBarRef = useRef<GanttBarHandle | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => ganttBarRef.current?.focus(),
        startEndResize: (pointerId, startX) =>
          ganttBarRef.current?.startEndResize(pointerId, startX),
      }),
      [],
    );
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
      if (!ghost) ganttBarRef.current?.focus();
    }, [ghost]);

    const bounds = useMemo(
      () => getBarTimelineBounds({ headerWidth, columnWidth, columnCount }),
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

    const handleResetDraft = useCallback(() => {
      onRemove?.(rowKey, left);
    }, [left, onRemove, rowKey]);

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

    const handleClick = useCallback(() => {
      openAllocationModal(previewGeometry.left, previewGeometry.width);
    }, [openAllocationModal, previewGeometry.left, previewGeometry.width]);

    useEffect(() => {
      if (ghost) return;
      const actions = { save: handleClick, discard: handleResetDraft };
      setActiveEdit(actions);

      return () => {
        clearActiveEdit(actions);
      };
    }, [ghost, handleClick, handleResetDraft, setActiveEdit, clearActiveEdit]);

    const renderFloatingLabel = useCallback(
      ({ liveLeft, liveWidth: lw }: GanttBarRenderState) => (
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
                    width: lw,
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
          handleRef={ganttBarRef}
          variant="draft"
          label={`${FULL_DAY_HOURS}h`}
          renderLabel={ghost ? undefined : renderLabel}
          renderFloatingLabel={ghost ? undefined : renderFloatingLabel}
          left={previewGeometry.left}
          width={previewGeometry.width}
          resizable={Boolean(onOpenAllocation)}
          snapUnitPx={columnWidth}
          minLeft={bounds.minLeft}
          maxRight={bounds.maxRight}
          className={ghost ? "invisible" : "outline-none z-20"}
          tabIndex={ghost ? -1 : 0}
          onClick={ghost ? undefined : handleClick}
          onKeyDown={ghost ? undefined : handleKeyDown}
          onResizeEnd={ghost ? undefined : handleResizeEnd}
        />
      </Tooltip>
    );
  },
);

DraftBar.displayName = "DraftBar";
