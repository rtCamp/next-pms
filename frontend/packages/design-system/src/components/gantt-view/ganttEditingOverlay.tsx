/**
 * Internal dependencies.
 */
import { HEADER_HEIGHT } from "./constants";
import { useGanttStore } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

export function GanttEditingOverlay() {
  const { hasActiveEdit, headerWidth, guardAction } = useGanttStore((s) => ({
    hasActiveEdit: s.activeEdit !== null,
    headerWidth: s.headerWidth,
    guardAction: s.guardAction,
  }));

  return (
    <div
      aria-hidden="true"
      onClick={hasActiveEdit ? () => guardAction?.() : undefined}
      className={cn(
        "absolute right-0 bottom-0 z-15 bg-surface-white/50 transition-opacity duration-150 ease-out",
        hasActiveEdit
          ? "pointer-events-auto opacity-100 cursor-pointer"
          : "pointer-events-none opacity-0",
      )}
      style={{ top: HEADER_HEIGHT, left: headerWidth }}
    />
  );
}
