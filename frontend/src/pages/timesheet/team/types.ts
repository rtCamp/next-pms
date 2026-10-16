import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type {
  TimesheetHoliday,
  TimesheetLeave,
  TimesheetTasks,
} from "@/components/Timesheet";
import type { WorkingFrequency } from "@/session";

/** The team endpoints' filter arguments; unset ones are left out of the request. */
export interface TeamFilterArgs {
  reports_to?: string;
  search?: string;
  /** JSON list of approval statuses. */
  status_filter?: string;
  /** JSON `[[fieldCategory, field, operator, value]]`. */
  filters?: string;
}

/** A week of `team.get_team_timesheet_weeks`, without its members. */
export interface TeamWeekSummary {
  key: string;
  start_date: string;
  end_date: string;
  /** The server's label; the page shows its own, added on the client. */
  label: string;
  dates: string[];
  member_count: number;
  approval_pending_count: number;
  has_more_members: boolean;
}

/** Response of `next_pms.timesheet.api.team.get_team_timesheet_weeks`. */
export interface TeamWeeksPayload {
  weeks: TeamWeekSummary[];
  has_more_weeks: boolean;
  /** Date the next page starts from; `null` when there are no more weeks. */
  next_date: string | null;
}

/** One member's week, as `get_team_timesheet_data` and the `timesheet_info` event send it. */
export interface TeamMember {
  employee: string;
  employee_name: string;
  image: string | null;
  working_hour: number;
  working_frequency: WorkingFrequency;
  status: ApprovalStatusValue;
  total_hours: number;
  tasks: TimesheetTasks;
  leaves: TimesheetLeave[];
  holidays: TimesheetHoliday[];
  backdate_restricted_before: string | null;
}

/** Response of `next_pms.timesheet.api.team.get_team_timesheet_data`. */
export interface TeamMembersPayload {
  start_date: string;
  end_date: string;
  dates: string[];
  members: TeamMember[];
  total_count: number;
  has_more: boolean;
}

/** Payload of the `timesheet_info` realtime event. */
export interface TimesheetInfoEvent {
  message?: TeamMember | null;
  employee?: string;
  start_date?: string;
}
