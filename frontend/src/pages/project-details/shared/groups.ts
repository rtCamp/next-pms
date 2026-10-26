import type { GroupColumn } from "./types";

/** px of the ⋯ column and of the gap after each cell. */
const ACTIONS_WIDTH = 32;
const CELL_GAP = 8;

/**
 * The narrowest a group list row may get before it scrolls sideways: the columns'
 * widths plus the gaps and the ⋯ column.
 */
export function groupRowMinWidth(columns: readonly GroupColumn[]): number {
  return (
    columns.reduce((total, column) => total + parseInt(column.width, 10), 0) +
    ACTIONS_WIDTH +
    columns.length * CELL_GAP
  );
}
