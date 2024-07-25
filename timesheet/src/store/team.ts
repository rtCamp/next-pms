import { getTodayDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface TeamState {
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

}


export interface dataProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    dates: DateProps
}

export type DateProps = {
    start_date: string;
    end_date: string;
    key: string
    dates: string[]
}
export const initialState = {
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
}

const TeamSlice = createSlice({
    name: 'team',
    initialState,
    reducers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData: (state, action: PayloadAction<any>) => {
            state.data = action.payload;
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
        setEmployeeName: (state, action: PayloadAction<string>) => {
            state.employeeName = action.payload;
        }
    }
});

export const { setData, setFetchAgain, setTimesheet, setWeekDate, setEmployeeName } = TeamSlice.actions;
export default TeamSlice.reducer;
