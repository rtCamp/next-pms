/**
 * External dependencies.
 */
import type { ApprovalStatusLabelType } from "@next-pms/design-system/components";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";

export type EmployeeRecord = {
  name: string;
  image: string;
  employeeName: string;
};

export type ProjectMemberData = {
  label: string;
  employee: string;
  avatarUrl?: string;
  tasks: TaskProps;
  holidays: HolidayProp[];
  leaves: LeaveProps[];
  workingHour: number;
  workingFrequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
};

export type WeekProjectGroup = {
  project: string;
  projectName: string | null;
  members: ProjectMemberData[];
};

export type WeekGroup = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
  projects: WeekProjectGroup[];
};

export interface ProjectTimesheetContextProps {
  state: {
    hasMoreWeeks: boolean;
    isLoadingProjectData: boolean;
    weekGroups: WeekGroup[];
  };
  actions: {
    loadData: () => void;
  };
}

export const ProjectTimesheetContext =
  createContext<ProjectTimesheetContextProps>({
    state: {
      hasMoreWeeks: false,
      isLoadingProjectData: false,
      weekGroups: [],
    },
    actions: {
      loadData: () => null,
    },
  });

export const useProjectTimesheet = <T>(
  selector: (state: ProjectTimesheetContextProps) => T,
) => {
  return useContextSelector(ProjectTimesheetContext, selector);
};
