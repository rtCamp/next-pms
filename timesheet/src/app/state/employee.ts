import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useContext } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
interface EmployeeState { 
    value: string;
}
const initialState: EmployeeState = {
    value: '',
};

const employeeSlice = createSlice({
    name: 'employee',
    initialState,
    reducers: {},
    extraReducers: (builder) => { 
        builder.addCase(fetchEmployee.fulfilled, (state, action: PayloadAction<string>) => {
            state.value = action.payload;
        });
    }
});

export const fetchEmployee = createAsyncThunk(
    'employee/fetchEmployee',
    async () => {
        const { call } = useContext(FrappeContext) as FrappeConfig;
        const res = await call.get("timesheet_enhancer.api.utils.get_employee_from_user");
        return res?.message as string;
    }

)

export default employeeSlice.reducer;


