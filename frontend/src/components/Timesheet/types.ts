import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { TaskStatusValue } from "@/components/TaskStatus";

/** Colour of a total: green on target, red short, amber over, gray neutral. */
export type TotalHoursTheme = "green" | "red" | "amber" | "gray";

/** How hours logged compare with the hours expected; `none` when nothing is expected. */
export type HoursComparison = "short" | "met" | "over" | "none";

/**
 * An approval status as the timesheet rows take it: a backend value, or `"None"` for a
 * row without one (a team or project week), which hides the badge and the action.
 */
export type TimesheetApprovalStatus = ApprovalStatusValue | "None";

/** One day's cell in a member, project or total row. */
export interface DayCell {
  /** Hours logged, e.g. `"02:30"`. An empty string shows a dash. */
  time: string;
  /** The day as `YYYY-MM-DD`, passed back with the cell's click. */
  date?: string;
  /** Turns the cell's add-time button off. */
  disabled?: boolean;
}

/** One day's cell in a task row. */
export interface TaskRowTimeEntry extends DayCell {
  /** Marks the time as non-billable with a dot under the cell. */
  nonBillable?: boolean;
  /** Approval status of the day's entries, which colours the time. */
  status?: ApprovalStatusValue;
  /** Why the day's time was rejected, from its first rejected entry. */
  rejectionReason?: string | null;
}

/** One day's cell in a time-off row. */
export interface TimeOffEntry {
  /** Hours off, e.g. `"08:00"`. An empty string shows a dash. */
  time: string;
  /** Whether the day is a holiday, which dims the time. */
  holiday?: boolean;
  /** Shown in a tooltip on the day's cell. */
  holidayDescription?: string;
}

export interface HeaderRowProps {
  /** Names of the grid's levels, e.g. `["Week", "Project", "Task"]`. */
  levels: string[];
  /** Day labels, one per column. */
  days: string[];
}

export interface WeekRowProps {
  /** Label for the week, e.g. `"This Week"`. */
  label?: string;
  /** Approval status of the week. Unset or `"None"` hides the badge and the action. */
  status?: TimesheetApprovalStatus;
  /** Whether this is the current week; only the current week highlights today. */
  thisWeek?: boolean;
  /** Dates of the week as `"MMM D"`, e.g. `"Jan 4"`, one per column. */
  dates: string[];
  /** Today's date in the same format as `dates`. */
  today?: string;
  /** Total hours logged in the week, shown when collapsed. */
  totalHours?: string;
  /** Colour of the collapsed week's total. */
  totalHoursTheme?: TotalHoursTheme;
  /** Text after the badge, e.g. `"· 2 pending approvals"`. */
  badgeLabel?: string;
}

export interface MemberRowProps {
  /** Name of the member. */
  label?: string;
  /** URL of the member's avatar image. */
  avatarUrl?: string;
  /** Approval status of the member's week. Unset or `"None"` hides the badge and the action. */
  status?: TimesheetApprovalStatus;
  /** One cell per day. */
  timeEntries: DayCell[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Colour of the total. */
  totalHoursTheme?: TotalHoursTheme;
  /** Hides the action button at the end of the row. */
  hideAction?: boolean;
}

export interface ProjectRowProps {
  /** Name of the project. */
  label?: string;
  /** One cell per day. */
  timeEntries: DayCell[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Colour of the total. */
  totalHoursTheme?: TotalHoursTheme;
  /** Shows the logged hours in the strong text colour. */
  highlightTimeEntries?: boolean;
}

export interface TaskRowProps {
  /** Name of the task. */
  label: string;
  /** Status of the task, shown as an icon. */
  status?: TaskStatusValue;
  /** Whether the task is starred. */
  starred?: boolean;
  /** Hides the star button. */
  hideStarButton?: boolean;
  /** One cell per day. */
  timeEntries: TaskRowTimeEntry[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /**
   * Runs `action` when it is safe to close an `entry` popover that the user
   * is editing, e.g. after confirming that unsaved changes may be lost.
   */
  guard?: (action: () => void) => void;
}

export interface TimeOffRowProps {
  /** Label for the row. */
  label?: string;
  /** One cell per day. */
  timeOffEntries: TimeOffEntry[];
  /** Total hours of time off in the week. */
  totalHours?: string;
}

export interface TotalRowProps {
  /** Names of what is totalled, e.g. `["Projects", "Tasks"]`. */
  levels: string[];
  /** Whether the week's liked tasks are imported, which fills the star. */
  starred?: boolean;
  /** One cell per day. */
  totalTimeEntries: DayCell[];
  /** Total hours logged in the week. */
  totalHours?: string;
  /** Colour of the total. */
  totalHoursTheme?: TotalHoursTheme;
  /** Turns every cell's add-time button off. */
  disabled?: boolean;
}

export interface TaskCardProps {
  /** Name of the task. */
  label: string;
  /** Status of the task. */
  status: TaskStatusValue;
  /** Name of the task's project. */
  projectName?: string;
  /** Due date as `YYYY-MM-DD`. */
  dueDate?: string;
  /** Hours logged on the task. */
  actualHours: number;
  /** Hours estimated for the task. */
  estimatedHours: number;
}

/** One time entry (`Timesheet Detail`) as the timesheet endpoints return it. */
export interface TimeEntry {
  /** `Timesheet Detail` ID. */
  name: string;
  /** ID of the `Timesheet` holding the entry. */
  parent: string;
  /** Task ID. */
  task: string;
  hours: number;
  /** Hours parked by a rejection; the entry's `hours` is then 0. */
  rejected_hours: number;
  description: string;
  is_billable: boolean | number;
  /** Start as `YYYY-MM-DD HH:mm:ss`; its date is the entry's day. */
  from_time: string;
  to_time?: string;
  docstatus: 0 | 1 | 2;
  subject?: string;
  project?: string;
  project_name?: string | null;
  custom_approval_status?: ApprovalStatusValue | null;
  custom_rejection_reason?: string | null;
}

/** A task with its time entries for a week. */
export interface TimesheetTask {
  /** Task ID. */
  name: string;
  subject: string;
  project: string;
  project_name: string | null;
  is_billable: boolean;
  /** Estimated hours. */
  expected_time: number;
  /** Hours logged on the task in total. */
  actual_time: number;
  /** The task's status; see `toTaskStatus`. */
  status: string;
  due_date?: string;
  data: TimeEntry[];
}

/** A week's tasks, keyed by task ID (or `employee::task` when merged across members). */
export type TimesheetTasks = Record<string, TimesheetTask>;

/** A leave application overlapping the loaded weeks. */
export interface TimesheetLeave {
  name: string;
  from_date: string;
  to_date: string;
  status: string;
  half_day: boolean;
  half_day_date: string;
  leave_type: string;
  is_lwp: boolean;
  includes_holidays: boolean;
  custom_first_halfsecond_half?: string | null;
}

/** A holiday or weekly off from the employee's holiday list. */
export interface TimesheetHoliday {
  description: string;
  /** `YYYY-MM-DD`. */
  holiday_date: string;
  weekly_off: boolean;
}
