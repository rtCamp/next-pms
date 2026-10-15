import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { TaskStatusValue } from "@/components/TaskStatus";

/** Colour of a total: green on target, red short, amber over, gray neutral. */
export type TotalHoursTheme = "green" | "red" | "amber" | "gray";

/** One day's cell in a member, project or total row. */
export interface DayCell {
  /** Hours logged, e.g. `"02:30"`. An empty string shows a dash. */
  time: string;
  /** Turns the cell's add-time button off. */
  disabled?: boolean;
}

/** One day's cell in a task row. */
export interface TaskRowTimeEntry extends DayCell {
  /** Marks the time as non-billable with a dot under the cell. */
  nonBillable?: boolean;
  /** Approval status of the day's entries, which colours the time. */
  status?: ApprovalStatusValue;
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
  /** Approval status of the week. Unset hides the badge and the action. */
  status?: ApprovalStatusValue;
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
  /** Approval status of the member's week. Unset hides the badge and the action. */
  status?: ApprovalStatusValue;
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
