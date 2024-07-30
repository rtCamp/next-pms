import { getTodayDate, getFormatedDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { addDays } from "date-fns";
import { DataProp as timesheetDataProps, DynamicKey } from "@/types/timesheet";

type DateRange = {
    start_date: string;
    end_date: string;
}
export interface TeamState {
    isFetchAgain: boolean;
    data: dataProps;
    isDialogOpen: boolean;
    isAprrovalDialogOpen: boolean;
    weekDate: string;
    project: Array<string>;
    timesheet: {
        name: string;
        parent: string;
        task: string;
        date: string;
        description: string;
        hours: number;
        isUpdate: boolean;
    },
    timesheetData: timesheetDataProps & DynamicKey;
    start: number;
    dateRange: DateRange,
    employee: string;
    hasMore: boolean;
}


export interface dataProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    dates: DateProps[]
    total_count: number;
    has_more: boolean;
}

export type DateProps = {
    start_date: string;
    end_date: string;
    key: string
    dates: string[]
}
export const initialState: TeamState = {
    timesheet: {
        name: "",
        parent: "",
        task: "",
        date: "",
        description: "",
        hours: 0,
        isUpdate: false,
    },
    employee: "",
    isFetchAgain: false,
    data: {
        data: {},
        dates: [],
        total_count: 0,
        has_more: false
    },
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    weekDate: getFormatedDate(addDays(getTodayDate(), -7)),
    project: [],
    start: 0,
    hasMore: true,
    dateRange: {
        start_date: "",
        end_date: ""
    },
    // @ts-ignore
    timesheetData: {
        working_hour: 0,
        working_frequency: "",
    }
}

const TeamSlice = createSlice({
    name: 'team',
    initialState,
    reducers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData: (state, action: PayloadAction<any>) => {
            state.data = action.payload;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateData: (state, action: PayloadAction<any>) => {
            // Object.assign(action.payload.data, state.data.data);
            const data = state.data.data;
            return { ...state, data: { ...state.data, data: { ...data, ...action.payload.data } } }
        },
        resetData: (state) => {
            return { ...state, data: { data: {}, dates: [], total_count: 0, has_more: true } }
        },
        setFetchAgain: (state, action: PayloadAction<boolean>) => {
            state.isFetchAgain = action.payload;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTimesheet: (state, action: PayloadAction<any>) => {
            state.timesheet = action.payload;
        },
        setWeekDate: (state, action: PayloadAction<string>) => {
            state.weekDate = action.payload;
        },
        setProject: (state, action: PayloadAction<Array<string>>) => {
            state.project = action.payload;
        },
        setStart: (state, action: PayloadAction<number>) => {
            return { ...state, start: action.payload }
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            return { ...state, hasMore: action.payload }
        },
        setDateRange: (state, action: PayloadAction<DateRange>) => {
            state.dateRange = action.payload;
        },
        setApprovalDialog: (state, action: PayloadAction<boolean>) => {
            state.isAprrovalDialogOpen = action.payload;
        },
        setEmployee: (state, action: PayloadAction<string>) => {
            state.employee = action.payload;
        },
        setDialog: (state, action: PayloadAction<boolean>) => {
            state.isDialogOpen = action.payload;
        },
        resetState: (state) => {
            return { ...state, ...initialState }
        },
        setTimesheetData: (state, action: PayloadAction<timesheetDataProps & DynamicKey>) => {
            state.timesheetData = action.payload;
        },
        updateTimesheetData: (state, action: PayloadAction<DynamicKey>) => {

            const data = Object.assign(state.timesheetData.data, action.payload);
            state.timesheetData.data = data;
        },
    }
});

export const { setData, setFetchAgain, setTimesheet, setWeekDate, setProject, setStart, setHasMore, updateData, resetData, setDateRange, setApprovalDialog, setEmployee, setDialog, resetState, setTimesheetData, updateTimesheetData } = TeamSlice.actions;
export default TeamSlice.reducer;
