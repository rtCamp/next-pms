import { differenceInCalendarDays } from "date-fns";
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import type { MemberAllocationBar } from "../ganttStore";
import { GanttBar } from "./ganttBar";

export type MemberBarAllocation = MemberAllocationBar;

interface GanttMemberBarProps {
  allocation: MemberAllocationBar;
}

export function GanttMemberBar({ allocation }: GanttMemberBarProps) {
  const { headerWidth } = useGanttStore((s) => ({
    headerWidth: s.headerWidth,
  }));

  const left = allocation.barOffset + headerWidth;
  const { width } = allocation;

  if (allocation.type === "timeoff") {
    const leaveDays =
      differenceInCalendarDays(allocation.endDate, allocation.startDate) + 1;
    const leaveLabel = leaveDays > 2 ? `${leaveDays} days` : "";

    return (
      <GanttBar
        variant="timeoff"
        label={leaveLabel}
        left={left}
        width={width}
      />
    );
  }

  const { hours } = allocation;
  const diff = hours - FULL_DAY_HOURS;
  const isFull = diff === 0;
  const isOver = diff > 0;

  const variant = isFull ? "full" : isOver ? "over" : "under";
  const label = isFull
    ? "Full"
    : isOver
      ? `${diff}h over`
      : `${Math.abs(diff)}h free`;

  return (
    <GanttBar
      variant={variant}
      theme={allocation.tentative ? "crosshatch" : "default"}
      label={label}
      left={left}
      width={width}
      billable={allocation.billable}
    />
  );
}

GanttMemberBar.displayName = "GanttMemberBar";
