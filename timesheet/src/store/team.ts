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
    projectSearch: string;
    userGroup: Array<string>;
    userGroupSearch: string;
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
    projectSearch: "",
    userGroupSearch: "",
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
    userGroup: [],
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
            state.hasMore = action.payload.has_more;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateData: (state, action: PayloadAction<any>) => {
            const data = state.data.data;
            state.data.data = { ...data, ...action.payload.data };
            // state.data.dates = action.payload.dates;
            state.hasMore = action.payload.has_more;
        },
        setFetchAgain: (state, action: PayloadAction<boolean>) => {
            state.isFetchAgain = action.payload;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTimesheet: (state, action: PayloadAction<any>) => {
            state.timesheet = action.payload.timesheet;
            state.employee = action.payload.id;
            state.isDialogOpen = true;
        },
        setWeekDate: (state, action: PayloadAction<string>) => {
            state.weekDate = action.payload;
            state.data = initialState.data;
            state.start = 0;
            state.isFetchAgain = true;
        },
        setProject: (state, action: PayloadAction<Array<string>>) => {
            state.project = action.payload;
            state.data = initialState.data;
            state.start = 0;
            state.isFetchAgain = true;
        },
        setStart: (state, action: PayloadAction<number>) => {
            state.start = action.payload;
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            state.hasMore = action.payload;
        },
        setDateRange: (state, action: PayloadAction<{ dateRange: DateRange; employee: string; isAprrovalDialogOpen: boolean }>) => {
            state.dateRange = action.payload.dateRange;
            state.employee = action.payload.employee;
            state.isAprrovalDialogOpen = action.payload.isAprrovalDialogOpen;
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            state = initialState;
        },
        setTimesheetData: (state, action: PayloadAction<timesheetDataProps & DynamicKey>) => {
            state.timesheetData = action.payload;
        },
        updateTimesheetData: (state, action: PayloadAction<DynamicKey>) => {
            const data = Object.assign(state.timesheetData.data, action.payload);
            state.timesheetData.data = data;
        },
        setUsergroup: (state, action: PayloadAction<Array<string>>) => {
            state.userGroup = action.payload;
            state.data = initialState.data;
            state.start = 0;
            state.isFetchAgain = true;
        },
        setUserGroupSearch: (state, action: PayloadAction<string>) => {
            state.userGroupSearch = action.payload;
        },
        setProjectSearch: (state, action: PayloadAction<string>) => {
            state.projectSearch = action.payload;
        }

    }
});

export const { setData, setFetchAgain, setTimesheet, setWeekDate, setProject, setStart, setHasMore, updateData, setDateRange, setApprovalDialog, setEmployee, setDialog, resetState, setTimesheetData, updateTimesheetData, setUsergroup, setUserGroupSearch, setProjectSearch } = TeamSlice.actions;
export default TeamSlice.reducer;
