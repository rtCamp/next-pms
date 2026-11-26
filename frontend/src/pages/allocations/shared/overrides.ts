import { dayjs } from "frappe-ui";
import { dayHours, isLeaveOwnedOverride } from "./segments";
import type { AllocationOverrideEntry } from "./types";

/** An allocation's own range, hours and overrides, as an Edit schedule starts from. */
export interface AllocationSchedule {
  allocationStartDate: string;
  allocationEndDate: string;
  allocationHoursPerDay: number;
  override?: AllocationOverrideEntry[];
}

/** The days picked in Edit schedule and the hours to give them. */
export interface ScheduleSelection {
  dates: string[];
  hoursPerDay: number;
  /** Days that can't be picked; they count as covered for a whole-range edit. */
  lockedDates?: Set<string>;
}

export interface DayOverridePayload {
  date: string;
  hours?: number;
  cancelled?: number;
}

/** What `edit_allocation` takes for an Edit schedule save. */
export interface SchedulePayload {
  allocationHoursPerDay: number;
  dayOverrides: DayOverridePayload[];
  deletedDayOverrides: string[];
}

/** Every date of an inclusive range, as `YYYY-MM-DD`. */
export function dateKeysInRange(startDate: string, endDate: string): string[] {
  const keys: string[] = [];
  const end = dayjs(endDate);
  for (
    let day = dayjs(startDate);
    !day.isAfter(end, "day");
    day = day.add(1, "day")
  ) {
    keys.push(day.format("YYYY-MM-DD"));
  }
  return keys;
}

/**
 * Whether the picked days cover the allocation's whole range, which makes the edit a
 * change of its hours per day rather than of single days. A locked day always counts.
 */
function coversWholeRange(
  allocation: AllocationSchedule,
  selection: Pick<ScheduleSelection, "dates" | "lockedDates">,
): boolean {
  const picked = new Set(selection.dates);
  const locked = selection.lockedDates ?? new Set<string>();
  const [start, end] =
    allocation.allocationStartDate <= allocation.allocationEndDate
      ? [allocation.allocationStartDate, allocation.allocationEndDate]
      : [allocation.allocationEndDate, allocation.allocationStartDate];
  return (
    picked.size > 0 &&
    dateKeysInRange(start, end).every(
      (date) => picked.has(date) || locked.has(date),
    )
  );
}

/** Each day of the allocation and the hours it books now, overrides applied. */
function currentHoursByDate(allocation: AllocationSchedule) {
  const overrides = new Map(
    (allocation.override ?? []).map((entry) => [entry.date, entry]),
  );
  return new Map(
    dateKeysInRange(
      allocation.allocationStartDate,
      allocation.allocationEndDate,
    ).map((date) => [
      date,
      dayHours(overrides.get(date), allocation.allocationHoursPerDay),
    ]),
  );
}

/**
 * The smallest override change from the current hours to the desired ones: a day going
 * back to the allocation's hours drops its manual override, a day of zero hours is
 * cancelled, and any other change sets the day's hours.
 */
function overrideDiff(
  current: Map<string, number>,
  desired: Map<string, number>,
  allocation: AllocationSchedule,
): Omit<SchedulePayload, "allocationHoursPerDay"> {
  const overrides = new Map(
    (allocation.override ?? []).map((entry) => [entry.date, entry]),
  );
  const dayOverrides: DayOverridePayload[] = [];
  const deletedDayOverrides: string[] = [];
  for (const [date, hours] of current) {
    const next = desired.get(date);
    if (next === undefined || next === hours) continue;
    const existing = overrides.get(date);
    if (
      next === allocation.allocationHoursPerDay &&
      existing &&
      !isLeaveOwnedOverride(existing)
    ) {
      deletedDayOverrides.push(date);
    } else if (next <= 0) {
      dayOverrides.push({ date, cancelled: 1 });
    } else {
      dayOverrides.push({ date, hours: next });
    }
  }
  return { dayOverrides, deletedDayOverrides };
}

/**
 * What an Edit schedule save sends. Picking the whole range changes the allocation's
 * hours per day and drops its manual overrides (the backend re-derives the leave ones
 * from the new hours); picking some days becomes overrides for those days.
 */
export function buildSchedulePayload(
  allocation: AllocationSchedule,
  selection: ScheduleSelection,
): SchedulePayload {
  if (
    coversWholeRange(allocation, selection) &&
    selection.hoursPerDay !== allocation.allocationHoursPerDay
  ) {
    return {
      allocationHoursPerDay: selection.hoursPerDay,
      dayOverrides: [],
      deletedDayOverrides: (allocation.override ?? [])
        .filter((entry) => !isLeaveOwnedOverride(entry))
        .map((entry) => entry.date),
    };
  }
  const current = currentHoursByDate(allocation);
  const desired = new Map(current);
  for (const date of selection.dates) {
    if (!selection.lockedDates?.has(date)) {
      desired.set(date, selection.hoursPerDay);
    }
  }
  return {
    allocationHoursPerDay: allocation.allocationHoursPerDay,
    ...overrideDiff(current, desired, allocation),
  };
}
