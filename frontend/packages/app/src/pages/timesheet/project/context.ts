/**
 * External dependencies.
 */
import type { ApprovalStatusLabelType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
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
    hasMore: boolean;
    isLoadingProjectData: boolean;
    isFilterRequest: boolean;
    weekGroups: WeekGroup[];
    searchInput: string;
    compositeFilters: FilterCondition[];
  };
  actions: {
    loadData: () => void;
    handleSearchChange: (value: string) => void;
    handleCompositeFilterChange: (value: FilterCondition[]) => void;
  };
}

export const ProjectTimesheetContext =
  createContext<ProjectTimesheetContextProps>({
    state: {
      hasMore: false,
      isLoadingProjectData: false,
      isFilterRequest: false,
      weekGroups: [],
      searchInput: "",
      compositeFilters: [],
    },
    actions: {
      loadData: () => null,
      handleSearchChange: () => null,
      handleCompositeFilterChange: () => null,
    },
  });

export const useProjectTimesheet = <T>(
  selector: (state: ProjectTimesheetContextProps) => T,
) => {
  return useContextSelector(ProjectTimesheetContext, selector);
};
