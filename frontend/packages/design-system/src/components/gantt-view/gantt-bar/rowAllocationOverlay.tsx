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
import {
  BAR_HEIGHT,
  BAR_MARGIN,
  CELL_HEIGHT,
  FULL_DAY_HOURS,
} from "../constants";
import { useGanttStore } from "../ganttStore";
import type { AllocationCallbackData } from "../types";
import { getBarDateRange, isColumnOccupied, type DraftBarSeed } from "../utils";
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
  allocations: OccupyingAllocation[];
  createDraftBar: (left: number) => DraftBarSeed;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
}

type CreateInteraction = {
  pointerId: number;
  startX: number;
  draft: DraftBarSeed;
};

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function snapValue(rawValue: number, unit: number) {
  return Math.round(rawValue / unit) * unit;
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
  { enabled, rowKey, allocations, createDraftBar, onOpenAllocation },
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

  const [draft, setDraft] = useState<DraftBarSeed | null>(null);
  const [hoveredSlotLeft, setHoveredSlotLeft] = useState<number | null>(null);
  const [isCreateDragging, setIsCreateDragging] = useState(false);

  const createInteractionRef = useRef<CreateInteraction | null>(null);

  const canAdd = enabled && draft === null;

  const removeDraft = useCallback(() => {
    setDraft(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHoveredSlotLeft(null);
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

  const openDraftAllocation = useCallback(
    (nextDraft: DraftBarSeed, width: number) => {
      if (!onOpenAllocation) {
        return;
      }

      const { startDate, endDate } = getBarDateRange({
        left: nextDraft.left,
        width,
        headerWidth,
        columnWidth,
        columnCount,
        weekStart,
        showWeekend,
      });

      onOpenAllocation({
        employeeId: nextDraft.employeeId,
        projectId: nextDraft.projectId,
        projectName: nextDraft.projectName,
        customerName: nextDraft.customerName,
        startDate,
        endDate,
        hoursPerDay: FULL_DAY_HOURS,
        onSuccess: removeDraft,
      });
    },
    [
      columnCount,
      columnWidth,
      headerWidth,
      onOpenAllocation,
      removeDraft,
      showWeekend,
      weekStart,
    ],
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

  const stopCreateInteraction = useCallback(() => {
    createInteractionRef.current = null;
    setIsCreateDragging(false);
    document.body.style.userSelect = "";
  }, []);

  const handleWindowPointerMove = useCallback(
    (event: PointerEvent) => {
      const interaction = createInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const maxWidth =
        headerWidth + columnWidth * columnCount - interaction.draft.left;
      const nextWidth = clamp(
        interaction.draft.width + (event.clientX - interaction.startX),
        columnWidth,
        maxWidth,
      );

      setDraft((prev) => (prev ? { ...prev, width: nextWidth } : prev));
    },
    [columnCount, columnWidth, headerWidth],
  );

  const handleWindowPointerCancel = useCallback(() => {
    if (!createInteractionRef.current) {
      return;
    }

    stopCreateInteraction();
  }, [stopCreateInteraction]);

  const handleWindowPointerUp = useCallback(
    (event: PointerEvent) => {
      const interaction = createInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const maxWidth =
        headerWidth + columnWidth * columnCount - interaction.draft.left;
      const liveWidth = clamp(
        interaction.draft.width + (event.clientX - interaction.startX),
        columnWidth,
        maxWidth,
      );
      const snappedWidth = clamp(
        snapValue(liveWidth, columnWidth),
        columnWidth,
        maxWidth,
      );

      setDraft((prev) => (prev ? { ...prev, width: snappedWidth } : prev));
      stopCreateInteraction();
      openDraftAllocation(interaction.draft, snappedWidth);
    },
    [
      columnCount,
      columnWidth,
      headerWidth,
      openDraftAllocation,
      stopCreateInteraction,
    ],
  );

  useEffect(() => {
    if (!isCreateDragging) {
      return;
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
      document.body.style.userSelect = "";
    };
  }, [
    handleWindowPointerCancel,
    handleWindowPointerMove,
    handleWindowPointerUp,
    isCreateDragging,
  ]);

  const createDraftAtSlot = useCallback(
    (slotLeft: number) => {
      const nextDraft = createDraftBar(slotLeft);
      setHoveredSlotLeft(null);
      setDraft(nextDraft);
      return nextDraft;
    },
    [createDraftBar],
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

      const nextDraft = createDraftAtSlot(hoveredSlotLeft);
      createInteractionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        draft: nextDraft,
      };
      setIsCreateDragging(true);
      document.body.style.userSelect = "none";
    },
    [createDraftAtSlot, hoveredSlotLeft],
  );

  const handleAddButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail !== 0 || hoveredSlotLeft === null) {
        return;
      }

      const nextDraft = createDraftAtSlot(hoveredSlotLeft);
      openDraftAllocation(nextDraft, nextDraft.width);
    },
    [createDraftAtSlot, hoveredSlotLeft, openDraftAllocation],
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
          key={rowKey}
        />
      )}
    </>
  );
});
