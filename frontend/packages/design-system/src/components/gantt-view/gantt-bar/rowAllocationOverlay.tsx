import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
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
import type { GanttBarHandle } from "./ganttBar";

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

type BarEntry = DraftBarSeed & { ghost: boolean };

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
  const [entry, setEntry] = useState<BarEntry | null>(null);

  const entryRef = useRef<BarEntry | null>(null);
  entryRef.current = entry;

  const barRef = useRef<GanttBarHandle | null>(null);

  const hasRealDraft = entry !== null && !entry.ghost;
  const canAdd = enabled && !hasRealDraft;

  const removeEntry = useCallback(() => {
    setEntry(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setEntry((prev) => (prev?.ghost ? null : prev));
    }
  }, [enabled]);

  /**
   * Calculates the left position for a potential new allocation based on pointer
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

      const currentEntry = entryRef.current;
      const draftOccupancy =
        currentEntry && !currentEntry.ghost
          ? [
              {
                barOffset: currentEntry.left - headerWidth,
                width: currentEntry.width,
              },
            ]
          : [];

      if (
        isColumnOccupied(
          [...allocations, ...draftOccupancy],
          dayIndex,
          columnWidth,
        )
      ) {
        return null;
      }

      return headerWidth + dayIndex * columnWidth;
    },
    [allocations, columnCount, columnWidth, headerWidth],
  );

  /**
   * Updates the hovered slot for a new allocation based on pointer events, creating a ghost draft bar.
   * The ghost bar is used to track the potential new allocation without committing to it until the
   * user clicks or drags on the add button.
   */
  const updateHoverFromPointer = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (!canAdd) return;

      const slotLeft = getSlotLeft(event);

      setEntry((prev) => {
        if (prev && !prev.ghost) return prev;
        if (slotLeft === null) return null;
        if (prev?.ghost && prev.left === slotLeft) return prev;
        return { ...createDraftBar(slotLeft), width: columnWidth, ghost: true };
      });
    },
    [canAdd, columnWidth, createDraftBar, getSlotLeft],
  );

  const promoteGhost = useCallback(() => {
    setEntry((prev) => (prev?.ghost ? { ...prev, ghost: false } : prev));
  }, []);

  const clearHoveredSlot = useCallback(() => {
    setEntry((prev) => (prev?.ghost ? null : prev));
  }, []);

  const handleAddButtonPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      event.preventDefault();
      barRef.current?.startEndResize(event.pointerId, event.clientX);
      promoteGhost();
    },
    [promoteGhost],
  );

  const handleAddButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) promoteGhost();
    },
    [promoteGhost],
  );

  const handleRowPointerDown = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        updateHoverFromPointer(event);
      }
    },
    [updateHoverFromPointer],
  );

  const handleRowPointerMove = useCallback(
    (event: React.PointerEvent<HTMLTableRowElement>) => {
      updateHoverFromPointer(event);
    },
    [updateHoverFromPointer],
  );

  useImperativeHandle(
    ref,
    () => ({ handleRowPointerDown, handleRowPointerMove, clearHoveredSlot }),
    [clearHoveredSlot, handleRowPointerDown, handleRowPointerMove],
  );

  return (
    <>
      {entry !== null && (
        <DraftBar
          ref={barRef}
          key={`${entry.rowKey}-${entry.left}`}
          ghost={entry.ghost}
          rowKey={entry.rowKey}
          left={entry.left}
          width={entry.width}
          employeeId={entry.employeeId}
          projectId={entry.projectId}
          projectName={entry.projectName}
          customerName={entry.customerName}
          onOpenAllocation={onOpenAllocation}
          onRemove={removeEntry}
        />
      )}

      {canAdd && entry?.ghost && (
        <Button
          type="button"
          variant="subtle"
          aria-label="Add allocation"
          className={cn(
            "absolute opacity-100 transition-opacity duration-100 ease-out motion-reduce:transition-none",
            "starting:opacity-0",
          )}
          style={{
            left: Math.max(entry.left + BAR_MARGIN / 2, 0),
            width: Math.max(columnWidth - BAR_MARGIN, 0),
            height: BAR_HEIGHT,
            top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
          }}
          onPointerDown={handleAddButtonPointerDown}
          onClick={handleAddButtonClick}
          icon={() => <AddMd className="size-4" />}
          key={rowKey}
        />
      )}
    </>
  );
});
