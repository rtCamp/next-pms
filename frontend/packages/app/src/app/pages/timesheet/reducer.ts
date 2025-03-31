/**
 * External dependencies
 */
import { getTodayDate } from "@next-pms/design-system";

/**
 * Internal dependencies
 */
import type { DataProp } from "@/types/timesheet";
import type { TimesheetState } from "./components/types";

export const initialState: TimesheetState = {
  timesheet: {
    name: "",
    task: "",
    date: "",
    description: "",
    hours: 0,
    employee: "",
    project: "",
  },
  dateRange: { start_date: "", end_date: "" },

  data: {
    working_hour: 0,
    working_frequency: "Per Day",
    data: {},
    leaves: [],
    holidays: [],
  },
  isDialogOpen: false,
  isEditDialogOpen: false,
  isAprrovalDialogOpen: false,
  isLeaveDialogOpen: false,
  isImportFromGoogleCalendarDialogOpen: false,
  weekDate: getTodayDate(),
};

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
    const existingLeaveIds = new Set(
      state.data.leaves.map((leave) => leave.name)
    );
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
  SET_IMPORT_FROM_GOOGLE_CALENDAR_DIALOG_STATE: (
    state: TimesheetState,
    payload: boolean
  ): TimesheetState => ({
    ...state,
    isImportFromGoogleCalendarDialogOpen: payload,
  }),
};

export const reducer = (
  state: TimesheetState,
  action: Action
): TimesheetState => {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action.payload as never);
  }
  return state;
};
