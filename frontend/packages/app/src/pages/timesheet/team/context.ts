/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TimesheetFilters } from "@/types/timesheet";
import type {
  TeamFilterArgs,
  TeamMemberPayload,
  TeamWeekSummary,
} from "./types";

export type MemberRefreshHandler = (member: TeamMemberPayload) => void;

export interface TeamTimesheetContextProps {
  state: {
    weeks: TeamWeekSummary[];
    hasMoreWeeks: boolean;
    isLoadingWeeks: boolean;
    isNextPageLoading: boolean;
    isFilterRequest: boolean;
    activeFilterKey: string;
    resolvedFilterKey: string;
    filterArgs: TeamFilterArgs;
    filters: TimesheetFilters;
    compositeFilters: FilterCondition[];
  };
  actions: {
    loadMoreWeeks: () => void;
    registerMemberRefresh: (
      startDate: string,
      handler: MemberRefreshHandler,
    ) => () => void;
    handleSearchChange: (value: string) => void;
    handleApprovalStatusChange: (value?: ApprovalStatusType | null) => void;
    handleReportsToChange: (value: string | null) => void;
    handleCompositeFilterChange: (value: FilterCondition[]) => void;
    handleClearAllFilters: () => void;
  };
}

export const TeamTimesheetContext = createContext<TeamTimesheetContextProps>({
  state: {
    weeks: [],
    hasMoreWeeks: false,
    isLoadingWeeks: false,
    isNextPageLoading: false,
    isFilterRequest: false,
    activeFilterKey: "",
    resolvedFilterKey: "",
    filterArgs: {
      reports_to: null,
      search: null,
      status_filter: null,
      filters: null,
    },
    filters: {
      search: "",
      approvalStatus: undefined,
      reportsTo: undefined,
    },
    compositeFilters: [],
  },
  actions: {
    loadMoreWeeks: () => null,
    registerMemberRefresh: () => () => null,
    handleSearchChange: () => null,
    handleApprovalStatusChange: () => null,
    handleReportsToChange: () => null,
    handleCompositeFilterChange: () => null,
    handleClearAllFilters: () => null,
  },
});

export const useTeamTimesheet = <T>(
  selector: (state: TeamTimesheetContextProps) => T,
) => {
  return useContextSelector(TeamTimesheetContext, selector);
};
