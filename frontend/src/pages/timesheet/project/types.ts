import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type {
  TimesheetHoliday,
  TimesheetLeave,
  TimesheetTasks,
} from "@/components/Timesheet";
import type { WorkingFrequency } from "@/session";

/** The project endpoints' filter arguments; unset ones are left out of the request. */
export interface ProjectFilterArgs {
  search?: string;
  /** JSON `[[fieldCategory, field, operator, value]]`. */
  filters?: string;
}

/** A week of `project.get_project_timesheet_weeks`, without its projects. */
export interface ProjectWeekSummary {
  key: string;
  start_date: string;
  end_date: string;
  /** The server's label; the page shows its own, added on the client. */
  label: string;
  dates: string[];
  project_count: number;
  has_more_projects: boolean;
}

/** Response of `next_pms.timesheet.api.project.get_project_timesheet_weeks`. */
export interface ProjectWeeksPayload {
  weeks: ProjectWeekSummary[];
  has_more_weeks: boolean;
  /** Date the next page starts from; `null` when there are no more weeks. */
  next_date: string | null;
}

/** One member's share of a project in a week. */
export interface ProjectMember {
  label: string;
  employee: string;
  avatar_url: string | null;
  /** The member's tasks on this project only. */
  tasks: TimesheetTasks;
  holidays: TimesheetHoliday[];
  leaves: TimesheetLeave[];
  backdate_restricted_before: string | null;
  working_hour: number;
  working_frequency: WorkingFrequency;
  /** The member's whole week, not just this project's share of it. */
  status: ApprovalStatusValue;
}

/** A project of a week with its members. */
export interface ProjectWeekProject {
  project: string;
  project_name: string | null;
  /** Members whose week on this project the user may approve or reject. */
  approvable_employees?: string[];
  members: ProjectMember[];
}

/** Response of `next_pms.timesheet.api.project.get_project_timesheet_data`. */
export interface ProjectWeekProjectsPayload {
  start_date: string;
  end_date: string;
  dates: string[];
  projects: ProjectWeekProject[];
  total_count: number;
  has_more: boolean;
}

/** One employee's week keyed by project, as the `project_timesheet_info` event sends it. */
export interface ProjectMemberWeekPayload {
  employee: string;
  start_date: string;
  end_date: string;
  dates: string[];
  projects: Record<
    string,
    { project: string; project_name: string | null; member: ProjectMember }
  >;
}

/**
 * Payload of the `project_timesheet_info` realtime event. Only the user who saved the
 * timesheet gets `message`; everyone else gets an invalidation and reloads the week.
 */
export interface ProjectTimesheetInfoEvent {
  message?: ProjectMemberWeekPayload | null;
  employee?: string;
  start_date?: string;
}
