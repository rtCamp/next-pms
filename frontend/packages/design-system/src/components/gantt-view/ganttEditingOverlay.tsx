/**
 * Internal dependencies.
 */
import { HEADER_HEIGHT } from "./constants";
import { useGanttStore } from "./ganttStore";

export function GanttEditingOverlay() {
  const { hasActiveAllocationEdit, headerWidth } = useGanttStore((s) => ({
    hasActiveAllocationEdit: s.hasActiveAllocationEdit,
    headerWidth: s.headerWidth,
  }));

  if (!hasActiveAllocationEdit) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto absolute right-0 bottom-0 z-15 bg-surface-white/50"
      style={{ top: HEADER_HEIGHT, left: headerWidth }}
    />
  );
}
