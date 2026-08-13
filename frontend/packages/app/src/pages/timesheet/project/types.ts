/**
 * Internal dependencies.
 */
import type { ApprovalStatusLabelType } from "@next-pms/design-system/components";
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";

export type ProjectFilterArgs = {
  search: string | null;
  filters: string | null;
};

export type ProjectWeekSummary = {
  key: string;
  start_date: string;
  end_date: string;
  label: string;
  dates: string[];
  project_count: number;
  has_more_projects: boolean;
};

export type ProjectWeeksPayload = {
  weeks: ProjectWeekSummary[];
  has_more_weeks: boolean;
  next_date: string | null;
};

export type ProjectWeeksResponse = {
  message?: ProjectWeeksPayload;
};

export type ProjectMemberPayload = {
  label: string;
  employee: string;
  avatar_url: string | null;
  tasks: TaskProps;
  holidays: HolidayProp[];
  leaves: LeaveProps[];
  working_hour: number;
  working_frequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
};

export type ProjectWeekProjectPayload = {
  project: string;
  project_name: string | null;
  members: ProjectMemberPayload[];
};

export type ProjectWeekProjectsPayload = {
  start_date: string;
  end_date: string;
  dates: string[];
  projects: ProjectWeekProjectPayload[];
  total_count: number;
  has_more: boolean;
};

export type ProjectWeekProjectsResponse = {
  message?: ProjectWeekProjectsPayload;
};

export type ProjectMemberWeekPayload = {
  employee: string;
  start_date: string;
  end_date: string;
  dates: string[];
  projects: Record<
    string,
    {
      project: string;
      project_name: string | null;
      member: ProjectMemberPayload;
    }
  >;
};
