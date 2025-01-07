/**
 * External dependencies.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { getTodayDate } from "@/lib/utils";
import { DataProp } from "@/types/timesheet";

export interface TimesheetState {
  timesheet: {
    name: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    employee: string;
    project?: string;
  };
  dateRange: { start_date: string; end_date: string };

  data: DataProp;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  isLeaveDialogOpen: boolean;
  weekDate: string;
}

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
  weekDate: getTodayDate(),
};

const timesheetSlice = createSlice({
  name: "timesheet",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<DataProp>) => {
      state.data = action.payload;
    },

    setDateRange: (state, action: PayloadAction<any>) => {
      state.dateRange = action.payload;
    },
    SetTimesheet: (state, action: PayloadAction<any>) => {
      state.timesheet = action.payload;
    },
    SetWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
    },
    SetAddTimeDialog: (state, action: PayloadAction<boolean>) => {
      state.isDialogOpen = action.payload;
    },
    setApprovalDialog: (state, action: PayloadAction<boolean>) => {
      state.isAprrovalDialogOpen = action.payload;
    },
    SetAddLeaveDialog: (state, action: PayloadAction<boolean>) => {
      state.isLeaveDialogOpen = action.payload;
    },
    AppendData: (state, action: PayloadAction<DataProp>) => {
      const data = Object.assign(state.data.data, action.payload.data);

      state.data.data = data;
      state.data.holidays = [
        ...state.data.holidays,
        ...action.payload.holidays,
      ];
      const existingLeaveIds = new Set(
        state.data.leaves.map((leave) => leave.name),
      );
      const newLeaves = action.payload.leaves.filter(
        (leave) => !existingLeaveIds.has(leave.name),
      );

      state.data.leaves = [...state.data.leaves, ...newLeaves];
    },
    resetState: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state = initialState;
    },
    setEditDialog: (state, action: PayloadAction<boolean>) => {
      state.isEditDialogOpen = action.payload;
      if (!action.payload) {
        state.timesheet = initialState.timesheet;

      }
    },
  },
});

export const {
  setData,
  setDateRange,
  SetTimesheet,
  SetWeekDate,
  SetAddTimeDialog,
  setApprovalDialog,
  AppendData,
  resetState,
  setEditDialog,
  SetAddLeaveDialog,
} = timesheetSlice.actions;

export default timesheetSlice.reducer;
