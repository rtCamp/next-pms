import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";
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
  rowKey: string;
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
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
  {
    enabled,
    rowKey,
    headerWidth,
    columnWidth,
    columnCount,
    allocations,
    createDraftBar,
    onOpenAllocation,
  },
  ref,
) {
  const [draft, setDraft] = useState<DraftBarSeed | null>(null);
  const [hoveredSlotLeft, setHoveredSlotLeft] = useState<number | null>(null);
  const hasDraft = Boolean(draft);

  const clearHoveredSlot = useCallback(() => {
    setHoveredSlotLeft(null);
  }, []);

  const removeDraft = useCallback((nextRowKey: string) => {
    setDraft((currentDraft) => {
      if (!currentDraft || currentDraft.rowKey !== nextRowKey) {
        return currentDraft;
      }

      return null;
    });
  }, []);

  useEffect(() => {
    if (!enabled || hasDraft) {
      setHoveredSlotLeft(null);
    }
  }, [enabled, hasDraft]);

  const updateHoveredSlotFromPointer = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (!enabled || hasDraft) {
        setHoveredSlotLeft(null);
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-gantt-bar="true"]')
      ) {
        setHoveredSlotLeft(null);
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const barTop = Math.max((rect.height - BAR_HEIGHT) / 2, 0);
      const barBottom = barTop + Math.min(BAR_HEIGHT, rect.height);

      if (relativeY < barTop || relativeY > barBottom) {
        setHoveredSlotLeft(null);
        return;
      }

      const relativeX = event.clientX - rect.left - headerWidth;
      const dayIndex = Math.floor(relativeX / columnWidth);

      if (
        dayIndex < 0 ||
        dayIndex >= columnCount ||
        isColumnOccupied(allocations, dayIndex, columnWidth)
      ) {
        setHoveredSlotLeft(null);
        return;
      }

      const snappedLeft = headerWidth + dayIndex * columnWidth;
      setHoveredSlotLeft((prev) => (prev === snappedLeft ? prev : snappedLeft));
    },
    [allocations, columnCount, columnWidth, enabled, hasDraft, headerWidth],
  );

  const handleRowPointerDown = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        updateHoveredSlotFromPointer(event);
      }
    },
    [updateHoveredSlotFromPointer],
  );

  const handleRowPointerMove = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      updateHoveredSlotFromPointer(event);
    },
    [updateHoveredSlotFromPointer],
  );

  useImperativeHandle(
    ref,
    () => ({
      handleRowPointerDown,
      handleRowPointerMove,
      clearHoveredSlot,
    }),
    [clearHoveredSlot, handleRowPointerDown, handleRowPointerMove],
  );

  return (
    <>
      {draft ? (
        <DraftBar
          key={draft.rowKey}
          rowKey={draft.rowKey}
          left={draft.left}
          width={draft.width}
          employeeId={draft.employeeId}
          projectId={draft.projectId}
          projectName={draft.projectName}
          customerName={draft.customerName}
          onOpenAllocation={onOpenAllocation}
          onRemove={removeDraft}
        />
      ) : null}
      {!enabled || hasDraft || hoveredSlotLeft === null ? null : (
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
          onClick={() => setDraft(createDraftBar(hoveredSlotLeft))}
          icon={() => <AddMd className="size-4" />}
          key={rowKey}
        />
      )}
    </>
  );
});
