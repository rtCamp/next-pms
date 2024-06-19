import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getTodayDate } from "@/app/lib/utils";
import { DialogInput } from "@/app/types/type";
interface EmployeeListState {
    start_date: string;
    end_date: string;
    dates: Array<{ key: string, dates: Array<string> }>
    data: Array<any>;
    isFetching: boolean;
    weekDate: string;
    selectedDepartment: Array<string>;
    selectedProject: Array<string>;
    prevHeading: string;
    curentHeading: string;
    employeeName: string;
    isAddTimeDialogOpen: boolean;
    isEditTimeDialogOpen: boolean;
    isFetchAgain: boolean;
    dialogInput: DialogInput
}


const initialState: EmployeeListState = {
    start_date: '',
    end_date: '',
    dates: [],
    data: [],
    isFetching: false,
    weekDate: getTodayDate(),
    selectedDepartment: [],
    selectedProject: [],
    prevHeading: "",
    curentHeading: "",
    employeeName: "",
    isAddTimeDialogOpen: false,
    isEditTimeDialogOpen: false,
    isFetchAgain: false,
    dialogInput: {
        employee: "",
        task: "",
        hours: "",
        description: "",
        date: "",
        is_update: false

    }
};

const employeeListSlice = createSlice({
    name: 'employeeWeekList',
    initialState,
    reducers: {
        setEmployeeWeekList: (state, action: PayloadAction<EmployeeListState>) => {
            return { ...state, ...action.payload }
        },
        setDialogInput: (state, action: PayloadAction<DialogInput>) => {
            return { ...state, dialogInput: action.payload };
        },
        setFetching: (state, action: PayloadAction<boolean>) => {
            return { ...state, isFetching: action.payload };
        },
        setWeekDate: (state, action: PayloadAction<string>) => {
            return { ...state, weekDate: action.payload };
        },
        setDepartment: (state, action: PayloadAction<Array<string>>) => {
            return { ...state, selectedDepartment: action.payload };
        },
        setProject: (state, action: PayloadAction<Array<string>>) => {
            return { ...state, selectedProject: action.payload };
        },
        setEmployeeName: (state, action: PayloadAction<string>) => {
            return { ...state, employeeName: action.payload };
        },
        setHeading: (state, action: PayloadAction<{ curentHeading: string, prevHeading: string }>) => {
            return { ...state, curentHeading: action.payload.curentHeading, prevHeading: action.payload.prevHeading };
        },
        setIsAddTimeDialogOpen: (state, action: PayloadAction<boolean>) => {
            return { ...state, isAddTimeDialogOpen: action.payload };
        },
        setIsFetchAgain: (state, action: PayloadAction<boolean>) => { 
            return { ...state, isFetchAgain: action.payload };
        },
        setIsEditTimeDialogOpen: (state, action: PayloadAction<boolean>) => { 
            return { ...state, isEditTimeDialogOpen: action.payload };
        }

    },

});

export const { setEmployeeWeekList, setDialogInput, setFetching, setDepartment, setEmployeeName, setHeading, setIsAddTimeDialogOpen, setProject, setWeekDate ,setIsFetchAgain,setIsEditTimeDialogOpen} = employeeListSlice.actions;
export default employeeListSlice.reducer;
