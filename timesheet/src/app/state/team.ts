import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getTodayDate } from "@/app/lib/utils";
import { DialogInput } from "@/app/types/type";
import { set, update } from "lodash";

interface TeamState {
    data: {
        start_date: string;
        end_date: string;
        dates: Array<string>;
        holiday_map: Array<string>;
        employees: Array<any>;
        empData: any;
    };
    isFetching: boolean;
    weekDate: string;
    isAddTimeDialogOpen: boolean;
    isDialogOpen: boolean;
    isFetchAgain: boolean;
    dialogInput: DialogInput
    timesheet: any
    start: number
    hasMore: boolean
}

const initialState: TeamState = {
    data: {
        start_date: "",
        end_date: "",
        dates: [],
        holiday_map: [],
        employees: [],
        empData: {}
    },
    isFetching: false,
    weekDate: getTodayDate(),
    isAddTimeDialogOpen: false,
    isDialogOpen: false,
    isFetchAgain: false,
    dialogInput: {
        employee: "",
        task: "",
        hours: "",
        description: "",
        date: "",
        is_update: false
    },
    timesheet: {
        employee: "",
        task: "",
        hours: "",
        description: "",
        date: "",
        isUpdate: false,
        name: ""
    },
    start: 0,
    hasMore: true
};

const teamSlice = createSlice({
    name: 'team',
    initialState,
    reducers: {
        setTeam: (state, action: PayloadAction<any>) => {
            return { ...state, data: action.payload }
        },
        updateTeam: (state, action: PayloadAction<any>) => {
            return { ...state, data: { ...state.data, ...action.payload } }
        },
        setDialogInput: (state, action: PayloadAction<DialogInput>) => {
            return { ...state, dialogInput: action.payload };
        },
        setFetching: (state, action: PayloadAction<boolean>) => {
            return { ...state, isFetching: action.payload };
        },
        setWeekDate: (state, action: PayloadAction<string>) => {
            return { ...state, weekDate: action.payload }
        },
        setIsAddTimeDialogOpen: (state, action: PayloadAction<boolean>) => {
            return { ...state, isAddTimeDialogOpen: action.payload }
        },
        setIsDialogOpen: (state, action: PayloadAction<boolean>) => {
            return { ...state, isDialogOpen: action.payload }
        },
        setIsFetchAgain: (state, action: PayloadAction<boolean>) => {
            return { ...state, isFetchAgain: action.payload }
        },
        setTimesheet: (state, action: PayloadAction<any>) => {
            return { ...state, timesheet: action.payload };
        },
        setStart: (state, action: PayloadAction<number>) => {
            return { ...state, start: action.payload }
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            return { ...state, hasMore: action.payload }

        }
    }
});
export const { setDialogInput, setTeam, setFetching, setIsAddTimeDialogOpen, setWeekDate, setIsFetchAgain, setIsDialogOpen, setTimesheet, setStart, setHasMore, updateTeam } = teamSlice.actions;
export default teamSlice.reducer;
