/**
 * Internal dependencies
 */
import { initialState, TimesheetState } from "@/store/timesheet";
import { DataProp } from "@/types/timesheet";

export type Action =
  | { type: "setData"; payload: DataProp }
  | { type: "setDateRange"; payload: { start_date: string; end_date: string } }
  | { type: "setTimesheet"; payload: TimesheetState["timesheet"] }
  | { type: "setWeekDate"; payload: string }
  | { type: "setDialogState"; payload: boolean }
  | { type: "setApprovalDialogState"; payload: boolean }
  | { type: "setLeaveDialogState"; payload: boolean }
  | { type: "setEditDialogState"; payload: boolean }
  | { type: "appendData"; payload: DataProp }
  | { type: "resetState" }
  | { type: "setWeekDate"; payload: string };

const actionHandlers = {
  setData: (state: TimesheetState, payload: DataProp): TimesheetState => ({
    ...state,
    data: payload,
  }),
  setDateRange: (
    state: TimesheetState,
    payload: { start_date: string; end_date: string }
  ): TimesheetState => ({
    ...state,
    dateRange: payload,
  }),
  setTimesheet: (
    state: TimesheetState,
    payload: TimesheetState["timesheet"]
  ): TimesheetState => ({
    ...state,
    timesheet: payload,
  }),
  setWeekDate: (state: TimesheetState, payload: string): TimesheetState => ({
    ...state,
    weekDate: payload,
  }),
  setDialogState: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isDialogOpen: payload,
  }),
  setApprovalDialogState: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isAprrovalDialogOpen: payload,
  }),
  setLeaveDialogState: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isLeaveDialogOpen: payload,
  }),
  setEditDialogState: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isEditDialogOpen: payload,
    timesheet: payload ? state.timesheet : initialState.timesheet,
  }),
  appendData: (state: TimesheetState, payload: DataProp): TimesheetState => {
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
  resetState: (): TimesheetState => initialState,
};

export const reducer = (state: TimesheetState, action: Action): TimesheetState => {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action.payload as never);
  }
  return state;
};