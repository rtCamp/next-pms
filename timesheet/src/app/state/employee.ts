import { PayloadAction, createSlice } from "@reduxjs/toolkit";
interface EmployeeState { 
    value: string;
}
const initialState: EmployeeState = {
    value: '',
};

const employeeSlice = createSlice({
    name: 'employee',
    initialState,
    reducers: {
        setEmployee: (state, action: PayloadAction<string>) => { 
            state.value = action.payload;
        }
    },
    
});

export const { setEmployee } = employeeSlice.actions;   
export default employeeSlice.reducer;
