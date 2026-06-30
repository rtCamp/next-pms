/**
 * External dependencies.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";
import { useGanttStore } from "../ganttStore";
import { useRowAllocationDraft } from "../hooks/useRowAllocationDraft";
import type { AllocationCallbackData } from "../types";
import { isColumnOccupied, type DraftBarSeed } from "../utils";
import type { OccupyingAllocation } from "../utils";
import { DraftBar } from "./draftBar";

export interface RowAllocationOverlayHandle {
  handleRowPointerDown: (
    event: React.PointerEvent<HTMLTableRowElement>,
  ) => void;
  handleRowPointerMove: (
    event: React.PointerEvent<HTMLTableRowElement>,
  ) => void;
  clearHoveredSlot: () => void;
}

interface RowAllocationOverlayProps {
  enabled: boolean;
  allocations: OccupyingAllocation[];
  createDraftBar: (left: number) => DraftBarSeed;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
}
/**
 * forwardRef exposes an imperative handle so the parent component can forward
 * pointer events here without owning hover/draft state, keeping pointermove
 * re-renders scoped to this component instead of the whole row.
 */
export const RowAllocationOverlay = forwardRef<
  RowAllocationOverlayHandle,
  RowAllocationOverlayProps
>(function RowAllocationOverlay(
  { enabled, allocations, createDraftBar, onOpenAllocation },
  ref,
) {
  const { headerWidth, columnWidth, columnCount, weekStart, showWeekend } =
    useGanttStore((s) => ({
      headerWidth: s.headerWidth,
      columnWidth: s.columnWidth,
      columnCount: s.columnCount,
      weekStart: s.weekStart,
      showWeekend: s.showWeekend,
    }));

  const [hoveredSlotLeft, setHoveredSlotLeft] = useState<number | null>(null);

  const { draft, removeDraft, openDraftAtSlot, startCreateInteraction } =
    useRowAllocationDraft({
      createDraftBar,
      headerWidth,
      columnWidth,
      columnCount,
      maxRight: headerWidth + columnWidth * columnCount,
      weekStart,
      showWeekend,
      onOpenAllocation,
      onDraftCreated: () => {
        setHoveredSlotLeft(null);
      },
    });

  const canAdd = enabled && draft === null;

  useEffect(() => {
    if (!enabled) {
      setHoveredSlotLeft(null);
    }
  }, [enabled]);

  /**
   * Calculates the left position for a potential new allocation based on pointer position.
   */
  const getSlotLeft = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>): number | null => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-gantt-bar="true"]')
      ) {
        return null;
      }

      // Calculate the hovered day index based on pointer position, and
      // ignore if it's outside the row or over an existing allocation.
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const barTop = Math.max((rect.height - BAR_HEIGHT) / 2, 0);
      const barBottom = barTop + Math.min(BAR_HEIGHT, rect.height);
      if (relativeY < barTop || relativeY > barBottom) return null;

      const relativeX = event.clientX - rect.left - headerWidth;
      const dayIndex = Math.floor(relativeX / columnWidth);
      if (dayIndex < 0 || dayIndex >= columnCount) return null;

      if (isColumnOccupied(allocations, dayIndex, columnWidth)) {
        return null;
      }

      return headerWidth + dayIndex * columnWidth;
    },
    [allocations, columnCount, columnWidth, headerWidth],
  );

  /**
   * Updates the hovered slot for a potential new allocation based on pointer events.
   * The add button is positioned from this hovered slot and drag-to-create starts from there.
   */
  const updateHoveredSlotFromPointer = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (!canAdd) return;

      const slotLeft = getSlotLeft(event);
      setHoveredSlotLeft((prev) => (prev === slotLeft ? prev : slotLeft));
    },
    [canAdd, getSlotLeft],
  );

  const clearHoveredSlot = useCallback(() => {
    setHoveredSlotLeft(null);
  }, []);

  const handleRowPointerMove = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      updateHoveredSlotFromPointer(event);
    },
    [updateHoveredSlotFromPointer],
  );

  const handleRowPointerDown = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }

      if (!canAdd) {
        return;
      }

      const slotLeft = getSlotLeft(event);
      if (slotLeft === null) {
        return;
      }

      event.preventDefault();
      startCreateInteraction(slotLeft, event.pointerId, event.clientX);
    },
    [canAdd, getSlotLeft, startCreateInteraction],
  );

  const handleAddButtonPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (hoveredSlotLeft === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      startCreateInteraction(hoveredSlotLeft, event.pointerId, event.clientX);
    },
    [hoveredSlotLeft, startCreateInteraction],
  );

  const handleAddButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail !== 0 || hoveredSlotLeft === null) {
        return;
      }

      openDraftAtSlot(hoveredSlotLeft);
    },
    [hoveredSlotLeft, openDraftAtSlot],
  );

  useImperativeHandle(
    ref,
    () => ({ handleRowPointerDown, handleRowPointerMove, clearHoveredSlot }),
    [clearHoveredSlot, handleRowPointerDown, handleRowPointerMove],
  );

  return (
    <>
      {draft !== null && (
        <DraftBar
          key={`${draft.rowKey}-${draft.left}`}
          rowKey={draft.rowKey}
          left={draft.left}
          width={draft.width}
          employeeId={draft.employeeId}
          employeeName={draft.employeeName}
          projectId={draft.projectId}
          projectName={draft.projectName}
          customerName={draft.customerName}
          onOpenAllocation={onOpenAllocation}
          onRemove={removeDraft}
        />
      )}

      {!canAdd || hoveredSlotLeft === null ? null : (
        <Button
          type="button"
          variant="subtle"
          aria-label="Add allocation"
          className={cn(
            "absolute opacity-100 transition-opacity duration-100 ease-out motion-reduce:transition-none",
            "starting:opacity-0",
          )}
          style={{
            left: Math.max(hoveredSlotLeft + BAR_MARGIN / 2, 0),
            width: Math.max(columnWidth - BAR_MARGIN, 0),
            height: BAR_HEIGHT,
            top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
          }}
          onPointerDown={handleAddButtonPointerDown}
          onClick={handleAddButtonClick}
          icon={() => <AddMd className="size-4" />}
        />
      )}
    </>
  );
});
