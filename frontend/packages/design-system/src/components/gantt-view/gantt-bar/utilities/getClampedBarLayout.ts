import { CELL_WIDTH } from "../../constants";

/**
 * When a bar is clamped on the right edge, we reduce the width slightly to create a visual gap.
 * This prevents the bar from looking like it's overflowing when it's actually just hitting the edge of the grid.
 */
const RIGHT_CLAMP_WIDTH_REDUCTION = 3;

interface ClampedBarLayoutInput {
  allocationStartCol: number;
  allocationEndCol: number;
  columnCount: number;
  headerWidth: number;
}

interface ClampedBarLayout {
  left: number;
  width: number;
}

/**
 * Given an allocation's start and end column indices, calculates the left position
 * and width for the Gantt bar, clamping it within the visible grid area defined by
 * columnCount.
 */
export function getClampedBarLayout({
  allocationStartCol,
  allocationEndCol,
  columnCount,
  headerWidth,
}: ClampedBarLayoutInput): ClampedBarLayout | null {
  const visibleStartCol = 0;
  const visibleEndCol = columnCount - 1;

  if (
    allocationEndCol < visibleStartCol ||
    allocationStartCol > visibleEndCol
  ) {
    return null;
  }

  const clampedStartCol = Math.max(allocationStartCol, visibleStartCol);
  const clampedEndCol = Math.min(allocationEndCol, visibleEndCol);
  const isRightClamped = allocationEndCol > visibleEndCol;
  const numDays = clampedEndCol - clampedStartCol + 1;

  return {
    left: clampedStartCol * CELL_WIDTH + headerWidth,
    width: Math.max(
      numDays * CELL_WIDTH - (isRightClamped ? RIGHT_CLAMP_WIDTH_REDUCTION : 0),
      0,
    ),
  };
}
