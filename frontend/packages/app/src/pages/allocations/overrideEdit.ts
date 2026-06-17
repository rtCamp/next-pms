import { eachDayOfInterval, format, parseISO } from "date-fns";

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

interface AllocationSegmentContext {
  segmentStartDate: string;
  segmentEndDate: string;
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

const getDateKeysInRange = (startDate: string, endDate: string) =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, "yyyy-MM-dd"));

const normalizeRange = (startDate: string, endDate: string) =>
  startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };

export const extendAllocationRange = (
  allocation: AllocationScheduleContext,
  range: Pick<AllocationEditRange, "startDate" | "endDate">,
) => ({
  allocationStartDate:
    range.startDate < allocation.allocationStartDate
      ? range.startDate
      : allocation.allocationStartDate,
  allocationEndDate:
    range.endDate > allocation.allocationEndDate
      ? range.endDate
      : allocation.allocationEndDate,
  allocationHoursPerDay: allocation.allocationHoursPerDay,
  override: allocation.override,
});

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

export const shouldUseOverrideAwareAllocationEdit = ({
  allocationStartDate,
  allocationEndDate,
  allocationHoursPerDay,
  startDate,
  endDate,
  hoursPerDay,
  override = [],
}: AllocationScheduleContext & AllocationEditRange) =>
  override.length > 0 ||
  startDate !== allocationStartDate ||
  endDate !== allocationEndDate ||
  hoursPerDay !== allocationHoursPerDay;

export const buildSegmentEditOverridePatch = ({
  allocation,
  segment,
  next,
}: {
  allocation: AllocationScheduleContext;
  segment: AllocationSegmentContext;
  next: AllocationEditRange;
}): DayOverridePatch => {
  const currentHoursByDate = buildEffectiveHoursByDate(allocation);
  const desiredHoursByDate = new Map(currentHoursByDate);
  const normalizedSegment = normalizeRange(
    segment.segmentStartDate,
    segment.segmentEndDate,
  );
  const normalizedNextRange = normalizeRange(next.startDate, next.endDate);

  for (const date of getDateKeysInRange(
    normalizedSegment.startDate,
    normalizedSegment.endDate,
  )) {
    desiredHoursByDate.set(date, 0);
  }

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
