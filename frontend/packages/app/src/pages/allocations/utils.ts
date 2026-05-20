import type { Allocation } from "@next-pms/design-system/components";
import { addMonths, addWeeks, parseISO } from "date-fns";
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
