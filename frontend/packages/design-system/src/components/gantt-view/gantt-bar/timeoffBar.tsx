/**
 * External dependencies.
 */
import React from "react";
import { Holiday } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CELL_WIDTH } from "../constants";
import type { TimeoffPortion } from "../types";
import { GanttBar } from "./ganttBar";
import { getTimeoffLabel } from "./utils/getTimeoffLabel";

interface GanttTimeoffBarProps extends React.HTMLAttributes<HTMLDivElement> {
  startDate: Date;
  endDate: Date;
  timeoff?: TimeoffPortion;
  /** Literal text to show instead of the generated "N days off" wording, e.g. a holiday's name. */
  label?: string;
  left: number;
  width: number;
  showTooltip?: boolean;
}

export const GanttTimeoffBar = React.forwardRef<
  HTMLDivElement,
  GanttTimeoffBarProps
>(function GanttTimeoffBar(
  {
    startDate,
    endDate,
    timeoff,
    label,
    left,
    width,
    showTooltip,
    ...htmlProps
  },
  ref,
) {
  const resolvedLabel = label ?? getTimeoffLabel(startDate, endDate, timeoff);
  const isHoliday = label !== undefined;

  return (
    <GanttBar
      ref={ref}
      variant="timeoff"
      label={resolvedLabel}
      icon={isHoliday ? Holiday : undefined}
      showInlineLabel={width > CELL_WIDTH}
      showTooltip={showTooltip}
      left={left}
      width={width}
      {...htmlProps}
    />
  );
});

GanttTimeoffBar.displayName = "GanttTimeoffBar";
