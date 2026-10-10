import type { BreadcrumbsProps } from "frappe-ui";

/** A breadcrumb item, as frappe-ui's `Breadcrumbs` takes it. */
export type TimesheetBreadcrumb = BreadcrumbsProps["items"][number];

/** Approval status of a week or a member's week. `none` hides the badge and the action. */
export type ApprovalStatus =
  "not-submitted" | "approved" | "rejected" | "approval-pending" | "none";

/** Status of a task, shown as an icon at the start of a task row. */
export type TaskRowStatus =
  "open" | "working" | "pending-rev" | "overdue" | "completed" | "cancelled";

/** One day's cell in a task row. */
export interface TaskRowTimeEntry {
  /** Hours logged, e.g. `"02:30"`. An empty string shows a dash. */
  time: string;
  /** Marks the time as non-billable with a dot under the cell. */
  nonBillable?: boolean;
  /** Disables the cell so it can't be clicked. */
  disabled?: boolean;
}

export interface HeaderRowProps {
  /** Breadcrumbs naming the levels of the grid, e.g. Week / Project / Task. */
  breadcrumbs: TimesheetBreadcrumb[];
  /** Day labels, one per column. */
  days: string[];
}

export interface WeekRowProps {
  /** Label for the week, e.g. `"This Week"`. */
  label?: string;
  /** Whether the week is collapsed (v-model:collapsed). Collapsed weeks hide the dates and show the total. */
  collapsed?: boolean;
  /** Approval status of the week. */
  status?: ApprovalStatus;
  /** Whether this is the current week; only the current week highlights today. */
  thisWeek?: boolean;
  /** Dates of the week as `"MMM D"`, e.g. `"Jan 4"`, one per column. */
  dates: string[];
  /** Today's date in the same format as `dates`. */
  today?: string;
  /** Total hours logged in the week, shown when collapsed. */
  totalHours?: string;
}

export interface MemberRowProps {
  /** Name of the member. */
  label?: string;
  /** URL of the member's avatar image. */
  avatarUrl?: string;
  /** Whether the member is collapsed (v-model:collapsed). */
  collapsed?: boolean;
  /** Approval status of the member's week. */
  status?: ApprovalStatus;
  /** Hours logged per day, one per column. An empty string shows a dash. */
  timeEntries: string[];
  /** Total hours logged in the week. */
  totalHours?: string;
}

export interface ProjectRowProps {
  /** Name of the project. */
  label?: string;
  /** Whether the project is collapsed (v-model:collapsed). */
  collapsed?: boolean;
  /** Hours logged per day, one per column. An empty string shows a dash. */
  timeEntries: string[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Approval status, which colours the total. */
  status?: ApprovalStatus;
  /** Shows the logged hours in the strong text colour. */
  highlightTimeEntries?: boolean;
}

export interface TaskRowProps {
  /** Index of the task, passed back in `cell-click` and to the `popover` slot. */
  taskIndex?: number;
  /** Name of the task. */
  label?: string;
  /** Whether the task is starred. */
  starred?: boolean;
  /** One cell per day. */
  timeEntries: TaskRowTimeEntry[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Status of the task. */
  status?: TaskRowStatus;
}

export interface TimeOffRowProps {
  /** Label for the row. */
  label?: string;
  /** Hours of time off per day, one per column. An empty string shows a dash. */
  timeOffEntries: string[];
  /** Total hours of time off in the week. */
  totalHours?: string;
}

export interface TotalRowProps {
  /** Breadcrumbs naming what is totalled, e.g. Projects / Tasks. */
  breadcrumbs: TimesheetBreadcrumb[];
  /** Whether the row is starred. Ignored when the `prefix` slot is used. */
  starred?: boolean;
  /** Total hours per day, one per column. */
  totalTimeEntries: string[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Approval status, which colours the total. */
  status?: ApprovalStatus;
}
