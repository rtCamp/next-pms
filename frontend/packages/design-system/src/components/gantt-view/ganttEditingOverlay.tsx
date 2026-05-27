/**
 * Internal dependencies.
 */
import { HEADER_HEIGHT } from "./constants";
import { useGanttStore } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

export function GanttEditingOverlay() {
  const { hasActiveAllocationEdit, headerWidth } = useGanttStore((s) => ({
    hasActiveAllocationEdit: s.hasActiveAllocationEdit,
    headerWidth: s.headerWidth,
  }));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute right-0 bottom-0 z-15 bg-surface-white/50 transition-opacity duration-150 ease-out",
        hasActiveAllocationEdit
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
      style={{ top: HEADER_HEIGHT, left: headerWidth }}
    />
  );
}
