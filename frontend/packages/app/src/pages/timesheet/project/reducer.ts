/**
 * External dependencies.
 */
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

export type ProjectTimesheetState = {
  searchInput: string;
  compositeFilters: FilterCondition[];
  isFilterRequest: boolean;
};

export type ProjectTimesheetAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "COMPOSITE_FILTERS_CHANGED"; payload: FilterCondition[] }
  | { type: "FILTER_REQUEST_COMPLETE" };

export const createInitialProjectTimesheetState =
  (): ProjectTimesheetState => ({
    searchInput: "",
    compositeFilters: [],
    isFilterRequest: false,
  });

export function projectTimesheetReducer(
  state: ProjectTimesheetState,
  action: ProjectTimesheetAction,
): ProjectTimesheetState {
  switch (action.type) {
    case "SEARCH_CHANGED":
      return { ...state, searchInput: action.payload, isFilterRequest: true };

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
