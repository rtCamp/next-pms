import { differenceInCalendarDays } from "date-fns";
import { FULL_DAY_HOURS } from "../constants";
import { useGanttStore } from "../ganttStore";
import type { Allocation } from "../types";
import { GanttBar } from "./ganttBar";
import { getClampedBarLayout } from "./utilities/getClampedBarLayout";
import { getNumDays } from "./utilities/getNumDays";

export type MemberBarAllocation = Allocation & {
  type?: "default" | "timeoff";
};

interface GanttMemberBarProps {
  allocation: MemberBarAllocation;
}

export function GanttMemberBar({ allocation }: GanttMemberBarProps) {
  const { weekStart, showWeekend, headerWidth, columnCount } = useGanttStore(
    (s) => ({
      weekStart: s.weekStart,
      headerWidth: s.headerWidth,
      showWeekend: s.showWeekend,
      columnCount: s.columnCount,
    }),
  );

  const allocationStartCol = getNumDays(
    allocation.startDate,
    weekStart,
    showWeekend,
  );
  const allocationEndCol = getNumDays(
    allocation.endDate,
    weekStart,
    showWeekend,
  );
  const layout = getClampedBarLayout({
    allocationStartCol,
    allocationEndCol,
    columnCount,
    headerWidth,
  });

  if (!layout) {
    return null;
  }

  if (allocation.type === "timeoff") {
    const leaveDays =
      differenceInCalendarDays(allocation.endDate, allocation.startDate) + 1;
    const leaveLabel = leaveDays > 2 ? `${leaveDays} days` : "";

    return (
      <GanttBar
        variant="timeoff"
        label={leaveLabel}
        left={layout.left}
        width={layout.width}
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
      left={layout.left}
      width={layout.width}
      billable={allocation.billable}
    />
  );
}

GanttMemberBar.displayName = "GanttMemberBar";
