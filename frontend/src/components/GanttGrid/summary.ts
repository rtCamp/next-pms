import { FULL_DAY_HOURS } from "./constants";
import { dayKey, eachDay, isNextDay, isWeekend } from "./geometry";
import type { Allocation, LeaveAllocation, TimeoffPortion } from "./types";

/** A run of days with the same booking: the bars of an employee's summary row. */
export interface SummarySegment {
  startDate: Date;
  endDate: Date;
  /** Hours booked on each day of the run. */
  hours: number;
  /** `timeoff`: leave or a holiday falls on the run; `free`: a weekday nothing is booked on. */
  type: "default" | "timeoff" | "free";
  billable?: boolean;
  tentative?: boolean;
  isAiCreated?: boolean;
  timeoff?: TimeoffPortion;
  /** A holiday's name. */
  label?: string;
}

/** A run of weekdays with the same total over a project's allocations. */
export interface ProjectSummarySegment {
  startDate: Date;
  endDate: Date;
  /** Hours booked over the whole run. */
  hours: number;
  tentative: boolean;
  isAiCreated: boolean;
}

export type CapacityVariant = "full" | "under" | "over";

export interface CapacityStatus {
  variant: CapacityVariant;
  /** e.g. "Full", "2h free", "1.5h over". */
  label: string;
}

/** Hours with at most two decimals and no trailing zeros, e.g. "7.5". */
export function formatHours(hours: number): string {
  return String(Number(hours.toFixed(2)));
}

/** How booked `hours` compare with the day's capacity (8h when unset). */
export function capacityStatus(
  hours: number,
  capacityHoursPerDay: number = FULL_DAY_HOURS,
): CapacityStatus {
  const difference = Number(formatHours(hours - capacityHoursPerDay));
  if (difference === 0) return { variant: "full", label: "Full" };
  return {
    variant: difference > 0 ? "over" : "under",
    label: `${formatHours(Math.abs(difference))}h ${difference > 0 ? "over" : "free"}`,
  };
}

/** Text of a time-off bar: the half that is off, or "N days off". */
export function timeoffLabel(
  startDate: Date,
  endDate: Date,
  portion: TimeoffPortion = "full",
): string {
  if (portion === "first") return "First half off";
  if (portion === "second") return "Second half off";
  if (portion === "half") return "Half day off";
  const days = eachDay(startDate, endDate).length;
  return `${days} ${days === 1 ? "day" : "days"} off`;
}

/**
 * Hours per day an edit starts from. A zero-hour placeholder falls back to the
 * allocation's own hours, since an allocation can't be saved with 0.
 */
export function editableHoursPerDay(allocation: Allocation): number {
  if (!allocation.fullyReduced) return allocation.hours;
  return allocation.allocationHoursPerDay ?? allocation.hours;
}

function leavePortion(leave: LeaveAllocation, day: Date): TimeoffPortion {
  if (!leave.halfDayDate || dayKey(leave.halfDayDate) !== dayKey(day)) {
    return "full";
  }
  return leave.halfDayPortion ?? "half";
}

interface DayBooking {
  hours: number;
  nonBillable: boolean;
  tentative: boolean;
  isAiCreated: boolean;
  timeoff?: TimeoffPortion;
  label?: string;
}

/**
 * Merges allocations and leave into day-level runs: consecutive days with the same
 * hours, flags, time off and label make one segment. Zero-hour placeholders book
 * nothing, so they leave their days free.
 */
export function allocationSummary(
  allocations: Allocation[],
  leaves: LeaveAllocation[] = [],
): SummarySegment[] {
  const days = new Map<number, DayBooking>();
  const bookingOf = (day: Date) => {
    const key = dayKey(day);
    let booking = days.get(key);
    if (!booking) {
      booking = {
        hours: 0,
        nonBillable: false,
        tentative: false,
        isAiCreated: false,
      };
      days.set(key, booking);
    }
    return booking;
  };

  for (const allocation of allocations) {
    if (allocation.fullyReduced) continue;
    for (const day of eachDay(allocation.startDate, allocation.endDate)) {
      const booking = bookingOf(day);
      booking.hours += allocation.hours;
      if (allocation.billable === false) booking.nonBillable = true;
      if (allocation.tentative) booking.tentative = true;
      if (allocation.isAiCreated) booking.isAiCreated = true;
    }
  }

  for (const leave of leaves) {
    for (const day of eachDay(leave.startDate, leave.endDate)) {
      const booking = bookingOf(day);
      const portion = leavePortion(leave, day);
      if (portion === "full" || !booking.timeoff) booking.timeoff = portion;
      if (leave.label) booking.label = leave.label;
    }
  }

  const merged: SummarySegment[] = [];
  for (const key of [...days.keys()].sort((a, b) => a - b)) {
    const booking = days.get(key)!;
    const date = new Date(key);
    const segment: SummarySegment = {
      startDate: date,
      endDate: date,
      hours: booking.hours,
      type: booking.timeoff ? "timeoff" : "default",
      billable: !booking.nonBillable,
      tentative: booking.tentative,
      isAiCreated: booking.isAiCreated,
      timeoff: booking.timeoff,
      label: booking.label,
    };
    const last = merged[merged.length - 1];
    if (
      last &&
      last.hours === segment.hours &&
      last.billable === segment.billable &&
      last.tentative === segment.tentative &&
      last.isAiCreated === segment.isAiCreated &&
      last.type === segment.type &&
      last.timeoff === segment.timeoff &&
      last.label === segment.label &&
      isNextDay(last.endDate, date)
    ) {
      last.endDate = date;
    } else {
      merged.push(segment);
    }
  }
  return merged;
}

/** An employee's summary row: all allocations across their projects, and their leave. */
export function employeeSummary(
  projects: { allocations?: Allocation[] }[],
  leaves: LeaveAllocation[] = [],
): SummarySegment[] {
  return allocationSummary(
    projects.flatMap((project) => project.allocations ?? []),
    leaves,
  );
}

/** The days the segments cover, as day keys. */
export function coveredDays(segments: SummarySegment[]): Set<number> {
  const covered = new Set<number>();
  for (const segment of segments) {
    for (const day of eachDay(segment.startDate, segment.endDate)) {
      covered.add(dayKey(day));
    }
  }
  return covered;
}

/**
 * Runs of weekdays from `rangeStart` to `rangeEnd` that nothing covers. Weekends are
 * never free, whether or not their columns are shown.
 */
export function freeCapacitySegments(
  covered: Set<number>,
  rangeStart: Date,
  rangeEnd: Date,
): SummarySegment[] {
  if (rangeEnd < rangeStart) return [];
  const merged: SummarySegment[] = [];
  for (const day of eachDay(rangeStart, rangeEnd)) {
    if (isWeekend(day) || covered.has(dayKey(day))) continue;
    const last = merged[merged.length - 1];
    if (last && isNextDay(last.endDate, day)) last.endDate = day;
    else merged.push({ startDate: day, endDate: day, hours: 0, type: "free" });
  }
  return merged;
}

/**
 * A project's summary row: the daily total over its allocations on weekdays, merged
 * into runs of consecutive days with the same daily total and flags. Weekends break
 * runs, so a run never spans more than one Monday-to-Friday week; its `hours` is the
 * run's total.
 */
export function projectSummarySegments(
  allocations: Allocation[],
): ProjectSummarySegment[] {
  const days = new Map<
    number,
    { hours: number; tentative: boolean; isAiCreated: boolean }
  >();
  for (const allocation of allocations) {
    for (const day of eachDay(allocation.startDate, allocation.endDate)) {
      if (isWeekend(day)) continue;
      const key = dayKey(day);
      const previous = days.get(key);
      days.set(key, {
        hours: (previous?.hours ?? 0) + allocation.hours,
        tentative: Boolean(previous?.tentative || allocation.tentative),
        isAiCreated: Boolean(previous?.isAiCreated || allocation.isAiCreated),
      });
    }
  }

  const segments: ProjectSummarySegment[] = [];
  let lastDayHours = 0;
  for (const key of [...days.keys()].sort((a, b) => a - b)) {
    const { hours, tentative, isAiCreated } = days.get(key)!;
    const date = new Date(key);
    const last = segments[segments.length - 1];
    if (
      last &&
      lastDayHours === hours &&
      last.tentative === tentative &&
      last.isAiCreated === isAiCreated &&
      isNextDay(last.endDate, date)
    ) {
      last.endDate = date;
      last.hours += hours;
      continue;
    }
    segments.push({
      startDate: date,
      endDate: date,
      hours,
      tentative,
      isAiCreated,
    });
    lastDayHours = hours;
  }
  return segments;
}
