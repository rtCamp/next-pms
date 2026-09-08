import type { EmployeeLeaveDay } from "../types";
import type { AllocationOverrideEntry } from "../utils";

export interface Employee {
  name: string;
  image: string | null;
  employee_name: string;
  department: string | null;
  designation: string | null;
  custom_work_schedule?: string | null;
  custom_working_hours?: number | null;
  reports_to: string | null;
  ctc?: number | null;
  salary_currency?: string | null;
}

export interface Leave {
  employee: string;
  from_date: string;
  to_date: string;
  half_day: number;
  half_day_date: string | null;
  custom_first_halfsecond_half: string | null;
  total_leave_days: number;
  name: string;
}

export interface Holiday {
  employee: string;
  holiday_date: string;
  description: string;
}

export interface ResourceAllocation {
  name: string;
  employee: string;
  employee_name: string;
  recurrence_id: string | null;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  project: string;
  project_name: string;
  customer: string;
  is_billable: number;
  note: string | null;
  modified_by: string;
  modified: string;
  creation: string;
  status: string;
  modified_by_avatar: string | null;
  override?: AllocationOverrideEntry[];
}

export interface Customer {
  name: string;
  abbr: string;
  image: string | null;
}

export interface Permissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface TeamAllocationResponse {
  employees: Employee[];
  leaves: Leave[];
  employee_leaves?: Record<string, Record<string, EmployeeLeaveDay>>;
  holidays: Holiday[];
  resource_allocations: ResourceAllocation[];
  customer: Record<string, Customer>;
  total_count: number;
  has_more: boolean;
  permissions: Permissions;
}

export type ManagerNameMap = Map<string, string>;

export interface AllocationTypeSelection {
  billableValues: number[];
  statusValues: string[];
  includeUnallocated: boolean;
  isStatusApplicable: boolean;
}
