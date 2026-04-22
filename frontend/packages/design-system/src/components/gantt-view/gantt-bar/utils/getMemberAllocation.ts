import { addDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import type { Allocation, LeaveAllocation, Project } from "../../types";

interface MemberBarAllocation extends Allocation {
  type?: "default" | "timeoff";
}

/**
 * Derives a member's total allocation per calendar day by summing hours across
 * all project allocations. Returns an array of `Allocation` segments where
 * contiguous days with the same total hours are merged into a single entry.
 */
export function getMemberAllocation(
  projects: Project[],
  leaves: LeaveAllocation[] = [],
): MemberBarAllocation[] {
  const allAllocs = projects.flatMap((p) => p.allocations ?? []);
  if (allAllocs.length === 0 && leaves.length === 0) return [];

  // Use local-midnight timestamps as keys to avoid UTC-offset date shifts
  // (toISOString() would produce the wrong date in UTC+ timezones)
  const dayHours = new Map<number, number>();
  const dayHasNonBillable = new Map<number, boolean>();
  const dayHasTentative = new Map<number, boolean>();
  const dayIsTimeoff = new Map<number, boolean>();
  const dayKeys = new Set<number>();
  for (const alloc of allAllocs) {
    for (const day of eachDayOfInterval({
      start: alloc.startDate,
      end: alloc.endDate,
    })) {
      const key = startOfDay(day).getTime();
      dayKeys.add(key);
      dayHours.set(key, (dayHours.get(key) ?? 0) + alloc.hours);
      if (alloc.billable === false) {
        dayHasNonBillable.set(key, true);
      }
      if (alloc.tentative) {
        dayHasTentative.set(key, true);
      }
    }
  }

  for (const leave of leaves) {
    for (const day of eachDayOfInterval({
      start: leave.startDate,
      end: leave.endDate,
    })) {
      const key = startOfDay(day).getTime();
      dayKeys.add(key);
      dayIsTimeoff.set(key, true);
    }
  }

  // Sort days and merge contiguous runs with the same total hours
  const sortedDays = [...dayKeys]
    .sort((a, b) => a - b)
    .map((ts) => ({
      date: new Date(ts),
      hours: dayIsTimeoff.get(ts) ? 0 : (dayHours.get(ts) ?? 0),
      billable: !dayHasNonBillable.get(ts),
      tentative: Boolean(dayHasTentative.get(ts)),
      type: (dayIsTimeoff.get(ts) ? "timeoff" : "default") as
        | "default"
        | "timeoff",
    }));

  const merged: MemberBarAllocation[] = [];
  for (const { date, hours, billable, tentative, type } of sortedDays) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.hours === hours &&
      last.billable === billable &&
      last.tentative === tentative &&
      last.type === type &&
      isSameDay(addDays(last.endDate, 1), date)
    ) {
      last.endDate = date;
    } else {
      merged.push({
        hours,
        startDate: date,
        endDate: date,
        billable,
        tentative,
        type,
      });
    }
  }
  return merged;
}
