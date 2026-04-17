/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import { getTodayDate } from "@next-pms/design-system/date";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { DataProp, TimesheetFilters } from "@/types/timesheet";
import { initialTimesheetData } from "./context";
import { mergeTimesheetData } from "./utils";

export interface TimesheetState {
  weekDate: string;
  timesheetData: DataProp;
  hasMoreWeeks: boolean;
  compositeFilters: FilterCondition[];
  filters: TimesheetFilters;
  isFilterRequest: boolean;
  isInitialLoad: boolean;
}

export type TimesheetAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "APPROVAL_STATUS_CHANGED"; payload: ApprovalStatusType | undefined }
  | { type: "COMPOSITE_FILTERS_CHANGED"; payload: FilterCondition[] }
  | {
      type: "DATA_LOADED";
      payload: { message: DataProp & { has_more?: boolean } };
    }
  | { type: "SET_WEEK_DATE"; payload: string }
  | { type: "REALTIME_UPDATE"; payload: DataProp };

export const computeHasActiveFilters = (
  filters: TimesheetFilters,
  compositeFilters: FilterCondition[],
): boolean =>
  filters.search.trim().length > 0 ||
  Boolean(filters.approvalStatus) ||
  compositeFilters.length > 0;

export const createInitialTimesheetState = (): TimesheetState => ({
  weekDate: getTodayDate(),
  timesheetData: initialTimesheetData,
  hasMoreWeeks: true,
  compositeFilters: [],
  filters: { search: "", approvalStatus: undefined },
  isFilterRequest: false,
  isInitialLoad: true,
});

export function timesheetReducer(
  state: TimesheetState,
  action: TimesheetAction,
): TimesheetState {
  switch (action.type) {
    case "SEARCH_CHANGED":
      if (state.filters.search === action.payload) {
        return state;
      }

      return {
        ...state,
        filters: { ...state.filters, search: action.payload },
        isFilterRequest: true,
        hasMoreWeeks: true,
        weekDate: getTodayDate(),
      };

    case "APPROVAL_STATUS_CHANGED":
      return {
        ...state,
        filters: { ...state.filters, approvalStatus: action.payload },
        isFilterRequest: true,
        hasMoreWeeks: true,
        weekDate: getTodayDate(),
      };

    case "COMPOSITE_FILTERS_CHANGED":
      return {
        ...state,
        compositeFilters: action.payload,
        isFilterRequest: true,
        hasMoreWeeks: true,
        weekDate: getTodayDate(),
      };

    case "DATA_LOADED": {
      const { message } = action.payload;
      const hasActiveFilters = computeHasActiveFilters(
        state.filters,
        state.compositeFilters,
      );

      let timesheetData: DataProp;
      // If it's a filter request replace the data.
      if (state.isFilterRequest) {
        timesheetData = message;
      } else if (Object.keys(state.timesheetData.data).length > 0) {
        // Merge for pagination or real-time updates.
        timesheetData = mergeTimesheetData(state.timesheetData, message);
      } else {
        // Initial load with no existing data.
        timesheetData = message;
      }

      return {
        ...state,
        timesheetData,
        hasMoreWeeks: hasActiveFilters ? (message.has_more ?? false) : true,
        isFilterRequest: false,
        isInitialLoad: false,
      };
    }

    case "SET_WEEK_DATE":
      return { ...state, weekDate: action.payload };

    case "REALTIME_UPDATE":
      return {
        ...state,
        timesheetData: mergeTimesheetData(state.timesheetData, action.payload),
      };

    default:
      return state;
  }
}
