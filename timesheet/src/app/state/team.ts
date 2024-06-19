import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getTodayDate } from "@/app/lib/utils";
import { DialogInput } from "@/app/types/type";

interface TeamState {
    data: {
        start_date: string;
        end_date: string;
        dates: Array<string>;
        holiday_map: Array<string>;
        [string: string]: any;
        employees: Array<any>;
    };
    isFetching: boolean;
    weekDate: string;
    isAddTimeDialogOpen: boolean;
    isDialogOpen: boolean;
    isFetchAgain: boolean;
    dialogInput: DialogInput
    timesheet: any
}

const initialState: TeamState = {
    data: {
        start_date: "",
        end_date: "",
        dates: [],
        holiday_map: [],
        employees: []
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
        name:""
    }
};

const teamSlice = createSlice({
    name: 'team',
    initialState,
    reducers: {
        setTeam: (state, action: PayloadAction<any>) => {
            return { ...state, data: action.payload }
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
    }
});
export const { setDialogInput, setTeam, setFetching, setIsAddTimeDialogOpen, setWeekDate, setIsFetchAgain, setIsDialogOpen ,setTimesheet} = teamSlice.actions;
export default teamSlice.reducer;
