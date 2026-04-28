export interface Allocation {
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
  /** Created on date. */
  createdOn?: Date;
  /** Updated on date. */
  updatedOn?: Date;
  /** Updated by user. */
  updatedBy?: {
    employeeId: string;
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
  name: string;
  dateRange?: string;
  client?: string;
  badge?: string;
  allocations?: Allocation[];
}

export interface Member {
  id?: string;
  name: string;
  role?: string;
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
  /** Called when "Add" is clicked in an allocation popup. */
  onAddAllocation?: () => void;
  /** Called when the edit icon is clicked on an allocation entry. */
  onEditAllocation?: () => void;
  /** Called when the delete icon is clicked on an allocation entry. */
  onDeleteAllocation?: () => void;
}
