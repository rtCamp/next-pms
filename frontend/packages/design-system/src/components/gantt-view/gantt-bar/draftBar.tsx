/**
 * External dependencies.
 */
import { useCallback } from "react";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import { getDraftMeta } from "../utils";
import { GanttBar } from "./ganttBar";

interface DraftBarProps {
  /** Absolute left position including headerWidth offset */
  left: number;
  /** Width in px for the draft span */
  width: number;
  /** Triggered after resize snap completes */
  onResizeEnd?: (nextWidth: number) => void;
}

/**
 * A newly placed allocation bar that the user can immediately resize before committing.
 */
export function DraftBar({ left, width, onResizeEnd }: DraftBarProps) {
  const { headerWidth, columnWidth, columnCount, weekStart, showWeekend } =
    useGanttStore((s) => ({
      headerWidth: s.headerWidth,
      columnWidth: s.columnWidth,
      columnCount: s.columnCount,
      weekStart: s.weekStart,
      showWeekend: s.showWeekend,
    }));

  /**
   * Label function that calculates hours based on the live width of the bar as it's being resized.
   */
  const renderLabel = useCallback(
    (liveWidth: number) => {
      const hours = Math.max(
        Math.round((liveWidth / columnWidth) * FULL_DAY_HOURS),
        1,
      );
      return `${hours}h`;
    },
    [columnWidth],
  );

  /**
   * Floating label that shows the end date based on the live width of the bar as it's being resized.
   */
  const renderFloatingLabel = useCallback(
    (liveWidth: number) =>
      format(
        getDraftMeta({
          left,
          width: liveWidth,
          headerWidth,
          columnWidth,
          columnCount,
          weekStart,
          showWeekend,
        }).endDate,
        "MMM d",
      ),
    [left, headerWidth, columnWidth, columnCount, weekStart, showWeekend],
  );

  return (
    <GanttBar
      variant="draft"
      label={`${FULL_DAY_HOURS}h`}
      renderLabel={renderLabel}
      renderFloatingLabel={renderFloatingLabel}
      left={left}
      width={width}
      resizable
      snapUnitPx={columnWidth}
      onResizeEnd={onResizeEnd}
    />
  );
}

DraftBar.displayName = "DraftBar";
