/**
 * External dependencies.
 */
import { eachDayOfInterval, format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import type { AllocationOverrideEntry } from "./utils";

interface AllocationScheduleContext {
  allocationStartDate: string;
  allocationEndDate: string;
  allocationHoursPerDay: number;
  override?: AllocationOverrideEntry[];
}

interface AllocationEditRange {
  startDate: string;
  endDate: string;
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

/**
 * Lists every calendar date in an inclusive range as `yyyy-MM-dd` strings.
 */
const getDateKeysInRange = (startDate: string, endDate: string) =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, "yyyy-MM-dd"));

/**
 * Orders a date range so the start is on or before the end.
 */
const normalizeRange = (startDate: string, endDate: string) =>
  startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };

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
 * Builds the day-override patch for an Edit Schedule submission: sets the selected
 * date range to the chosen hours-per-day and diffs it against the allocation's current
 * effective hours, returning the add/edit and delete operations to send to the API.
 */
export const buildScheduleSelectionOverridePatch = ({
  allocation,
  next,
}: {
  allocation: AllocationScheduleContext;
  next: AllocationEditRange;
}): DayOverridePatch => {
  const currentHoursByDate = buildEffectiveHoursByDate(allocation);
  const desiredHoursByDate = new Map(currentHoursByDate);
  const normalizedNextRange = normalizeRange(next.startDate, next.endDate);

  for (const date of getDateKeysInRange(
    normalizedNextRange.startDate,
    normalizedNextRange.endDate,
  )) {
    desiredHoursByDate.set(date, next.hoursPerDay);
  }

  return buildDayOverrideDiff(
    currentHoursByDate,
    desiredHoursByDate,
    allocation,
  );
};
