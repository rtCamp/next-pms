/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
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
  isFetchAgain: boolean;
  data: DataProp;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
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
  isFetchAgain: false,
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
  weekDate: getTodayDate(),
};

const timesheetSlice = createSlice({
  name: "timesheet",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<DataProp>) => {
      state.data = action.payload;
    },
    SetFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.isFetchAgain = action.payload;
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
    AppendData: (state, action: PayloadAction<DataProp>) => {
      const data = Object.assign(state.data.data, action.payload.data);
      state.data.data = data;
      state.data.holidays = [
        ...state.data.holidays,
        ...action.payload.holidays,
      ];
      state.data.leaves = [...state.data.leaves, ...action.payload.leaves];
    },
    resetState: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state = initialState;
    },
    setEditDialog: (state, action: PayloadAction<boolean>) => {
      state.isEditDialogOpen = action.payload;
      if (!action.payload) {
        state.timesheet = initialState.timesheet;
        state.isFetchAgain = true;
      }
    },
  },
});

export const {
  setData,
  SetFetchAgain,
  setDateRange,
  SetTimesheet,
  SetWeekDate,
  SetAddTimeDialog,
  setApprovalDialog,
  AppendData,
  resetState,
  setEditDialog,
} = timesheetSlice.actions;
export default timesheetSlice.reducer;
