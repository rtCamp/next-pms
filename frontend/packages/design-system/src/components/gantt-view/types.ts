export type DeleteAllocationMode =
  | "only_this"
  | "this_and_future"
  | "all_in_series";

export interface Allocation {
  /** Unique identifier for the allocation. */
  id?: string;
  /** Employee identifier this allocation belongs to. */
  employeeId?: string;
  /** Project identifier this allocation belongs to. */
  projectId?: string;
  /** Recurrence identifier shared by a series of allocations. */
  recurrenceId?: string;
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
  /** Existing day-level overrides attached to the allocation. */
  override?: {
    date: string;
    hours?: number | null;
    cancelled?: number | null;
  }[];
  /** Underlying allocation document start date. */
  allocationStartDate?: Date;
  /** Underlying allocation document end date. */
  allocationEndDate?: Date;
  /** Underlying allocation document default hours per day. */
  allocationHoursPerDay?: number;
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
  projectDateRange?: string;
  client?: string;
  projectManager?: string;
  weeklyCapacity?: number;
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
  capacityHoursPerDay?: number;
  manager?: string;
  projects?: Project[];
  leaves?: LeaveAllocation[];
}

export interface ProjectMember extends Omit<Member, "projects"> {
  allocations?: Allocation[];
}

export interface ProjectGroup extends Omit<Project, "allocations"> {
  members?: ProjectMember[];
}

export type GanttGridVariant = "team" | "project";

export interface AllocationCallbackData {
  /** Allocation identifier. */
  allocationId?: string;
  /** Employee identifier. */
  employeeId?: string;
  /** Employee name. */
  employeeName?: string;
  /** Project identifier. */
  projectId?: string;
  /** Recurrence identifier shared by a series of allocations. */
  recurrenceId?: string;
  /** Project name. */
  projectName?: string;
  /** Customer name. */
  customerName?: string;
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
  /** Existing day-level overrides attached to the allocation. */
  override?: {
    date: string;
    hours?: number | null;
    cancelled?: number | null;
  }[];
  /** Underlying allocation document start date. */
  allocationStartDate?: Date;
  /** Underlying allocation document end date. */
  allocationEndDate?: Date;
  /** Underlying allocation document default hours per day. */
  allocationHoursPerDay?: number;
  /** Visible segment start date before the current edit. */
  segmentStartDate?: Date;
  /** Visible segment end date before the current edit. */
  segmentEndDate?: Date;
  /** Visible segment hours per day before the current edit. */
  segmentHoursPerDay?: number;
  /** Called after the allocation is successfully saved. */
  onSuccess?: () => void;
}

export interface GanttGridHandle {
  /** True when there is an in-progress, unsaved allocation edit or draft bar. */
  hasUnsavedChanges: () => boolean;
  /** Trigger the currently-active edit's save path. */
  saveChanges: () => void;
  /** Trigger the currently-active edit's discard path. */
  discardChanges: () => void;
}

export interface GanttGridProps {
  /** Any date within the first week to display. */
  startDate: Date;
  /** Number of weeks to display. */
  weekCount?: number;
  /** Member row data. */
  members?: Member[];
  /** Project row data. */
  projects?: ProjectGroup[];
  /** Label shown in the sticky row header cell. */
  rowHeaderLabel: string;
  /** Layout and transformation mode for the grid. */
  variant: GanttGridVariant;
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
  /** Called when delete is confirmed for an allocation entry. Receives allocation data and delete scope. */
  onDeleteAllocation?: (
    data: AllocationCallbackData,
    deleteMode: DeleteAllocationMode,
  ) => Promise<void>;
}
