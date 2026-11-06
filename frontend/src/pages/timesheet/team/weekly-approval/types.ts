import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { TaskStatusValue } from "@/components/TaskStatus";

/** The employee-week a weekly approval dialog reviews. */
export interface WeeklyApprovalTarget {
  employeeId: string;
  /** Passed in rather than fetched: a project manager can't read the Employee. */
  employeeName: string;
  avatarUrl?: string;
  /** Any day of the week, normally its first (`YYYY-MM-DD`). */
  startDate: string;
  /** Limits the review to one project's entries (project page). */
  projectId?: string;
  projectName?: string;
}

/** A time entry as the approval dialog lists it. */
export interface ApprovalEntry {
  /** Timesheet Detail ID. */
  name: string;
  /** Timesheet ID. */
  parent: string;
  taskId: string;
  taskName: string;
  projectName: string;
  hours: number;
  rejectedHours: number;
  description: string;
  /** `YYYY-MM-DD`. */
  date: string;
  taskStatus: TaskStatusValue;
  isBillable: boolean;
  docstatus: number;
  /** Leave hours on the entry's day. */
  leaveHours: number;
  leaveLabel?: string;
  approvalStatus?: ApprovalStatusValue;
  rejectionReason?: string;
  weeklyRejectionReason?: string;
}

/** A day of the week under review, with its entries. */
export interface ApprovalDay {
  /** `YYYY-MM-DD`. */
  date: string;
  /** e.g. `"Mon, Mar 16"`. */
  label: string;
  /** Logged hours plus leave hours. */
  totalHours: number;
  leaveLabel?: string;
  /** Approved, rejected or being processed: no longer open to a decision. */
  isDecided: boolean;
  entries: ApprovalEntry[];
}

/** The week under review, from `get_timesheet_data`. */
export interface ApprovalWeek {
  /** The week's key, e.g. `"This Week"` or `"Mar 16 - Mar 22"`. */
  dateRange: string;
  totalHours: number;
  dailyHours: number;
  entries: ApprovalEntry[];
}
