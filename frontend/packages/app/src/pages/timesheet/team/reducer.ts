/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { TimesheetFilters } from "@/types/timesheet";

export interface TeamTimesheetState {
  searchInput: string;
  compositeFilters: FilterCondition[];
  filters: Omit<TimesheetFilters, "search">;
  isFilterRequest: boolean;
}

export type TeamTimesheetAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "APPROVAL_STATUS_CHANGED"; payload: ApprovalStatusType | undefined }
  | { type: "REPORTS_TO_CHANGED"; payload: string | null }
  | { type: "COMPOSITE_FILTERS_CHANGED"; payload: FilterCondition[] }
  | { type: "FILTER_REQUEST_COMPLETE" };

export const createInitialTeamTimesheetState = (): TeamTimesheetState => ({
  searchInput: "",
  compositeFilters: [],
  filters: { approvalStatus: undefined, reportsTo: undefined },
  isFilterRequest: false,
});

export function teamTimesheetReducer(
  state: TeamTimesheetState,
  action: TeamTimesheetAction,
): TeamTimesheetState {
  switch (action.type) {
    case "SEARCH_CHANGED":
      return { ...state, searchInput: action.payload, isFilterRequest: true };

    case "APPROVAL_STATUS_CHANGED":
      return {
        ...state,
        filters: { ...state.filters, approvalStatus: action.payload },
        isFilterRequest: true,
      };

    case "REPORTS_TO_CHANGED":
      return {
        ...state,
        filters: { ...state.filters, reportsTo: action.payload ?? undefined },
        isFilterRequest: true,
      };

    case "COMPOSITE_FILTERS_CHANGED":
      return {
        ...state,
        compositeFilters: action.payload,
        isFilterRequest: true,
      };

    case "FILTER_REQUEST_COMPLETE":
      return { ...state, isFilterRequest: false };

    default:
      return state;
  }
}
