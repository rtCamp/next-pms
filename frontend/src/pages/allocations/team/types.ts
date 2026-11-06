import type { AllocationRecord } from "@/pages/allocations/shared/types";

/** An employee row of `get_resource_management_team_view_data`. */
export interface TeamEmployeeRecord {
  name: string;
  employee_name: string;
  image?: string | null;
  department?: string | null;
  designation?: string | null;
  custom_work_schedule?: string | null;
  custom_working_hours?: number | null;
  reports_to?: string | null;
  ctc?: number | string | null;
  salary_currency?: string | null;
}

/** An approved leave in the window. */
export interface TeamLeaveRecord {
  employee: string;
  from_date: string;
  to_date: string;
  half_day?: number | null;
  half_day_date?: string | null;
  /** A site customisation: "First Half" or "Second Half"; can be missing. */
  custom_first_halfsecond_half?: string | null;
}

/** A named holiday in the window (weekly offs are left out). */
export interface TeamHolidayRecord {
  employee: string;
  holiday_date: string;
  description?: string | null;
}

/** Response of `get_resource_management_team_view_data` without the hours summary. */
export interface TeamAllocationsResponse {
  employees: TeamEmployeeRecord[];
  leaves: TeamLeaveRecord[];
  holidays: TeamHolidayRecord[];
  resource_allocations: AllocationRecord[];
  /** Customers by id; `name` is the customer's name. */
  customer: Record<string, { name?: string | null; abbr?: string | null }>;
  total_count: number;
  has_more: boolean;
}
