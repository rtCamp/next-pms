/**
 * External dependencies.
 */
import { mergeClassNames } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import type { ProjectListColumn } from "../../types";

// Matches the `gap-2` between grid tracks.
const COLUMN_GAP = 8;

const PINNED_CELL =
  "sticky self-stretch flex items-center bg-surface-white before:absolute before:inset-y-0 before:left-full before:w-2 before:bg-surface-white";

const PINNED_SEAM =
  "after:absolute after:inset-y-0 after:left-full after:ml-1 after:w-px after:bg-outline-gray-1";

/**
 * Returns the sortable input configuration for a column based on its index and pinned status.
 */
export function getSortableInput(
  key: string,
  index: number,
  pinnedCount: number,
) {
  const isPinned = index < pinnedCount;
  const type = isPinned ? "pinned-column" : "scrolling-column";

  return {
    id: key,
    index: isPinned ? index : index - pinnedCount,
    group: isPinned ? "pinned" : "scrolling",
    type,
    accept: [type],
  };
}

/**
 * Returns the CSS class names for a column cell based on its index, pinned status, and header/seam visibility.
 */
export function getColumnCellClasses({
  index,
  pinnedCount,
  isHeader = false,
  hideSeam = false,
}: {
  index: number;
  pinnedCount: number;
  isHeader?: boolean;
  hideSeam?: boolean;
}) {
  const isPinned = index < pinnedCount;

  return mergeClassNames(
    // The grids carry no left padding: a container's padding is scrollable
    // area that a pinned column cannot cover.
    index === 0 && "pl-2",
    isPinned && PINNED_CELL,
    isPinned && (isHeader ? "z-20" : "z-10"),
    !hideSeam && index === pinnedCount - 1 && PINNED_SEAM,
    // Only the header has vertical padding for the seam to reach past.
    isPinned && isHeader && "before:-inset-y-2 after:-inset-y-2",
    pinnedCount > 0 && index === pinnedCount && "pl-3",
  );
}

/**
 * Returns a map of sticky left offsets for pinned columns based on their widths and the column gap.
 */
export function getStickyOffsets(
  columns: ProjectListColumn[],
  pinnedCount: number,
) {
  const offsets = new Map<string, number>();
  let left = 0;

  for (const column of columns.slice(0, pinnedCount)) {
    offsets.set(column.key, left);
    left += (Number.parseInt(column.width ?? "", 10) || 0) + COLUMN_GAP;
  }

  return offsets;
}
