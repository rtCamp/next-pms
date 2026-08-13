/**
 * External dependencies.
 */
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  ProjectFilterArgs,
  ProjectMemberWeekPayload,
  ProjectWeekSummary,
} from "./types";

export type ProjectRefreshHandler = (payload: ProjectMemberWeekPayload) => void;

export interface ProjectTimesheetContextProps {
  state: {
    weeks: ProjectWeekSummary[];
    hasMoreWeeks: boolean;
    isLoadingWeeks: boolean;
    isNextPageLoading: boolean;
    isFilterRequest: boolean;
    activeFilterKey: string;
    resolvedFilterKey: string;
    filterArgs: ProjectFilterArgs;
    filters: {
      search: string;
    };
    compositeFilters: FilterCondition[];
  };
  actions: {
    loadMoreWeeks: () => void;
    registerProjectRefresh: (
      startDate: string,
      handler: ProjectRefreshHandler,
    ) => () => void;
    handleSearchChange: (value: string) => void;
    handleCompositeFilterChange: (value: FilterCondition[]) => void;
    handleClearAllFilters: () => void;
  };
}

export const ProjectTimesheetContext =
  createContext<ProjectTimesheetContextProps>({
    state: {
      weeks: [],
      hasMoreWeeks: false,
      isLoadingWeeks: false,
      isNextPageLoading: false,
      isFilterRequest: false,
      activeFilterKey: "",
      resolvedFilterKey: "",
      filterArgs: {
        search: null,
        filters: null,
      },
      filters: {
        search: "",
      },
      compositeFilters: [],
    },
    actions: {
      loadMoreWeeks: () => null,
      registerProjectRefresh: () => () => null,
      handleSearchChange: () => null,
      handleCompositeFilterChange: () => null,
      handleClearAllFilters: () => null,
    },
  });

export const useProjectTimesheet = <T>(
  selector: (state: ProjectTimesheetContextProps) => T,
) => {
  return useContextSelector(ProjectTimesheetContext, selector);
};
