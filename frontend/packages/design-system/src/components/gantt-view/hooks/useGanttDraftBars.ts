import { useCallback, useRef, useState } from "react";
import type { AllocationCallbackData } from "../types";
import {
  getDraftMeta,
  isColumnOccupied,
  type DraftBarEntry,
  type DraftBarSeed,
  type OccupyingAllocation,
} from "../utils";

type HoverAddBlock = {
  rowKey: string;
  left: number;
};

type UseGanttDraftBarsOptions = {
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
  weekStart: Date;
  showWeekend: boolean;
  onAddAllocation?: (data: AllocationCallbackData) => void;
};

/**
 * Manages hover add-blocks and draft-bar interactions for the gantt grid.
 */
export function useGanttDraftBars({
  headerWidth,
  columnWidth,
  columnCount,
  weekStart,
  showWeekend,
  onAddAllocation,
}: UseGanttDraftBarsOptions) {
  const [hoverAddBlock, setHoverAddBlock] = useState<HoverAddBlock | null>(
    null,
  );
  const [draftBars, setDraftBars] = useState<DraftBarEntry[]>([]);
  const lastResizeAtRef = useRef<Record<string, number>>({});

  const clearHoverAddBlock = useCallback(() => {
    setHoverAddBlock(null);
  }, []);

  const hasDraftForRow = useCallback(
    (rowKey: string) => {
      return draftBars.some((draft) => draft.rowKey === rowKey);
    },
    [draftBars],
  );

  const getDraftsForRow = useCallback(
    (rowKey: string) => {
      return draftBars.filter((draft) => draft.rowKey === rowKey);
    },
    [draftBars],
  );

  /**
   * Creates or replaces the draft bar for a row.
   */
  const addDraftBar = useCallback(
    (draft: DraftBarSeed) => {
      setHoverAddBlock(null);
      setDraftBars((prev) => {
        const filtered = prev.filter((entry) => entry.rowKey !== draft.rowKey);
        return [
          ...filtered,
          {
            ...draft,
            ...getDraftMeta({
              left: draft.left,
              width: draft.width,
              headerWidth,
              columnWidth,
              columnCount,
              weekStart,
              showWeekend,
            }),
          },
        ];
      });
    },
    [columnCount, columnWidth, headerWidth, showWeekend, weekStart],
  );

  /**
   * Updates draft width and recomputes its derived metadata.
   */
  const resizeDraftBar = useCallback(
    (rowKey: string, nextWidth: number) => {
      lastResizeAtRef.current[rowKey] = Date.now();
      setDraftBars((prev) =>
        prev.map((draft) =>
          draft.rowKey === rowKey
            ? {
                ...draft,
                width: nextWidth,
                ...getDraftMeta({
                  left: draft.left,
                  width: nextWidth,
                  headerWidth,
                  columnWidth,
                  columnCount,
                  weekStart,
                  showWeekend,
                }),
              }
            : draft,
        ),
      );
    },
    [columnCount, columnWidth, headerWidth, showWeekend, weekStart],
  );

  const openDraftBar = useCallback(
    (draft: DraftBarEntry) => {
      const lastResizeAt = lastResizeAtRef.current[draft.rowKey] ?? 0;
      if (Date.now() - lastResizeAt < 250) {
        return;
      }

      onAddAllocation?.({
        employeeId: draft.employeeId,
        projectId: draft.projectId,
        projectName: draft.projectName,
        startDate: draft.startDate,
        endDate: draft.endDate,
        hoursPerDay: draft.hoursPerDay,
      });

      setDraftBars((prev) =>
        prev.filter((entry) => entry.rowKey !== draft.rowKey),
      );
      setHoverAddBlock(null);
    },
    [onAddAllocation],
  );

  /**
   * Computes the hover add-block position for a row mouse move.
   */
  const handleRowMouseMove = useCallback(
    (
      event: React.MouseEvent<HTMLTableRowElement>,
      rowKey: string,
      allocations: OccupyingAllocation[],
    ) => {
      if (hasDraftForRow(rowKey)) {
        setHoverAddBlock(null);
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = event.clientX - rect.left - headerWidth;
      const dayIndex = Math.floor(relativeX / columnWidth);

      if (
        dayIndex < 0 ||
        dayIndex >= columnCount ||
        isColumnOccupied(allocations, dayIndex, columnWidth)
      ) {
        setHoverAddBlock(null);
        return;
      }

      const snappedLeft = headerWidth + dayIndex * columnWidth;
      setHoverAddBlock((prev) =>
        prev?.rowKey === rowKey && prev.left === snappedLeft
          ? prev
          : { rowKey, left: snappedLeft },
      );
    },
    [columnCount, columnWidth, hasDraftForRow, headerWidth],
  );

  return {
    hoverAddBlock,
    hasDraftForRow,
    getDraftsForRow,
    clearHoverAddBlock,
    addDraftBar,
    resizeDraftBar,
    openDraftBar,
    handleRowMouseMove,
  };
}
