/**
 * External dependencies.
 */
import { getTodayDate } from "@next-pms/design-system/date";

/**
 * Internal dependencies.
 */
import type { ApiPayload } from "./types";

export type ProjectTimesheetState = {
  weekDate: string;
  employeeStart: number;
  pages: ApiPayload[];
};

export type ProjectTimesheetAction =
  | { type: "APPEND_PAGE"; payload: ApiPayload }
  | { type: "SET_WEEK_DATE"; payload: string }
  | { type: "LOAD_MORE_EMPLOYEES"; payload: { pageLength: number } };

export const createInitialProjectTimesheetState =
  (): ProjectTimesheetState => ({
    weekDate: getTodayDate(),
    employeeStart: 0,
    pages: [],
  });

export function projectTimesheetReducer(
  state: ProjectTimesheetState,
  action: ProjectTimesheetAction,
): ProjectTimesheetState {
  switch (action.type) {
    case "APPEND_PAGE":
      return {
        ...state,
        pages: [...state.pages, action.payload],
      };

    case "SET_WEEK_DATE":
      return {
        ...state,
        weekDate: action.payload,
        employeeStart: 0,
      };

    case "LOAD_MORE_EMPLOYEES":
      return {
        ...state,
        employeeStart: state.employeeStart + action.payload.pageLength,
      };

    default:
      return state;
  }
}
