export interface Allocation {
  /** Unique identifier for the allocation. */
  id?: string;
  /** Employee identifier this allocation belongs to. */
  employeeId?: string;
  /** Project identifier this allocation belongs to. */
  projectId?: string;
  /** Hours per day. */
  hours: number;
  /** First day of the allocation. */
  startDate: Date;
  /** Last day of the allocation (inclusive). */
  endDate: Date;
  /** Whether the allocation is billable. */
  billable?: boolean;
  /** Whether the allocation is tentative. */
  tentative?: boolean;
  /** Note for the allocation. */
  note?: string;
  /** Created on date. */
  createdOn?: Date;
  /** Updated on date. */
  updatedOn?: Date;
  /** Updated by user. */
  updatedBy?: {
    name: string;
    image?: string;
  };
}

export interface MemberBarAllocation extends Allocation {
  type?: "default" | "timeoff";
}

export interface LeaveAllocation {
  /** First day of leave. */
  startDate: Date;
  /** Last day of leave (inclusive). */
  endDate: Date;
}

export interface Project {
  id?: string;
  name: string;
  dateRange?: string;
  client?: string;
  badge?: string;
  allocations?: Allocation[];
}

export interface Member {
  id?: string;
  name: string;
  image?: string;
  badge?: string;
  designation?: string;
  department?: string;
  rate?: string;
  capacity?: string;
  manager?: string;
  projects?: Project[];
  leaves?: LeaveAllocation[];
}

export interface AllocationCallbackData {
  /** Allocation identifier. */
  allocationId?: string;
  /** Employee identifier. */
  employeeId?: string;
  /** Project identifier. */
  projectId?: string;
  /** Project name. */
  projectName?: string;
  /** Allocation start date. */
  startDate?: Date;
  /** Allocation end date. */
  endDate?: Date;
  /** Hours per day. */
  hoursPerDay?: number;
  /** Whether the allocation is billable. */
  billable?: boolean;
  /** Whether the allocation is tentative. */
  tentative?: boolean;
  /** Note for the allocation. */
  note?: string;
}

export interface GanttGridProps {
  /** Any date within the first week to display. */
  startDate: Date;
  /** Number of weeks to display. */
  weekCount?: number;
  /** Member row data. */
  members: Member[];
  /** Whether to include Saturday and Sunday columns. When false, week boundary is every 5th column. */
  showWeekend?: boolean;
  /** Whether current user can manage member projects. */
  hasRoleAccess?: boolean;
  /** Optional custom classes for the root wrapper. */
  className?: string;
  /** Called when "Add" is clicked in an allocation popup. Receives employee data. */
  onAddAllocation?: (data: AllocationCallbackData) => void;
  /** Called when the edit icon is clicked on an allocation entry. Receives allocation data. */
  onEditAllocation?: (data: AllocationCallbackData) => void;
  /** Called when the delete icon is clicked on an allocation entry. Receives allocation data. */
  onDeleteAllocation?: (data: AllocationCallbackData) => void;
}
