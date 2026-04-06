/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { WorkingFrequency } from "@/types";
import type { DataProp, TaskProps, timesheet } from "@/types/timesheet";

export type EmployeeRecord = {
  name: string;
  image: string;
  employee_name: string;
};

export type ProjectMemberData = {
  employee: EmployeeRecord;
  week: timesheet;
  projectTasks: TaskProps;
  holidays: DataProp["holidays"];
  leaves: DataProp["leaves"];
  working_hour: number;
  working_frequency: WorkingFrequency;
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
