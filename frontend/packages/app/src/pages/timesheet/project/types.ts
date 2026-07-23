/**
 * Internal dependencies.
 */
import type { TaskProps } from "@/types/timesheet";
import type { ProjectMemberData } from "./context";

export type ApiProjectMember = {
  label: string;
  employee: string;
  avatar_url?: string;
  tasks: TaskProps;
  holidays: ProjectMemberData["holidays"];
  leaves: ProjectMemberData["leaves"];
  working_hour: number;
  working_frequency: ProjectMemberData["workingFrequency"];
  status: ProjectMemberData["status"];
};

export type ApiWeekProject = {
  project: string;
  project_name: string | null;
  members: ApiProjectMember[];
};

export type ApiPayload = {
  week_groups?: Array<{
    key: string;
    start_date: string;
    end_date: string;
    dates: string[];
    projects: ApiWeekProject[];
  }>;
  has_more?: boolean;
};

export type ProjectTimesheetApiResponse = {
  message?: ApiPayload;
};
