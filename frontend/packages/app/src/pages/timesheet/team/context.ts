/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TeamMember } from "@/components/timesheet-row/teamTimesheetRow";
import type { TimesheetFilters } from "@/types/timesheet";

export type EmployeeRecord = {
  name: string;
  image: string | null;
  employee_name: string;
};

export type WeekGroup = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
  members: TeamMember[];
  approvalPendingCount: number;
};

export interface TeamTimesheetContextProps {
  state: {
    hasMore: boolean;
    isLoadingTeamData: boolean;
    isFilterRequest: boolean;
    weekGroups: WeekGroup[];
    filters: TimesheetFilters;
    searchInput: string;
    compositeFilters: FilterCondition[];
  };
  actions: {
    loadMore: () => void;
    handleSearchChange: (value: string) => void;
    handleApprovalStatusChange: (value?: ApprovalStatusType | null) => void;
    handleReportsToChange: (value: string | null) => void;
    handleCompositeFilterChange: (value: FilterCondition[]) => void;
  };
}

export const TeamTimesheetContext = createContext<TeamTimesheetContextProps>({
  state: {
    hasMore: false,
    isLoadingTeamData: false,
    isFilterRequest: false,
    weekGroups: [],
    filters: {
      search: "",
      approvalStatus: undefined,
      reportsTo: undefined,
    },
    searchInput: "",
    compositeFilters: [],
  },
  actions: {
    loadMore: () => null,
    handleSearchChange: () => null,
    handleApprovalStatusChange: () => null,
    handleReportsToChange: () => null,
    handleCompositeFilterChange: () => null,
  },
});

export const useTeamTimesheet = <T>(
  selector: (state: TeamTimesheetContextProps) => T,
) => {
  return useContextSelector(TeamTimesheetContext, selector);
};
