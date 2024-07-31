/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DataProp,DynamicKey } from "@/types/timesheet";
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
    data: DataProp;
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
    // @ts-ignore
    data: {
        working_hour: 0,
        working_frequency: "Per Day",
    },
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    weekDate: getTodayDate()
}


const timesheetSlice = createSlice({
    name: 'timesheet',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<DataProp>) => {
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
        AppendData: (state, action: PayloadAction<DynamicKey>) => {
            const data = Object.assign(state.data.data, action.payload);
            state.data.data = data;
        },
        resetState: (state) => {
            return { ...state, ...initialState }
        }
    },

});


export const { setData, SetFetching, SetFetchAgain, setDateRange, SetTimesheet, SetWeekDate, SetAddTimeDialog, setApprovalDialog, AppendData, resetState } = timesheetSlice.actions;
export default timesheetSlice.reducer;
