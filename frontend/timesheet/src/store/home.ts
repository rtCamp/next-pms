/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface HomeState {
  isFetchAgain: boolean;
  data: dataProps;
  isDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  employeeName?: string;
  status: Array<string>;
  weekDate: string;
  timesheet: {
    name: string;
    parent: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    isUpdate: boolean;
    employee?: string;
  };
  start: number;
}

export interface dataProps {
  data: any;
  dates: DateProps[];
  total_count: number;
  has_more: boolean;
}

export type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};
export const initialState: HomeState = {
  timesheet: {
    name: "",
    parent: "",
    task: "",
    date: "",
    description: "",
    hours: 0,
    isUpdate: false,
    employee: "",
  },
  isFetchAgain: false,
  status: ["Active"],
  data: {
    data: [],
    dates: [],
    total_count: 0,
    has_more: true,
  },
  isDialogOpen: false,
  isAprrovalDialogOpen: false,
  employeeName: "",
  weekDate: getTodayDate(),
  start: 0,
};

const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    resetState() {
      return initialState;
    },
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
    },
    setFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.isFetchAgain = action.payload;
    },
    setTimesheet: (state, action: PayloadAction<any>) => {
      state.timesheet = action.payload;
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setFilters: (
      state,
      action: PayloadAction<{ employeeName: string; status: Array<string> }>,
    ) => {
      state.employeeName = action.payload.employeeName;
      state.data = initialState.data;
      state.status = action.payload.status;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setStatus: (state, action: PayloadAction<Array<string>>) => {
      state.status = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setEmployeeName: (state, action: PayloadAction<string>) => {
      state.employeeName = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
    },
    updateData: (state, action: PayloadAction<any>) => {
      const data = state.data.data;
      state.data.data = { ...data, ...action.payload.data };
      state.data.dates = action.payload.dates;
      state.data.total_count = action.payload.total_count;
    },
  },
});

export const {
  setData,
  setFilters,
  setFetchAgain,
  setTimesheet,
  setWeekDate,
  setEmployeeName,
  setStart,
  updateData,
  resetState,
  setStatus,
} = homeSlice.actions;
export default homeSlice.reducer;
