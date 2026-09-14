/**
 * External dependencies.
 */
import { eachDayOfInterval, format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { isLeaveOwnedOverride, type AllocationOverrideEntry } from "./utils";

interface AllocationScheduleContext {
  allocationStartDate: string;
  allocationEndDate: string;
  allocationHoursPerDay: number;
  override?: AllocationOverrideEntry[];
}

interface AllocationEditSelection {
  dates: string[];
  hoursPerDay: number;
}

type DayOverridePayload = {
  date: string;
  hours?: number;
  cancelled?: number;
};

type DayOverridePatch = {
  dayOverrides: DayOverridePayload[];
  deletedDayOverrides: string[];
};

type ScheduleSelectionPayload = DayOverridePatch & {
  allocationHoursPerDay: number;
};

/**
 * Lists every calendar date in an inclusive range as `yyyy-MM-dd` strings.
 */
const getDateKeysInRange = (startDate: string, endDate: string) =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, "yyyy-MM-dd"));

/**
 * Checks whether the picked dates cover the allocation's whole range, which makes the edit a
 * base-hours change rather than a day-override change. A leave day cannot be picked and the
 * backend re-derives its hours from the base, so it counts as covered.
 */
const isFullAllocationRangeEdit = ({
  allocation,
  next,
  leaveOwnedDates,
}: {
  allocation: AllocationScheduleContext;
  next: Pick<AllocationEditSelection, "dates">;
  leaveOwnedDates: Set<string>;
}): boolean => {
  const selectedDates = new Set(next.dates);
  const [rangeStart, rangeEnd] =
    allocation.allocationStartDate <= allocation.allocationEndDate
      ? [allocation.allocationStartDate, allocation.allocationEndDate]
      : [allocation.allocationEndDate, allocation.allocationStartDate];

  return (
    selectedDates.size > 0 &&
    getDateKeysInRange(rangeStart, rangeEnd).every(
      (date) => selectedDates.has(date) || leaveOwnedDates.has(date),
    )
  );
};

/**
 * Maps each date in the allocation range to its currently effective hours,
 * applying stored day overrides (a cancelled day resolves to 0 hours).
 */
const buildEffectiveHoursByDate = ({
  allocationStartDate,
  allocationEndDate,
  allocationHoursPerDay,
  override = [],
}: AllocationScheduleContext) => {
  const overrideByDate = new Map(override.map((entry) => [entry.date, entry]));
  const hoursByDate = new Map<string, number>();

  for (const date of getDateKeysInRange(
    allocationStartDate,
    allocationEndDate,
  )) {
    const dayOverride = overrideByDate.get(date);
    const hours =
      dayOverride?.cancelled === 1
        ? 0
        : (dayOverride?.hours ?? allocationHoursPerDay);

    hoursByDate.set(date, hours);
  }

  return hoursByDate;
};

/**
 * Diffs desired hours against current hours and emits the minimal override patch:
 * dates reverting to the allocation default become deletions, zero-hour days become
 * cancellations, and everything else becomes an explicit hours override.
 */
const buildDayOverrideDiff = (
  currentHoursByDate: Map<string, number>,
  desiredHoursByDate: Map<string, number>,
  allocation: AllocationScheduleContext,
): DayOverridePatch => {
  const overrideByDate = new Map(
    (allocation.override ?? []).map((entry) => [entry.date, entry]),
  );

  return [...currentHoursByDate.entries()].reduce<DayOverridePatch>(
    (patch, [date, currentHours]) => {
      const desiredHours = desiredHoursByDate.get(date);

      if (desiredHours === undefined || desiredHours === currentHours) {
        return patch;
      }

      if (
        desiredHours === allocation.allocationHoursPerDay &&
        overrideByDate.has(date)
      ) {
        patch.deletedDayOverrides.push(date);
        return patch;
      }

      if (desiredHours <= 0) {
        patch.dayOverrides.push({ date, cancelled: 1 });
        return patch;
      }

      patch.dayOverrides.push({
        date,
        hours: desiredHours,
      });

      return patch;
    },
    {
      dayOverrides: [],
      deletedDayOverrides: [],
    },
  );
};

/**
 * Builds the payload for an Edit Schedule submission. Edits covering the whole allocation
 * update its base hours and partial edits become day-override diffs.
 */
export const buildScheduleSelectionPayload = ({
  allocation,
  next,
}: {
  allocation: AllocationScheduleContext;
  next: AllocationEditSelection;
}): ScheduleSelectionPayload => {
  const leaveOwnedDates = new Set(
    (allocation.override ?? [])
      .filter(isLeaveOwnedOverride)
      .map((entry) => entry.date),
  );
  const isBaseHoursEdit = isFullAllocationRangeEdit({
    allocation,
    next,
    leaveOwnedDates,
  });

  if (
    isBaseHoursEdit &&
    next.hoursPerDay !== allocation.allocationHoursPerDay
  ) {
    return {
      allocationHoursPerDay: next.hoursPerDay,
      dayOverrides: [],
      // The edit covers the whole allocation, so a manual override has nothing left to say
      // and is dropped. Leave-derived rows stay: the backend re-derives them from the new base.
      deletedDayOverrides: (allocation.override ?? [])
        .filter((entry) => !isLeaveOwnedOverride(entry))
        .map((entry) => entry.date),
    };
  }

  const currentHoursByDate = buildEffectiveHoursByDate(allocation);
  const desiredHoursByDate = new Map(currentHoursByDate);

  for (const date of next.dates) {
    // A leave day's hours are re-derived on save, so writing them here only produces a row the backend replaces with the value it already holds.
    if (leaveOwnedDates.has(date)) {
      continue;
    }

    desiredHoursByDate.set(date, next.hoursPerDay);
  }

  return {
    allocationHoursPerDay: allocation.allocationHoursPerDay,
    ...buildDayOverrideDiff(currentHoursByDate, desiredHoursByDate, allocation),
  };
};
