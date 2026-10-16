import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type {
  TimesheetHoliday,
  TimesheetLeave,
  TimesheetTask,
  TimesheetTasks,
} from "@/components/Timesheet";
import type { WorkingFrequency } from "@/session";

/** One week of an employee's timesheet, as `get_timesheet_data` returns it. */
export interface TimesheetWeek {
  /** `"This Week"` or `"Mon DD - Sun DD"`, also the week's key in `data`. */
  key: string;
  start_date: string;
  end_date: string;
  /** The week's days as `YYYY-MM-DD`. */
  dates: string[];
  total_hours: number;
  tasks: TimesheetTasks;
  status: ApprovalStatusValue;
  /** Label shown on the week row, added on the client. */
  label?: string;
}

/** Response of `next_pms.timesheet.api.timesheet.get_timesheet_data`. */
export interface TimesheetData {
  working_hour: number;
  working_frequency: WorkingFrequency;
  /** Weeks by key, newest first. */
  data: Record<string, TimesheetWeek>;
  leaves: TimesheetLeave[];
  holidays: TimesheetHoliday[];
  has_more?: boolean;
}

/** A starred task from `task.get_liked_tasks`, also the format imported tasks are stored in. */
export type LikedTask = TimesheetTask & { exp_end_date?: string };
