import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ProjectProps{
    name: string;
    project_name: string;
}
interface ProjectState { 
    value: Array<ProjectProps>;
}

const initialState: ProjectState = {
    //@ts-ignore
    value: window.frappe?.boot?.projects ?? [],
};

const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        setProject: (state, action: PayloadAction<Array<ProjectProps>>) => { 
            state.value = action.payload;
        }
    },
    
});


export const { setProject } = projectSlice.actions;   
export default projectSlice.reducer;
