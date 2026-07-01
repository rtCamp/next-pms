/**
 * External dependencies.
 */
import type { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import { CELL_HEIGHT } from "./constants";
import { useGanttStore } from "./ganttStore";

interface GanttRowOverlayCellProps {
  children: ReactNode;
  height?: number;
}

export function GanttRowOverlayCell({
  children,
  height = CELL_HEIGHT,
}: GanttRowOverlayCellProps) {
  const { headerWidth, columnWidth, columnCount } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
    columnWidth: s.columnWidth,
    columnCount: s.columnCount,
  }));

  const rowWidth = headerWidth + columnWidth * columnCount;

  return (
    <td
      className="relative p-0 border-0 w-0 min-w-0 max-w-0"
      style={{ width: 0 }}
    >
      <div
        className="pointer-events-none absolute top-0"
        style={{
          left: -rowWidth,
          width: rowWidth,
          height,
        }}
      >
        {children}
      </div>
    </td>
  );
}
