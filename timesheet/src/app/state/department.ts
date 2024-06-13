import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface DepartmentProps{
    name: string;
    department_name: string;
}
interface DepartmentState { 
    value: Array<DepartmentProps>;
}

const initialState: DepartmentState = {
    //@ts-ignore
    value: window.frappe?.boot?.departments ?? [],
};

const departmentSlice = createSlice({
    name: 'departments',
    initialState,
    reducers: {
        setDepartment: (state, action: PayloadAction<Array<DepartmentProps>>) => { 
            state.value = action.payload;
        }
    },
    
});

export const { setDepartment } = departmentSlice.actions;   
export default departmentSlice.reducer;
