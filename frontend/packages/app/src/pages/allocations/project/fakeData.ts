// TODO: Delete this file and replace usages with real data.
import type { Member } from "@next-pms/design-system/components";
import { addMonths, addWeeks, startOfWeek } from "date-fns";
import type { AllocationsDuration } from "../types";

const shellBaseDate = new Date(2026, 4, 18);

const weekCountByDuration: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

export const projectAllocationShellMembers: Member[] = [];

export function getProjectAllocationShellStartDate() {
  return startOfWeek(shellBaseDate, { weekStartsOn: 1 });
}

export function getProjectAllocationWeekCount(duration: AllocationsDuration) {
  return weekCountByDuration[duration];
}

export function moveProjectAllocationShellDate(
  anchorDate: Date,
  duration: AllocationsDuration,
  direction: "previous" | "next",
) {
  const delta = direction === "next" ? 1 : -1;

  if (duration === "this-week") {
    return addWeeks(anchorDate, delta);
  }

  if (duration === "this-month") {
    return addMonths(anchorDate, delta);
  }

  return addMonths(anchorDate, delta * 3);
}
