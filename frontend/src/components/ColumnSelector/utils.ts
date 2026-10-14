import type { ColumnSelectorLabels, SelectorColumn } from "./types";

export const DEFAULT_LABELS: ColumnSelectorLabels = {
  trigger: "Columns",
  addColumn: "Add Column",
  search: "Search columns",
  resetToDefault: "Reset to Default",
  remove: "Remove column",
  reorder: "Reorder column",
  reorderHint:
    "Press Space to pick up, the arrow keys to move, Space to drop, Escape to cancel.",
  pin: "Pin column",
  unpin: "Unpin column",
  pinLimit: "Pin limit reached",
};

export function unusedColumns(
  availableColumns: SelectorColumn[],
  columns: SelectorColumn[],
): SelectorColumn[] {
  const used = new Set(columns.map((column) => column.value));
  return availableColumns.filter((column) => !used.has(column.value));
}

export function groupPinned<T extends SelectorColumn>(columns: T[]): T[] {
  return [
    ...columns.filter((column) => column.pinned),
    ...columns.filter((column) => !column.pinned),
  ];
}

/** Flips the column's `pinned` flag and moves it to the boundary between the two groups. */
export function togglePinned<T extends SelectorColumn>(
  columns: T[],
  value: string,
): T[] {
  const column = columns.find((existing) => existing.value === value);
  if (!column) return columns;
  const rest = columns.filter((existing) => existing.value !== value);
  return [
    ...rest.filter((existing) => existing.pinned),
    { ...column, pinned: !column.pinned },
    ...rest.filter((existing) => !existing.pinned),
  ];
}

export function sameOrder(a: SelectorColumn[], b: SelectorColumn[]) {
  return (
    a.length === b.length &&
    a.every((column, index) => column.value === b[index].value)
  );
}
