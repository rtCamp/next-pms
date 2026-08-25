/**
 * Internal dependencies.
 */
import { CELL_WIDTH } from "../constants";
import type { TimeoffPortion } from "../types";
import { GanttBar } from "./ganttBar";
import { getTimeoffLabel } from "./utils/getTimeoffLabel";

interface GanttTimeoffBarProps {
  startDate: Date;
  endDate: Date;
  timeoff?: TimeoffPortion;
  /** Literal text to show instead of the generated "N days off" wording, e.g. a holiday's name. */
  label?: string;
  left: number;
  width: number;
}

export function GanttTimeoffBar({
  startDate,
  endDate,
  timeoff,
  label,
  left,
  width,
}: GanttTimeoffBarProps) {
  const resolvedLabel = label ?? getTimeoffLabel(startDate, endDate, timeoff);

  return (
    <GanttBar
      variant="timeoff"
      label={resolvedLabel}
      // A single narrow day-column has room for the icon only; rendering the label
      // span anyway would still reserve its flex gap and shift the icon off-centre.
      showInlineLabel={width > CELL_WIDTH}
      left={left}
      width={width}
    />
  );
}
