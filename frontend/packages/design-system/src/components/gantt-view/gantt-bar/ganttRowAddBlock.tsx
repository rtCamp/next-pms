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

/**
 * Internal dependencies.
 */
import { BAR_HEIGHT } from "../constants";
import { isColumnOccupied, type DraftBarSeed } from "../utils";
import type { OccupyingAllocation } from "../utils";
import { AddBlock } from "./addBlock";

export interface GanttRowAddBlockHandle {
  handleRowMouseMove: (event: React.MouseEvent<HTMLTableRowElement>) => void;
  clearHoverAddBlock: () => void;
}

interface GanttRowAddBlockProps {
  enabled: boolean;
  rowKey: string;
  headerWidth: number;
  columnWidth: number;
  columnCount: number;
  allocations: OccupyingAllocation[];
  hasDraft: boolean;
  onAddDraftBar: (draft: DraftBarSeed) => void;
  createDraftBar: (left: number) => DraftBarSeed;
}

export const GanttRowAddBlock = forwardRef<
  GanttRowAddBlockHandle,
  GanttRowAddBlockProps
>(function GanttRowAddBlock(
  {
    enabled,
    rowKey,
    headerWidth,
    columnWidth,
    columnCount,
    allocations,
    hasDraft,
    onAddDraftBar,
    createDraftBar,
  },
  ref,
) {
  const [hoverAddBlockLeft, setHoverAddBlockLeft] = useState<number | null>(
    null,
  );

  const clearHoverAddBlock = useCallback(() => {
    setHoverAddBlockLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled || hasDraft) {
      setHoverAddBlockLeft(null);
    }
  }, [enabled, hasDraft]);

  const handleRowMouseMove = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!enabled || hasDraft) {
        setHoverAddBlockLeft(null);
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-gantt-bar="true"]')
      ) {
        setHoverAddBlockLeft(null);
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const barTop = Math.max((rect.height - BAR_HEIGHT) / 2, 0);
      const barBottom = barTop + Math.min(BAR_HEIGHT, rect.height);

      if (relativeY < barTop || relativeY > barBottom) {
        setHoverAddBlockLeft(null);
        return;
      }

      const relativeX = event.clientX - rect.left - headerWidth;
      const dayIndex = Math.floor(relativeX / columnWidth);

      if (
        dayIndex < 0 ||
        dayIndex >= columnCount ||
        isColumnOccupied(allocations, dayIndex, columnWidth)
      ) {
        setHoverAddBlockLeft(null);
        return;
      }

      const snappedLeft = headerWidth + dayIndex * columnWidth;
      setHoverAddBlockLeft((prev) =>
        prev === snappedLeft ? prev : snappedLeft,
      );
    },
    [allocations, columnCount, columnWidth, enabled, hasDraft, headerWidth],
  );

  useImperativeHandle(
    ref,
    () => ({
      handleRowMouseMove,
      clearHoverAddBlock,
    }),
    [clearHoverAddBlock, handleRowMouseMove],
  );

  if (!enabled || hasDraft || hoverAddBlockLeft === null) {
    return null;
  }

  return (
    <AddBlock
      left={hoverAddBlockLeft}
      width={columnWidth}
      onClick={() => onAddDraftBar(createDraftBar(hoverAddBlockLeft))}
      key={`${rowKey}-${hoverAddBlockLeft}`}
    />
  );
});
