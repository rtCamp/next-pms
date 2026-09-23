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
