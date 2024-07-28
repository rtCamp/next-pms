/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
export interface TimesheetState {
    timesheet: {
        name: string;
        parent: string;
        task: string;
        date: string;
        description: string;
        hours: number;
        isUpdate: boolean;
        employee?: string;
    },
    dateRange: { start_date: string; end_date: string };
    isFetching: boolean;
    isFetchAgain: boolean;
    data: object;
    isDialogOpen: boolean;
    isAprrovalDialogOpen: boolean;
    weekDate: string;
}

export const initialState: TimesheetState = {
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
    dateRange: { start_date: "", end_date: "" },
    isFetching: false,
    isFetchAgain: false,
    data: {},
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    weekDate: getTodayDate()
}


const timesheetSlice = createSlice({
    name: 'timesheet',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<any>) => {
            state.data = action.payload;
        },
        SetFetching: (state, action: PayloadAction<boolean>) => {
            state.isFetching = action.payload;
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
        AppendData: (state, action: PayloadAction<any>) => {
            state.data = Object.assign(state.data, action.payload);
        },
        resetState: (state) => {
            return { ...state, ...initialState }
        }
    },

});


export const { setData, SetFetching, SetFetchAgain, setDateRange, SetTimesheet, SetWeekDate, SetAddTimeDialog, setApprovalDialog, AppendData, resetState } = timesheetSlice.actions;
export default timesheetSlice.reducer;
