import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface RoleState {
    value: Array<string>;
}
const initialState: RoleState = {
    //@ts-ignore
    value: window.frappe?.boot?.user?.roles ?? [],
};

const roleSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        setRole: (state, action: PayloadAction<Array<string>>) => {
            state.value = action.payload;
        }
    },

});
export const { setRole } = roleSlice.actions;
export default roleSlice.reducer;
