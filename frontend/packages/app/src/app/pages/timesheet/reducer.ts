/**
 * Internal dependencies
 */
import { initialState, TimesheetState } from "@/store/timesheet";
import { DataProp } from "@/types/timesheet";

export type Action =
  | { type: "SET_DATA"; payload: DataProp }
  | { type: "SET_DATE_RANGE"; payload: { start_date: string; end_date: string } }
  | { type: "SET_TIMESHEET"; payload: TimesheetState["timesheet"] }
  | { type: "SET_WEEK_DATE"; payload: string }
  | { type: "SET_DIALOG_STATE"; payload: boolean }
  | { type: "SET_APPROVAL_DIALOG_STATE"; payload: boolean }
  | { type: "SET_LEAVE_DIALOG_STATE"; payload: boolean }
  | { type: "SET_EDIT_DIALOG_STATE"; payload: boolean }
  | { type: "APPEND_DATA"; payload: DataProp }
  | { type: "RESET_STATE" }
  | { type: "SET_WEEK_DATE"; payload: string };

const actionHandlers = {
  SET_DATA: (state: TimesheetState, payload: DataProp): TimesheetState => ({
    ...state,
    data: payload,
  }),
  SET_DATE_RANGE: (
    state: TimesheetState,
    payload: { start_date: string; end_date: string }
  ): TimesheetState => ({
    ...state,
    dateRange: payload,
  }),
  SET_TIMESHEET: (
    state: TimesheetState,
    payload: TimesheetState["timesheet"]
  ): TimesheetState => ({
    ...state,
    timesheet: payload,
  }),
  SET_WEEK_DATE: (state: TimesheetState, payload: string): TimesheetState => ({
    ...state,
    weekDate: payload,
  }),
  SET_DIALOG_STATE: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isDialogOpen: payload,
  }),
  SET_APPROVAL_DIALOG_STATE: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isAprrovalDialogOpen: payload,
  }),
  SET_LEAVE_DIALOG_STATE: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isLeaveDialogOpen: payload,
  }),
  SET_EDIT_DIALOG_STATE: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isEditDialogOpen: payload,
    timesheet: payload ? state.timesheet : initialState.timesheet,
  }),
  APPEND_DATA: (state: TimesheetState, payload: DataProp): TimesheetState => {
    const newData = { ...state.data.data, ...payload.data };
    const existingLeaveIds = new Set(state.data.leaves.map((leave) => leave.name));
    const newLeaves = payload.leaves.filter(
      (leave) => !existingLeaveIds.has(leave.name)
    );

    return {
      ...state,
      data: {
        ...state.data,
        data: newData,
        holidays: [...state.data.holidays, ...payload.holidays],
        leaves: [...state.data.leaves, ...newLeaves],
      },
    };
  },
  RESET_STATE: (): TimesheetState => initialState,
};

export const reducer = (state: TimesheetState, action: Action): TimesheetState => {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action.payload as never);
  }
  return state;
};