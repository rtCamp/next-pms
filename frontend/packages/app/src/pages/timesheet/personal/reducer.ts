/**
 * External dependencies.
 */
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
  isFilterRequest: boolean;
  isInitialLoad: boolean;
}

export type TimesheetAction =
  | { type: "FILTER_REFRESH_STARTED" }
  | { type: "FILTER_REFRESH_FINISHED" }
  | {
      type: "DATA_LOADED";
      payload: {
        message: DataProp & { has_more?: boolean };
        hasActiveFilters: boolean;
        replaceData: boolean;
      };
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
  isFilterRequest: false,
  isInitialLoad: true,
});

export function timesheetReducer(
  state: TimesheetState,
  action: TimesheetAction,
): TimesheetState {
  switch (action.type) {
    case "FILTER_REFRESH_STARTED":
      return {
        ...state,
        isFilterRequest: true,
        hasMoreWeeks: true,
        weekDate: getTodayDate(),
      };

    case "FILTER_REFRESH_FINISHED":
      return {
        ...state,
        isFilterRequest: false,
      };

    case "DATA_LOADED": {
      const { message, hasActiveFilters, replaceData } = action.payload;

      let timesheetData: DataProp;
      if (replaceData) {
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
