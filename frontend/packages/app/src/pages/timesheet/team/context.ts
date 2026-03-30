/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { WorkingFrequency } from "@/types";
import type { DataProp, timesheet } from "@/types/timesheet";

export type EmployeeRecord = {
  name: string;
  image: string;
  employee_name: string;
};

export type WeekEmployeeData = {
  employee: EmployeeRecord;
  week: timesheet;
  holidays: DataProp["holidays"];
  leaves: DataProp["leaves"];
  working_hour: number;
  working_frequency: WorkingFrequency;
};

export type WeekGroup = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
  members: WeekEmployeeData[];
};

export interface TeamTimesheetContextProps {
  state: {
    search: string;
    hasMoreWeeks: boolean;
    isLoadingTeamData: boolean;
    weekGroups: WeekGroup[];
    isWeeklyApprovalOpen: boolean;
    employee: string;
    startDate: string;
  };
  actions: {
    setSearch: (value: string) => void;
    loadData: () => void;
    openWeeklyApproval: (employeeId: string, date: string) => void;
    setIsWeeklyApprovalOpen: (state: boolean) => void;
  };
}

export const TeamTimesheetContext = createContext<TeamTimesheetContextProps>({
  state: {
    search: "",
    hasMoreWeeks: false,
    isLoadingTeamData: false,
    weekGroups: [],
    isWeeklyApprovalOpen: false,
    employee: "",
    startDate: "",
  },
  actions: {
    setSearch: () => null,
    loadData: () => null,
    openWeeklyApproval: () => null,
    setIsWeeklyApprovalOpen: () => null,
  },
});

export const useTeamTimesheet = <T>(
  selector: (state: TeamTimesheetContextProps) => T,
) => {
  return useContextSelector(TeamTimesheetContext, selector);
};
