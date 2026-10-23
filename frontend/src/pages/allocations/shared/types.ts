/** The window of weeks an allocations page shows. */
export type AllocationsDuration = "this-week" | "this-month" | "this-quarter";

/** Whose rows to load again after a write; nothing means every loaded row. */
export interface AllocationRefreshTargets {
  employeeIds?: string[];
  projectIds?: string[];
}

/** An allocation's status (`status`). */
export type AllocationStatus = "Confirmed" | "Tentative";

/** A per-day row of an allocation's `override` table. */
export interface AllocationOverrideEntry {
  /** The day, as `YYYY-MM-DD`. */
  date: string;
  hours?: number | null;
  cancelled?: number | null;
  /** `"Leave"` when the leave sync wrote it, `"Manual"` when a person did. */
  source?: string | null;
}

/** A `Resource Allocation` as the allocations endpoints return it. */
export interface AllocationRecord {
  name: string;
  employee?: string;
  employee_name?: string;
  project?: string;
  project_name?: string;
  customer?: string | null;
  recurrence_id?: string | null;
  hours_allocated_per_day: number;
  total_allocated_hours: number;
  allocation_start_date: string;
  allocation_end_date: string;
  is_billable: number;
  is_ai_created?: number;
  ai_allocation_reason?: string | null;
  include_weekends?: number;
  include_holidays?: number;
  note?: string | null;
  status?: string | null;
  creation?: string | null;
  modified?: string | null;
  modified_by?: string | null;
  modified_by_full_name?: string | null;
  modified_by_avatar?: string | null;
  override?: AllocationOverrideEntry[];
}

/** How much of a working day an employee has on one date. */
export interface DayAvailability {
  /** 1 for a full day, 0.5 for a half day off, 0 for a day off. */
  availabilityFactor: number;
  isHoliday: boolean;
  holidayName?: string;
}

/** The days an employee isn't fully available, keyed by `YYYY-MM-DD`; others are full days. */
export type AvailabilityByDate = Record<string, DayAvailability>;
