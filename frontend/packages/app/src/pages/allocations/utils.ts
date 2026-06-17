/**
 * External dependencies.
 */
import type { Allocation } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addMonths, addWeeks, parseISO } from "date-fns";

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
};

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
): Allocation & { customerName?: string } {
  return {
    id: allocation.name,
    employeeId: allocation.employee || undefined,
    projectId: allocation.project || undefined,
    customerName: customerName ?? allocation.customer ?? undefined,
    hours: allocation.hours_allocated_per_day,
    startDate: parseISO(allocation.allocation_start_date),
    endDate: parseISO(allocation.allocation_end_date),
    billable: Boolean(allocation.is_billable),
    tentative: allocation.status === "Tentative",
    note: allocation.note ?? undefined,
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

    return parsed.filter(
      (value): value is FilterCondition =>
        Boolean(value) && typeof value === "object" && !Array.isArray(value),
    );
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
