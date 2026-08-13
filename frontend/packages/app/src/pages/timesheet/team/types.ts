/**
 * Internal dependencies.
 */
import type { ApprovalStatusLabelType } from "@next-pms/design-system/components";
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";

export type TeamFilterArgs = {
  reports_to: string | null;
  search: string | null;
  status_filter: string | null;
  filters: string | null;
};

export type TeamWeekSummary = {
  key: string;
  start_date: string;
  end_date: string;
  label: string;
  dates: string[];
  member_count: number;
  approval_pending_count: number;
  has_more_members: boolean;
};

export type TeamWeeksPayload = {
  weeks: TeamWeekSummary[];
  has_more_weeks: boolean;
  next_date: string | null;
};

export type TeamWeeksResponse = {
  message?: TeamWeeksPayload;
};

export type TeamMemberPayload = {
  employee: string;
  employee_name: string;
  image: string | null;
  working_hour: number;
  working_frequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
  total_hours: number;
  tasks: TaskProps;
  leaves: LeaveProps[];
  holidays: HolidayProp[];
  backdate_restricted_before: string | null;
};

export type TeamMembersPayload = {
  start_date: string;
  end_date: string;
  dates: string[];
  members: TeamMemberPayload[];
  total_count: number;
  has_more: boolean;
};

export type TeamMembersResponse = {
  message?: TeamMembersPayload;
};
