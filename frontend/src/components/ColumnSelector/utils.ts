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

/** Moves `from` to `to`, or returns `columns` unchanged when the move is out of range or crosses the pinned boundary. */
export function moveColumn<T extends SelectorColumn>(
  columns: T[],
  from: number,
  to: number,
  respectPinned: boolean,
): T[] {
  if (from === to || !columns[from] || !columns[to]) return columns;
  if (respectPinned && !!columns[from].pinned !== !!columns[to].pinned) {
    return columns;
  }
  const next = [...columns];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function sameOrder(a: SelectorColumn[], b: SelectorColumn[]) {
  return (
    a.length === b.length &&
    a.every((column, index) => column.value === b[index].value)
  );
}
