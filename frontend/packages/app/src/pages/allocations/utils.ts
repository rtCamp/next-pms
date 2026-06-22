/**
 * External dependencies.
 */
import type { Allocation } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import {
  calculateWeeklyHour,
  currencyFormat,
  expectatedHours,
  isCompleteFilterCondition,
  isNoValueOperator,
  pickAllowed,
} from "@/lib/utils";
import type { WorkingFrequency } from "@/types";
import {
  ALLOCATION_WORKING_FREQUENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_HOURS_PER_WEEK,
  WEEKS_PER_MONTH,
} from "./constants";
import type { AllocationsDuration } from "./types";

const DURATION_WEEK_COUNT: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

export type AllocationApiRecord = {
  name: string;
  employee?: string;
  project?: string;
  customer?: string | null;
  recurrence_id?: string | null;
  hours_allocated_per_day: number;
  allocation_start_date: string;
  allocation_end_date: string;
  is_billable: number;
  note?: string | null;
  status?: string | null;
  creation?: string | null;
  modified?: string | null;
  modified_by?: string | null;
  modified_by_avatar?: string | null;
  override?: AllocationOverrideEntry[];
};

export type AllocationOverrideEntry = {
  date: string;
  hours?: number | null;
  cancelled?: number | null;
};

export type RecurrenceSeriesMeta = {
  recurrenceWeekCount: number;
  recurrenceSeriesEndDate: string;
};

/**
 * Builds per-allocation recurrence metadata for a flat list of allocations.
 * Allocations sharing a `recurrence_id` are grouped into a series, and every
 * member of that series is annotated with the total number of allocations in
 * the series and the last date the series covers, keyed by allocation name.
 */
export function buildRecurrenceSeriesMetaMap<T extends AllocationApiRecord>(
  allocations: T[],
): Map<string, RecurrenceSeriesMeta> {
  const allocationsByRecurrenceId = new Map<string, T[]>();

  for (const allocation of allocations) {
    if (!allocation.recurrence_id) {
      continue;
    }

    const seriesAllocations =
      allocationsByRecurrenceId.get(allocation.recurrence_id) ?? [];
    seriesAllocations.push(allocation);
    allocationsByRecurrenceId.set(allocation.recurrence_id, seriesAllocations);
  }

  const metaByAllocationName = new Map<string, RecurrenceSeriesMeta>();

  for (const seriesAllocations of allocationsByRecurrenceId.values()) {
    const sortedAllocations = [...seriesAllocations].sort((left, right) =>
      left.allocation_start_date.localeCompare(right.allocation_start_date),
    );
    const recurrenceSeriesEndDate =
      sortedAllocations[sortedAllocations.length - 1]?.allocation_end_date;

    if (!recurrenceSeriesEndDate) {
      continue;
    }

    for (const allocation of sortedAllocations) {
      metaByAllocationName.set(allocation.name, {
        recurrenceWeekCount: sortedAllocations.length,
        recurrenceSeriesEndDate,
      });
    }
  }

  return metaByAllocationName;
}

type AllocationApiFilter = [string, string, string | string[] | number | null];

type AllocationFiltersResult = {
  requestDate: string;
  maxWeek: number;
  filters: AllocationApiFilter[];
};

/**
 * Parses a Frappe datetime string (YYYY-MM-DD HH:mm:ss.ssssss) into a Date.
 * Converts the space separator to 'T' for ISO compatibility.
 */
export function parseFrappeDatetime(datetime: string): Date {
  return parseISO(datetime.replace(" ", "T"));
}

/**
 * Returns the number of weeks corresponding to a given duration type.
 */
export function getWeekCountForDuration(duration: AllocationsDuration) {
  return DURATION_WEEK_COUNT[duration];
}

/**
 * Moves the given date forward or backward based on the specified duration type.
 */
export function moveDateByDuration(
  anchorDate: Date,
  duration: AllocationsDuration,
  next: boolean,
): Date {
  const delta = next ? 1 : -1;

  if (duration === "this-week") {
    return addWeeks(anchorDate, delta);
  }

  if (duration === "this-month") {
    return addMonths(anchorDate, delta);
  }

  return addMonths(anchorDate, 3 * delta);
}

export function buildAllocationQueryFilters({
  compositeFilters,
  defaultRequestDate,
  defaultWeekCount,
}: {
  compositeFilters: FilterCondition[];
  defaultRequestDate: string;
  defaultWeekCount: number;
}): AllocationFiltersResult {
  const filters: AllocationApiFilter[] = [];

  const requestDate = defaultRequestDate;
  const maxWeek = defaultWeekCount;

  compositeFilters.forEach((filter) => {
    if (!isCompleteFilterCondition(filter)) {
      return;
    }

    filters.push([
      filter.field,
      filter.operator,
      isNoValueOperator(filter.operator) ? null : (filter.value ?? null),
    ]);
  });

  return {
    requestDate,
    maxWeek,
    filters,
  };
}

/**
 * Calculates hourly rate from CTC, working hours, work schedule, and currency.
 * For "Per Day" schedules, monthly hours = daily hours * 20 working days.
 * For weekly schedules, monthly hours = weekly hours * 4.
 */
export function calculateAllocationHourlyRate(
  ctc: number | undefined | null,
  workingHours: number | undefined | null,
  workSchedule: string | undefined | null,
  currency: string | undefined | null,
): string {
  if (!ctc) {
    return "";
  }

  const effectiveHours =
    workingHours && workingHours > 0 ? workingHours : DEFAULT_HOURS_PER_WEEK;
  const workingFrequency = resolveWorkingFrequency(workSchedule);
  const monthlyHours =
    calculateWeeklyHour(effectiveHours, workingFrequency) * WEEKS_PER_MONTH;
  const hourlyRate = ctc / 12 / monthlyHours;
  const resolvedCurrency = currency || DEFAULT_CURRENCY;

  return `${currencyFormat(resolvedCurrency).format(hourlyRate)}/hr`;
}

/**
 * Converts weekly or daily hours into a consistent daily hours value for capacity calculations.
 * For "Per Day" schedules, returns hours as-is. For weekly schedules, divides hours by 5.
 * Returns undefined if hours is not provided or invalid.
 */
export function getAllocationCapacityHoursPerDay(
  hours: number | undefined | null,
  workSchedule: string | undefined | null,
): number | undefined {
  if (!hours || hours <= 0) {
    return undefined;
  }

  const dailyHours = expectatedHours(
    hours,
    resolveWorkingFrequency(workSchedule),
  );

  return Number(dailyHours.toFixed(2));
}

/**
 * Formats working hours as a weekly capacity string.
 * Converts daily hours to weekly (daily * 5) for "Per Day" schedules.
 */
export function formatAllocationCapacity(
  hours: number | undefined | null,
  workSchedule: string | undefined | null,
): string {
  if (!hours || hours <= 0) {
    return "";
  }

  const weeklyHours = calculateWeeklyHour(
    hours,
    resolveWorkingFrequency(workSchedule),
  );

  return `${weeklyHours} hrs/week`;
}

/**
 * Maps an allocation record from the API to the internal Allocation type used in the
 * application, including parsing dates and handling optional fields.
 */
export function mapResourceAllocation<T extends AllocationApiRecord>(
  allocation: T,
  customerName?: string,
  recurrenceSeriesMeta?: RecurrenceSeriesMeta,
): Allocation & { customerName?: string } {
  return {
    id: allocation.name,
    employeeId: allocation.employee || undefined,
    projectId: allocation.project || undefined,
    recurrenceId: allocation.recurrence_id ?? undefined,
    customerName: customerName ?? allocation.customer ?? undefined,
    hours: allocation.hours_allocated_per_day,
    startDate: parseISO(allocation.allocation_start_date),
    endDate: parseISO(allocation.allocation_end_date),
    allocationStartDate: parseISO(allocation.allocation_start_date),
    allocationEndDate: parseISO(allocation.allocation_end_date),
    allocationHoursPerDay: allocation.hours_allocated_per_day,
    billable: Boolean(allocation.is_billable),
    tentative: allocation.status === "Tentative",
    note: allocation.note ?? undefined,
    override: allocation.override,
    recurrenceWeekCount: recurrenceSeriesMeta?.recurrenceWeekCount,
    recurrenceSeriesEndDate: recurrenceSeriesMeta?.recurrenceSeriesEndDate
      ? parseISO(recurrenceSeriesMeta.recurrenceSeriesEndDate)
      : undefined,
    createdOn: allocation.creation
      ? parseFrappeDatetime(allocation.creation)
      : undefined,
    updatedOn: allocation.modified
      ? parseFrappeDatetime(allocation.modified)
      : undefined,
    updatedBy: allocation.modified_by
      ? {
          name: allocation.modified_by,
          image: allocation.modified_by_avatar || undefined,
        }
      : undefined,
  };
}

/**
 * Splits an allocation into visible contiguous segments after applying per-day overrides.
 * Each segment is treated as its own visible allocation entry while still pointing at
 * the same underlying allocation document id.
 */
export function mapResourceAllocationSegments<T extends AllocationApiRecord>(
  allocation: T,
  customerName?: string,
  recurrenceSeriesMeta?: RecurrenceSeriesMeta,
): Array<Allocation & { customerName?: string }> {
  const baseAllocation = mapResourceAllocation(
    allocation,
    customerName,
    recurrenceSeriesMeta,
  );
  const overrideByDate = new Map(
    (allocation.override ?? []).map((entry) => [entry.date, entry]),
  );

  if (!overrideByDate.size) {
    return [baseAllocation];
  }

  const segments: Array<Allocation & { customerName?: string }> = [];

  let currentDate = baseAllocation.startDate;
  let segmentStart: Date | null = null;
  let segmentEnd: Date | null = null;
  let segmentHours: number | null = null;

  const pushSegment = () => {
    if (!segmentStart || !segmentEnd || segmentHours === null) {
      return;
    }

    segments.push({
      ...baseAllocation,
      startDate: segmentStart,
      endDate: segmentEnd,
      hours: segmentHours,
      override: allocation.override,
    });
  };

  while (currentDate <= baseAllocation.endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayOverride = overrideByDate.get(dateKey);
    const dayHours =
      dayOverride?.cancelled === 1
        ? 0
        : (dayOverride?.hours ?? baseAllocation.hours);

    if (dayHours <= 0) {
      pushSegment();
      segmentStart = null;
      segmentEnd = null;
      segmentHours = null;
      currentDate = addDays(currentDate, 1);
      continue;
    }

    if (segmentStart && segmentHours === dayHours) {
      segmentEnd = currentDate;
      currentDate = addDays(currentDate, 1);
      continue;
    }

    pushSegment();
    segmentStart = currentDate;
    segmentEnd = currentDate;
    segmentHours = dayHours;
    currentDate = addDays(currentDate, 1);
  }

  pushSegment();

  return segments;
}

/**
 * Resolves the working frequency ("Per Day" or "Per Week") from the employee's work schedule string.
 */
function resolveWorkingFrequency(
  workSchedule: string | undefined | null,
): WorkingFrequency {
  return (
    pickAllowed(workSchedule, ALLOCATION_WORKING_FREQUENCIES) ?? "Per Week"
  );
}

/**
 * Parses a JSON string representing composite filters into an array of FilterCondition objects.
 */
export function parseAllocationCompositeFilters(
  raw: string | null,
): FilterCondition[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is FilterCondition => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
      }

      const filter = value as Record<string, unknown>;

      return (
        typeof filter.id === "string" &&
        typeof filter.field === "string" &&
        typeof filter.operator === "string" &&
        "value" in filter &&
        (!("fieldCategory" in filter) ||
          filter.fieldCategory === undefined ||
          typeof filter.fieldCategory === "string")
      );
    });
  } catch {
    return [];
  }
}

/**
 * Parses a JSON string representing an array of allocation types into a string array.
 */
export function parseAllocationStringArray(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

/**
 * Parses a date string from the URL query parameter into a Date object.
 */
export function parseAllocationAnchorDate(raw: string | null): Date {
  if (!raw) return new Date();

  const parsedDate = parseISO(raw);

  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}
