export type AllocationsDuration = "this-week" | "this-month" | "this-quarter";

export interface AllocationRefreshTargets {
  employeeIds?: string[];
  projectIds?: string[];
}

export interface EmployeeLeaveDay {
  is_on_leave: boolean;
  is_holiday: boolean;
  total_leave_hours: number;
  holiday_name?: string;
}
