import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

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
        employee?: string;
    },
    start: number;
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
        employee: "",
    },
    isFetchAgain: false,
    data: {
        data: {},
        dates: [],
        total_count: 0,
        has_more: false
    },
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    weekDate: getTodayDate(),
    project: [],
    start: 0,
    hasMore: true
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
        }
    }
});

export const { setData, setFetchAgain, setTimesheet, setWeekDate, setProject, setStart, setHasMore, updateData,resetData } = TeamSlice.actions;
export default TeamSlice.reducer;
