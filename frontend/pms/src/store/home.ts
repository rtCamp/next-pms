/**
 * External dependencies.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { getTodayDate } from "@/lib/utils";

export interface HomeState {
  data: dataProps;
  action: "SET" | "UPDATE";
  isDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  employeeName?: string;
  status: Array<string>;
  weekDate: string;
  pageLength: number;
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
  action: "SET",
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

  status: ["Active"],
  data: {
    data: [],
    dates: [],
    total_count: 0,
    has_more: true,
  },
  pageLength: 20,
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

    setTimesheet: (state, action: PayloadAction<any>) => {
      state.timesheet = action.payload;
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      const pageLength = Object.keys(state.data.data).length;
      state.pageLength = pageLength;
      state.action = "SET";
      state.start = 0;
    },
    setFilters: (
      state,
      action: PayloadAction<{ employeeName: string; status: Array<string> }>
    ) => {
      state.employeeName = action.payload.employeeName;
      state.action = "SET";
      state.status = action.payload.status;
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setStatus: (state, action: PayloadAction<Array<string>>) => {
      state.status = action.payload;
      state.action = "SET";
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setEmployeeName: (state, action: PayloadAction<string>) => {
      state.employeeName = action.payload;
      state.action = "SET";
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.action = "UPDATE";
      state.pageLength = initialState.pageLength;
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
  setTimesheet,
  setWeekDate,
  setEmployeeName,
  setStart,
  updateData,
  resetState,
  setStatus,
} = homeSlice.actions;

export default homeSlice.reducer;
