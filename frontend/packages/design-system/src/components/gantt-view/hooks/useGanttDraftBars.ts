import { useCallback, useState } from "react";
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
  const handleAddDraftBar = useCallback(
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

  const handleResizeEnd = useCallback(
    (rowKey: string, nextWidth: number) => {
      const draft = draftBars.find((entry) => entry.rowKey === rowKey);
      if (!draft) {
        return;
      }

      const nextDraft = {
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
      };

      setDraftBars((prev) => prev.filter((entry) => entry.rowKey !== rowKey));
      setHoverAddBlock(null);

      onAddAllocation?.({
        employeeId: nextDraft.employeeId,
        projectId: nextDraft.projectId,
        projectName: nextDraft.projectName,
        startDate: nextDraft.startDate,
        endDate: nextDraft.endDate,
        hoursPerDay: nextDraft.hoursPerDay,
      });
    },
    [
      columnCount,
      columnWidth,
      draftBars,
      headerWidth,
      onAddAllocation,
      showWeekend,
      weekStart,
    ],
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
    handleAddDraftBar,
    handleResizeEnd,
    handleRowMouseMove,
  };
}
