import type { AllocationApiRecord } from "../utils";

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

export interface ProjectWeek {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
}

export interface ProjectWeekData {
  total_allocated_hours: number;
  total_worked_hours?: number;
}

export interface ProjectDateData {
  date: string;
  total_allocated_hours: number;
  total_worked_hours?: number;
  project_resource_allocation_for_given_date: Array<{
    name: string;
    date: string;
  }>;
}

export interface ProjectResourceAllocation extends AllocationApiRecord {
  employee: string;
  employee_name: string;
  project: string;
  project_name: string;
  customer: string;
}

export interface ProjectRecord {
  name: string;
  project_name: string;
  status?: string;
  all_week_data: ProjectWeekData[];
  all_dates_data: Record<string, ProjectDateData>;
  project_allocations:
    | Record<string, ProjectResourceAllocation>
    | ProjectResourceAllocation[];
}

export interface ProjectAllocationResponse {
  dates: ProjectWeek[];
  data: ProjectRecord[];
  customer: Record<string, Customer>;
  total_count: number;
  has_more: boolean;
  permissions: Permissions;
}
