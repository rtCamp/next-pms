/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { TimesheetFilters } from "@/types/timesheet";
import type { WeekGroup } from "./context";

export interface TeamTimesheetState {
  searchInput: string;
  compositeFilters: FilterCondition[];
  filters: Omit<TimesheetFilters, "search">;
  weekGroups: WeekGroup[];
  isFilterRequest: boolean;
}

export type TeamTimesheetAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "APPROVAL_STATUS_CHANGED"; payload: ApprovalStatusType | undefined }
  | { type: "REPORTS_TO_CHANGED"; payload: string | null }
  | { type: "COMPOSITE_FILTERS_CHANGED"; payload: FilterCondition[] }
  | { type: "DATA_LOADED"; payload: WeekGroup[] }
  | { type: "REALTIME_UPDATE"; payload: unknown };

export const createInitialTeamTimesheetState = (): TeamTimesheetState => ({
  searchInput: "",
  compositeFilters: [],
  filters: { approvalStatus: undefined, reportsTo: undefined },
  weekGroups: [],
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

    case "DATA_LOADED":
      return { ...state, weekGroups: action.payload, isFilterRequest: false };

    case "REALTIME_UPDATE":
      // Handle real-time updates to the timesheet data here.
      // This is a placeholder and should be implemented based
      // on the structure of the incoming data.
      return state;

    default:
      return state;
  }
}
