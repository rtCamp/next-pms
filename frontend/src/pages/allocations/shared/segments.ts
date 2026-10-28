import { dayjs } from "frappe-ui";
import type { Allocation } from "@/components/GanttGrid";
import { LEAVE_OVERRIDE_SOURCE } from "./constants";
import { formatISODate, parseISODate } from "./dateWindow";
import type {
  AllocationOverrideEntry,
  AllocationRecord,
  DayAvailability,
} from "./types";

/** A Frappe datetime (`YYYY-MM-DD HH:mm:ss.ffffff`) as a local date. */
export function parseFrappeDatetime(value: string): Date {
  return dayjs(value.replace(" ", "T").slice(0, 23)).toDate();
}

/**
 * Whether the leave sync wrote this override rather than a person. The backend rewrites
 * these rows on every save, so they can't be edited day by day.
 */
export function isLeaveOwnedOverride(entry: AllocationOverrideEntry): boolean {
  return entry.source === LEAVE_OVERRIDE_SOURCE;
}

/**
 * How much of a day an allocation books: all of it, unless the employee is away and the
 * allocation is reduced on days off.
 */
export function reducingFactor(
  day: DayAvailability | undefined,
  includeHolidays: boolean,
): number {
  return !day || includeHolidays ? 1 : day.availabilityFactor;
}

/** The hours a day books, reading its override before the allocation's hours per day. */
export function dayHours(
  entry: AllocationOverrideEntry | undefined,
  hoursPerDay: number,
): number {
  return entry?.cancelled === 1 ? 0 : (entry?.hours ?? hoursPerDay);
}

function toDate(value: string): Date {
  return parseISODate(value) ?? dayjs(value).startOf("day").toDate();
}

/** An allocation record as one `GanttGrid` allocation covering its whole range. */
export function mapAllocation(record: AllocationRecord): Allocation {
  const startDate = toDate(record.allocation_start_date);
  const endDate = toDate(record.allocation_end_date);
  return {
    id: record.name,
    employeeId: record.employee || undefined,
    projectId: record.project || undefined,
    recurrenceId: record.recurrence_id || undefined,
    hours: record.hours_allocated_per_day,
    startDate,
    endDate,
    allocationStartDate: startDate,
    allocationEndDate: endDate,
    allocationHoursPerDay: record.hours_allocated_per_day,
    includeWeekends: Boolean(record.include_weekends),
    includeHolidays: Boolean(record.include_holidays),
    billable: Boolean(record.is_billable),
    tentative: record.status === "Tentative",
    isAiCreated: Boolean(record.is_ai_created),
    aiReason: record.ai_allocation_reason || undefined,
    note: record.note ?? undefined,
    override: record.override,
    createdOn: record.creation
      ? parseFrappeDatetime(record.creation)
      : undefined,
    updatedOn: record.modified
      ? parseFrappeDatetime(record.modified)
      : undefined,
    updatedBy: record.modified_by
      ? {
          name: record.modified_by_full_name || record.modified_by,
          image: record.modified_by_avatar || undefined,
        }
      : undefined,
  };
}

/**
 * Splits an allocation into the runs of days that book the same hours once its per-day
 * overrides apply; each run is a bar pointing at the same allocation. Days booking
 * nothing end a run.
 *
 * An allocation reduced to zero hours still blocks overlapping ones, so it keeps one
 * zero-hour placeholder (`fullyReduced`). That reads the backend's total, not the days
 * here, which include weekend days the allocation never books.
 */
export function mapAllocationSegments(record: AllocationRecord): Allocation[] {
  const base = mapAllocation(record);
  if (!record.total_allocated_hours) {
    return [{ ...base, hours: 0, fullyReduced: true }];
  }
  const overrides = new Map(
    (record.override ?? []).map((entry) => [entry.date, entry]),
  );
  if (!overrides.size) return [base];

  const segments: Allocation[] = [];
  let run: { start: Date; end: Date; hours: number } | null = null;
  const close = () => {
    if (run) {
      segments.push({
        ...base,
        startDate: run.start,
        endDate: run.end,
        hours: run.hours,
      });
    }
    run = null;
  };

  for (
    let day = dayjs(base.startDate);
    !day.isAfter(base.endDate, "day");
    day = day.add(1, "day")
  ) {
    const date = day.toDate();
    const hours = dayHours(overrides.get(formatISODate(date)), base.hours);
    if (hours <= 0) {
      close();
    } else if (run && run.hours === hours) {
      run.end = date;
    } else {
      close();
      run = { start: date, end: date, hours };
    }
  }
  close();
  return segments;
}

/** Customer ids of the loaded allocations, by allocation and by project, for the dialogs. */
export interface CustomerIndex {
  byAllocation: Map<string, string>;
  byProject: Map<string, string>;
}

export function indexCustomers(records: AllocationRecord[]): CustomerIndex {
  const index: CustomerIndex = {
    byAllocation: new Map(),
    byProject: new Map(),
  };
  for (const record of records) {
    if (!record.customer) continue;
    index.byAllocation.set(record.name, record.customer);
    if (record.project) index.byProject.set(record.project, record.customer);
  }
  return index;
}
