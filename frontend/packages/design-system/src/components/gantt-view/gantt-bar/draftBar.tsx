/**
 * External dependencies.
 */
import { useCallback } from "react";

/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import { GanttBar } from "./ganttBar";

interface DraftBarProps {
  /** Absolute left position including headerWidth offset */
  left: number;
  /** Width in px for the draft span */
  width: number;
  /** Triggered after resize snap completes */
  onResizeEnd?: (nextWidth: number) => void;
  /** Triggered when clicking the draft body */
  onClick?: () => void;
}

/**
 * A newly placed allocation bar that the user can immediately resize before committing.
 */
export function DraftBar({ left, width, onResizeEnd, onClick }: DraftBarProps) {
  const { columnWidth } = useGanttStore((s) => ({
    columnWidth: s.columnWidth,
  }));

  /**
   * Label function that calculates hours based on the live width of the bar as it's being resized.
   */
  const labelFn = useCallback(
    (liveWidth: number) => {
      const hours = Math.max(
        Math.round((liveWidth / columnWidth) * FULL_DAY_HOURS),
        1,
      );
      return `${hours}h`;
    },
    [columnWidth],
  );

  return (
    <GanttBar
      variant="draft"
      label={`${FULL_DAY_HOURS}h`}
      labelFn={labelFn}
      left={left}
      width={width}
      resizable
      snapUnitPx={columnWidth}
      onResizeEnd={onResizeEnd}
      onClick={onClick}
    />
  );
}

DraftBar.displayName = "DraftBar";
