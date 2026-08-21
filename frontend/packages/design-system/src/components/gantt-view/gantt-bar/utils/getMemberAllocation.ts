/**
 * External dependencies.
 */
import { addDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";

/**
 * Internal dependencies.
 */
import type {
  Allocation,
  LeaveAllocation,
  MemberBarAllocation,
  Project,
  TimeoffPortion,
} from "../../types";

/**
 * Returns the portion of a leave that applies to a given day.
 */
function getLeaveDayPortion(leave: LeaveAllocation, day: Date): TimeoffPortion {
  if (!leave.halfDayDate || !isSameDay(leave.halfDayDate, day)) {
    return "full";
  }

  return leave.halfDayPortion ?? "half";
}

/**
 * Builds merged day-level allocation summary segments from a flat allocation
 * list and optional leave ranges.
 */
export function getAllocationSummary(
  allocations: Allocation[],
  leaves: LeaveAllocation[] = [],
): MemberBarAllocation[] {
  if (allocations.length === 0 && leaves.length === 0) return [];

  // Use local-midnight timestamps as keys to avoid UTC-offset date shifts
  // (toISOString() would produce the wrong date in UTC+ timezones)
  const dayHours = new Map<number, number>();
  const dayHasNonBillable = new Map<number, boolean>();
  const dayHasTentative = new Map<number, boolean>();
  const dayTimeoff = new Map<number, TimeoffPortion>();
  const dayKeys = new Set<number>();

  for (const alloc of allocations) {
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
      const portion = getLeaveDayPortion(leave, day);
      if (portion === "full" || !dayTimeoff.has(key)) {
        dayTimeoff.set(key, portion);
      }
    }
  }

  // Sort days and merge contiguous runs with the same total hours
  const sortedDays = [...dayKeys]
    .sort((a, b) => a - b)
    .map((ts) => ({
      date: new Date(ts),
      hours: dayTimeoff.has(ts) ? 0 : (dayHours.get(ts) ?? 0),
      billable: !dayHasNonBillable.get(ts),
      tentative: Boolean(dayHasTentative.get(ts)),
      type: (dayTimeoff.has(ts) ? "timeoff" : "default") as
        "default" | "timeoff",
      timeoff: dayTimeoff.get(ts),
    }));

  const merged: MemberBarAllocation[] = [];
  for (const {
    date,
    hours,
    billable,
    tentative,
    type,
    timeoff,
  } of sortedDays) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.hours === hours &&
      last.billable === billable &&
      last.tentative === tentative &&
      last.type === type &&
      last.timeoff === timeoff &&
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
        timeoff,
      });
    }
  }

  return merged;
}

/**
 * Builds member-level summary segments by flattening allocations across the
 * member's projects and delegating to `getAllocationSummary`.
 */
export function getMemberAllocation(
  projects: Project[],
  leaves: LeaveAllocation[] = [],
): MemberBarAllocation[] {
  const allAllocs = projects.flatMap((p) => p.allocations ?? []);
  return getAllocationSummary(allAllocs, leaves);
}

/**
 * Collects the local-midnight day keys already covered by an allocation or
 * leave segment (i.e. everything `getAllocationSummary` already emitted a
 * bar for).
 */
export function getCoveredDayKeys(summary: MemberBarAllocation[]): Set<number> {
  const coveredDays = new Set<number>();

  for (const segment of summary) {
    for (const day of eachDayOfInterval({
      start: segment.startDate,
      end: segment.endDate,
    })) {
      coveredDays.add(startOfDay(day).getTime());
    }
  }

  return coveredDays;
}

/**
 * Builds merged "free capacity" segments for every weekday in
 * [rangeStart, rangeEnd] that isn't already covered by an allocation or
 * leave. Weekends are always excluded, regardless of the showWeekend toggle.
 */
export function getFreeCapacitySegments(
  coveredDays: Set<number>,
  rangeStart: Date,
  rangeEnd: Date,
): MemberBarAllocation[] {
  if (rangeEnd < rangeStart) return [];

  const freeDays: Date[] = [];
  for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dayStart = startOfDay(day);
    if (coveredDays.has(dayStart.getTime())) continue;

    freeDays.push(dayStart);
  }

  const merged: MemberBarAllocation[] = [];
  for (const date of freeDays) {
    const last = merged[merged.length - 1];
    if (last && isSameDay(addDays(last.endDate, 1), date)) {
      last.endDate = date;
    } else {
      merged.push({
        hours: 0,
        startDate: date,
        endDate: date,
        type: "free",
      });
    }
  }

  return merged;
}
