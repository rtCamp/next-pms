/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface HomeState {
    isFetchAgain: boolean;
    data: dataProps;
    isDialogOpen: boolean;
    isAprrovalDialogOpen: boolean;
    employeeName?: string;
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
    },
    start: number;
    hasMore: boolean;
}

export interface dataProps {
    data: any;
    dates: DateProps[]
}

export type DateProps = {
    start_date: string;
    end_date: string;
    key: string
    dates: string[]
}
export const initialState:HomeState = {
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
    data: {
        data: [],
        dates: []
    },
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    employeeName: "",
    weekDate: getTodayDate(),
    start: 0,
    hasMore: true,
}

const homeSlice = createSlice({
    name: 'home',
    initialState,
    reducers: {
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
        },
        setEmployeeName: (state, action: PayloadAction<string>) => {
            state.employeeName = action.payload;
        },
        setStart: (state, action: PayloadAction<number>) => {
            return { ...state, start: action.payload }
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            return { ...state, hasMore: action.payload }
        },
        updateData: (state, action: PayloadAction<any>) => {
            // Object.assign(action.payload.data, state.data.data);
            const data = state.data.data;
            return { ...state, data: { ...state.data, data: { ...data, ...action.payload.data } } }
        },
    }
});

export const { setData, setFetchAgain, setTimesheet, setWeekDate, setEmployeeName,setStart,setHasMore,updateData } = homeSlice.actions;
export default homeSlice.reducer;
