export type AllocationsDuration = "this-week" | "this-month" | "this-quarter";

export interface AllocationRefreshTargets {
  employeeIds?: string[];
  projectIds?: string[];
}
