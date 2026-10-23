import type { AllocationRecord } from "@/pages/allocations/shared/types";

/** An employee of `get_resource_management_project_view_data`, keyed by id. */
export interface ProjectEmployeeRecord {
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

/** A day an employee is away; only days with `is_on_leave` are sent. */
export interface ProjectLeaveDay {
  is_on_leave: boolean;
  is_holiday: boolean;
  /** Hours of the working day the employee is away. */
  total_leave_hours: number;
  holiday_name?: string | null;
}

/** A project row of the Project endpoint. */
export interface ProjectRecord {
  name: string;
  project_name?: string | null;
  customer?: string | null;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  custom_project_manager?: string | null;
  custom_project_manager_name?: string | null;
  /** Hours still allocated from today to the end of each allocation. */
  remaining_hours?: number | null;
  /** The project's allocations in the window, keyed by name. */
  project_allocations?: Record<string, AllocationRecord> | AllocationRecord[];
}

/** Response of `get_resource_management_project_view_data` without the hours summary. */
export interface ProjectAllocationsResponse {
  data: ProjectRecord[];
  /** Customers by id; `name` is the customer's name. */
  customer: Record<string, { name?: string | null; abbr?: string | null }>;
  employees: Record<string, ProjectEmployeeRecord>;
  /** The days each employee is away, by employee id and then `YYYY-MM-DD`. */
  employee_leaves?: Record<string, Record<string, ProjectLeaveDay>>;
  total_count: number;
  has_more: boolean;
}
