import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface EmployeeListState {
    start_date: string;
    end_date: string;
    dates: Array<{ key: string, dates: Array<string> }>
    data: Array<any>;
    filters?: {
        project?: Array<string>;
        department?: Array<string>;
        employeeName?: string;
    };
}

const initialState: EmployeeListState = {
    start_date: '',
    end_date: '',
    dates: [],
    data: [],
    filters: {
        project: [],
        department: [],
        employeeName: ''
    }
};

const employeeListSlice = createSlice({
    name: 'employeeWeekList',
    initialState,
    reducers: {
        setEmployeeWeekList: (state, action: PayloadAction<EmployeeListState>) => {
            return { ...state, ...action.payload };
        },
        setFilters: (state, action: PayloadAction<{ project?: Array<string>, department?: Array<string>, employeeName?: string }>) => {
            return { ...state, filters: action.payload };
        }

    },

});

export const { setEmployeeWeekList, setFilters } = employeeListSlice.actions;
export default employeeListSlice.reducer;
